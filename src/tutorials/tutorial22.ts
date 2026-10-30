/**
 * Caricamento di un modello glTF
 *
 * Fino ad ora i modelli sono stati scritti a mano o generati da codice. I modelli reali vengono creati
 * con programmi di modellazione (Blender...) ed esportati in un file: glTF è il formato standard per farlo.
 *
 * Il file public/model.glb contiene un nodo toroidale. Il caricamento è nel file utility/gltf.ts:
 * il file viene letto, i suoi vertici ed indici vengono convertiti nel formato usato dai tutorial
 * (posizione, normale, uv) e da quel momento il disegno è identico a quello dei tutorial precedenti.
 * L'illuminazione è quella del tutorial 20.
 *
 * NOTA: dal tutorial 03 l'inizializzazione di WebGPU è nella funzione initWebGpu() di utility/webgpuInit.ts
 */

import { baseRendering } from "../utility/baseRendering";
import { initWebGpu, createShader } from "../utility/webgpuInit";
import { Mat4, mat4, vec3 } from 'wgpu-matrix'
import { createGpuMesh, GpuMesh, vertexBufferLayout } from "../utility/geometry";
import { loadGltf } from "../utility/gltf";

export class Tutorial22 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //il modello caricato dal file glTF
    private _mesh: GpuMesh = null!;

    //buffer che contiene i dati che vengono passati allo shader
    private _uniformBuffer: GPUBuffer = null!;

    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader
    private _bindGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;

    private shader: string = `

        struct Vertex {
            @location(0) position: vec3f,
            @location(1) normal: vec3f,
            @location(2) texcoord: vec2f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f,
            @location(0) worldPosition: vec3f,
            @location(1) normal: vec3f,
            @location(2) texcoord: vec2f,
        };

        struct Uniforms
        {
            viewProjection: mat4x4f,
            world: mat4x4f,
            cameraPosition: vec4f,
            lightPosition: vec4f,
            color: vec4f
        }

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        @vertex fn vs(v:Vertex) -> VertexOut
        {
            let worldPosition = uniforms.world * vec4f(v.position, 1.0);

            var vOut:VertexOut;
            vOut.position = uniforms.viewProjection * worldPosition;
            vOut.worldPosition = worldPosition.xyz;
            vOut.normal = (uniforms.world * vec4f(v.normal, 0.0)).xyz;
            vOut.texcoord = v.texcoord;
            return vOut;
        }

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            let normal = normalize(v.normal);
            let toLight = normalize(uniforms.lightPosition.xyz - v.worldPosition);
            let toCamera = normalize(uniforms.cameraPosition.xyz - v.worldPosition);

            let ambient = 0.2;
            let diffuse = max(dot(normal, toLight), 0.0);
            var specular = pow(max(dot(normal, normalize(toLight + toCamera)), 0.0), 64.0);
            if (diffuse <= 0.0) {
                specular = 0.0;
            }

            //le coordinate texture del modello sono disponibili: qui le usiamo per tracciare delle strisce
            let stripes = 0.75 + 0.25 * step(0.5, fract(v.texcoord.x * 4.0));

            let color = uniforms.color.rgb * stripes * (ambient + diffuse) + vec3f(1.0) * specular * 0.5;
            return vec4f(color, 1.0);
        }
    `;

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, canvas, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

        //carica il modello dal file. BASE_URL permette al sito di funzionare anche in una sottocartella
        const model = await loadGltf(import.meta.env.BASE_URL + "model.glb");
        this._mesh = createGpuMesh(device, model);

        document.querySelector("p")!.innerHTML =
            `Modello caricato da model.glb: ${model.vertices.length / 8} vertici, ${model.indices.length / 3} triangoli`;

        //uniform buffer: 2 matrici (128 byte) + camera, luce e colore (3 x 16 byte)
        this._uniformBuffer = device.createBuffer({
            size: 176,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //creazione di una texture da utilizzare per lo ZBuffer
        this._depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //crea lo shader
        const module = await createShader(device, this.shader);

        //crea la pipeline
        this._pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module,
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module,
                targets: [{ format: presentationFormat }],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            },
        });

        //creazione bind group
        this._bindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformBuffer } },
            ],
        });
    }

    draw() {
        const time = performance.now() / 1000.0;

        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0.05, 0.05, 0.1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this._depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        };

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(this._pipeline);
        pass.setVertexBuffer(0, this._mesh.vertexBuffer);
        pass.setIndexBuffer(this._mesh.indexBuffer, 'uint32');

        //il modello ruota su se stesso
        const world: Mat4 = mat4.identity();
        mat4.rotateY(world, time * 0.6, world);
        mat4.rotateX(world, 0.4, world);

        //camera e proiezione
        const cameraPosition = vec3.fromValues(0, 0.5, 3.5);
        const view: Mat4 = mat4.lookAt(cameraPosition, [0, 0, 0], [0, 1, 0]);
        const projection: Mat4 = mat4.perspective(Math.PI / 3, this._context.canvas.width / this._context.canvas.height, 0.1, 100);
        const viewProjection: Mat4 = mat4.multiply(projection, view);

        //luce fissa in alto a destra
        const lightPosition = vec3.fromValues(3, 4, 4);

        //scrive i dati nell'uniform buffer
        this._device.queue.writeBuffer(this._uniformBuffer, 0, viewProjection);
        this._device.queue.writeBuffer(this._uniformBuffer, 64, world);
        this._device.queue.writeBuffer(this._uniformBuffer, 128, new Float32Array([...cameraPosition, 1]));
        this._device.queue.writeBuffer(this._uniformBuffer, 144, new Float32Array([...lightPosition, 1]));
        this._device.queue.writeBuffer(this._uniformBuffer, 160, new Float32Array([0.9, 0.55, 0.15, 1]));

        pass.setBindGroup(0, this._bindGroup);
        pass.drawIndexed(this._mesh.indexCount);

        pass.end();

        //submit dell'encoder, viene inviata la sequenza dei comandi registrati
        this._device.queue.submit([encoder.finish()]);

        //richiedi un nuovo frame
        this.frameId = requestAnimationFrame(() => this.draw());
    }

    async destroy(): Promise<void> {
        //interrompi il rendering
        cancelAnimationFrame(this.frameId);

        //elimina immediatamente tutte le risorse per non lasciarle in memoria
        await this._device.queue.onSubmittedWorkDone();

        this._mesh.destroy();
        this._uniformBuffer.destroy();
        this._depthTexture.destroy();

        this._context.unconfigure();
    }
}
