/**
 * Illuminazione
 *
 * Calcolo della luce per ogni pixel (modello di Blinn-Phong).
 * Il colore finale di un pixel è la somma di tre componenti:
 *  - ambiente: una luce minima uniforme, per non avere zone completamente nere
 *  - diffusa: dipende dall'angolo tra la normale della superficie e la direzione della luce
 *  - speculare: il riflesso brillante della luce, dipende dalla posizione della camera
 *
 * La piccola sfera gialla indica la posizione della luce, che ruota attorno agli oggetti.
 *
 * NOTA: dal tutorial 03 l'inizializzazione di WebGPU è nella funzione initWebGpu() di utility/webgpuInit.ts
 */

import { baseRendering } from "../utility/baseRendering";
import { initWebGpu, createShader } from "../utility/webgpuInit";
import { Mat4, mat4, vec3 } from 'wgpu-matrix'
import { createCube, createSphere, createPlane, createGpuMesh, GpuMesh, vertexBufferLayout } from "../utility/geometry";

//un oggetto della scena: la sua geometria, il colore e il buffer che contiene la sua matrice
interface SceneObject {
    mesh: GpuMesh;
    color: number[];
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
}

export class Tutorial20 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //dati comuni a tutta la scena: camera e luce
    private _sceneBuffer: GPUBuffer = null!;
    private _sceneBindGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;

    //geometrie condivise
    private _meshes: GpuMesh[] = [];

    //oggetti della scena
    private _floor: SceneObject = null!;
    private _cube: SceneObject = null!;
    private _sphere: SceneObject = null!;
    private _lightMarker: SceneObject = null!;

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
        };

        //dati della scena: uguali per tutti gli oggetti
        struct Scene
        {
            viewProjection: mat4x4f,
            cameraPosition: vec4f,
            lightPosition: vec4f
        }

        //dati dell'oggetto: la sua matrice world ed il suo colore
        struct Obj
        {
            world: mat4x4f,
            color: vec4f
        }

        @group(0) @binding(0) var<uniform> scene: Scene;
        @group(1) @binding(0) var<uniform> obj: Obj;

        @vertex fn vs(v:Vertex) -> VertexOut
        {
            //posizione del vertice nel mondo (serve per calcolare la direzione verso la luce)
            let worldPosition = obj.world * vec4f(v.position, 1.0);

            var vOut:VertexOut;
            vOut.position = scene.viewProjection * worldPosition;
            vOut.worldPosition = worldPosition.xyz;

            //anche la normale deve ruotare insieme all'oggetto (w=0: le normali sono direzioni, non vengono traslate)
            vOut.normal = (obj.world * vec4f(v.normal, 0.0)).xyz;
            return vOut;
        }

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {

            //se il canale alpha del colore è 0 l'oggetto non riceve illuminazione (serve per il marcatore della luce)
            if (obj.color.a < 0.5) {
                return vec4f(obj.color.rgb, 1.0);
            }

            //dopo l'interpolazione tra i vertici la normale non ha più lunghezza 1
            let normal = normalize(v.normal);

            //direzione dal pixel verso la luce e dal pixel verso la camera
            let toLight = normalize(scene.lightPosition.xyz - v.worldPosition);
            let toCamera = normalize(scene.cameraPosition.xyz - v.worldPosition);

            //luce ambiente
            let ambient = 0.15;

            //luce diffusa: massima quando la superficie è rivolta verso la luce (coseno dell'angolo)
            let diffuse = max(dot(normal, toLight), 0.0);

            //luce speculare (Blinn-Phong): usa il vettore a metà strada tra luce e camera.
            //l'esponente controlla la dimensione del riflesso (più alto = più piccolo e lucido)
            let halfVector = normalize(toLight + toCamera);
            var specular = pow(max(dot(normal, halfVector), 0.0), 64.0);
            if (diffuse <= 0.0) {
                specular = 0.0;
            }

            let color = obj.color.rgb * (ambient + diffuse) + vec3f(1.0) * specular * 0.5;
            return vec4f(color, 1.0);
        }
    `;

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, canvas, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

        //geometrie: vengono generate da utility/geometry.ts, con le normali
        const cubeMesh = createGpuMesh(device, createCube());
        const sphereMesh = createGpuMesh(device, createSphere(0.5, 32));
        const planeMesh = createGpuMesh(device, createPlane(10));
        this._meshes = [cubeMesh, sphereMesh, planeMesh];

        //uniform buffer della scena: matrice (64 byte) + posizione camera (16) + posizione luce (16)
        this._sceneBuffer = device.createBuffer({
            size: 96,
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

        //bind group della scena (gruppo 0)
        this._sceneBindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._sceneBuffer } },
            ],
        });

        //ogni oggetto ha il proprio uniform buffer (matrice 64 byte + colore 16 byte) e bind group (gruppo 1)
        const createObject = (mesh: GpuMesh, color: number[]): SceneObject => {
            const uniformBuffer = device.createBuffer({
                size: 80,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            const bindGroup = device.createBindGroup({
                layout: this._pipeline.getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                ],
            });
            return { mesh, color, uniformBuffer, bindGroup };
        };

        this._floor = createObject(planeMesh, [0.6, 0.6, 0.65, 1]);
        this._cube = createObject(cubeMesh, [0.2, 0.5, 1, 1]);
        this._sphere = createObject(sphereMesh, [1, 0.25, 0.25, 1]);
        this._lightMarker = createObject(sphereMesh, [1, 1, 0.2, 0]);  //alpha 0 = non illuminato
    }

    //scrive la matrice world ed il colore dell'oggetto, poi lo disegna
    private drawObject(pass: GPURenderPassEncoder, o: SceneObject, world: Mat4) {
        this._device.queue.writeBuffer(o.uniformBuffer, 0, world);
        this._device.queue.writeBuffer(o.uniformBuffer, 64, new Float32Array(o.color));

        pass.setVertexBuffer(0, o.mesh.vertexBuffer);
        pass.setIndexBuffer(o.mesh.indexBuffer, 'uint32');
        pass.setBindGroup(1, o.bindGroup);
        pass.drawIndexed(o.mesh.indexCount);
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

        //camera e proiezione
        const cameraPosition = vec3.fromValues(0, 3, 6);
        const view: Mat4 = mat4.lookAt(cameraPosition, [0, 0.5, 0], [0, 1, 0]);
        const projection: Mat4 = mat4.perspective(Math.PI / 3, this._context.canvas.width / this._context.canvas.height, 0.1, 100);
        const viewProjection: Mat4 = mat4.multiply(projection, view);

        //la luce gira attorno agli oggetti
        const lightPosition = vec3.fromValues(Math.cos(time) * 3.5, 2.5, Math.sin(time) * 3.5);

        //scrive i dati della scena
        this._device.queue.writeBuffer(this._sceneBuffer, 0, viewProjection);
        this._device.queue.writeBuffer(this._sceneBuffer, 64, new Float32Array([...cameraPosition, 1]));
        this._device.queue.writeBuffer(this._sceneBuffer, 80, new Float32Array([...lightPosition, 1]));
        pass.setBindGroup(0, this._sceneBindGroup);

        //pavimento
        this.drawObject(pass, this._floor, mat4.identity());

        //cubo che ruota
        let cubeWorld: Mat4 = mat4.translation([-1.3, 0.5, 0]);
        mat4.rotateY(cubeWorld, time * 0.5, cubeWorld);
        this.drawObject(pass, this._cube, cubeWorld);

        //sfera: il raggio è 0.5, ingrandita di 1.2 volte arriva a 0.6 e quindi appoggia sul pavimento
        let sphereWorld: Mat4 = mat4.translation([1.3, 0.6, 0]);
        mat4.scale(sphereWorld, [1.2, 1.2, 1.2], sphereWorld);
        this.drawObject(pass, this._sphere, sphereWorld);

        //marcatore della posizione della luce
        let markerWorld: Mat4 = mat4.translation(lightPosition);
        mat4.scale(markerWorld, [0.2, 0.2, 0.2], markerWorld);
        this.drawObject(pass, this._lightMarker, markerWorld);

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

        this._meshes.forEach(m => m.destroy());
        this._sceneBuffer.destroy();
        [this._floor, this._cube, this._sphere, this._lightMarker].forEach(o => o.uniformBuffer.destroy());
        this._depthTexture.destroy();

        this._context.unconfigure();
    }
}
