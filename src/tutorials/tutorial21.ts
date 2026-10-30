/**
 * Shadow Map
 *
 * Le ombre si ottengono con due render pass:
 *  1) la scena viene disegnata dal punto di vista della LUCE, salvando solo la profondità in una texture
 *     (la shadow map: per ogni direzione, quanto è lontano il primo oggetto illuminato)
 *  2) la scena viene disegnata dalla camera. Per ogni pixel si calcola la sua posizione vista dalla luce
 *     e la si confronta con la shadow map: se nella shadow map c'è qualcosa di più vicino alla luce,
 *     il pixel è in ombra.
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

export class Tutorial21 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //pipeline del primo pass (disegno dalla luce) e del secondo (disegno dalla camera)
    private _shadowPipeline: GPURenderPipeline = null!;
    private _pipeline: GPURenderPipeline = null!;

    //dati comuni a tutta la scena: camera, luce e matrici
    private _sceneBuffer: GPUBuffer = null!;
    private _sceneBindGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer della camera
    private _depthTexture: GPUTexture = null!;

    //la shadow map: texture di profondità disegnata dal punto di vista della luce
    private _shadowTexture: GPUTexture = null!;

    //dimensione (in pixel per lato) della shadow map: più è grande più le ombre sono nitide
    private readonly shadowSize: number = 2048;

    //sampler di confronto: invece di restituire la profondità, confronta un valore con quello nella texture
    private _shadowSampler: GPUSampler = null!;

    //binding group con shadow map e sampler
    private _shadowBindGroup: GPUBindGroup = null!;

    //geometrie condivise
    private _meshes: GpuMesh[] = [];

    //oggetti della scena
    private _objects: SceneObject[] = [];

    //shader del primo pass: serve solo la posizione dei vertici vista dalla luce, non c'è un fragment shader
    private shadowShader: string = `

        struct Scene
        {
            viewProjection: mat4x4f,
            lightViewProjection: mat4x4f,
            cameraPosition: vec4f,
            lightPosition: vec4f
        }

        struct Obj
        {
            world: mat4x4f,
            color: vec4f
        }

        @group(0) @binding(0) var<uniform> scene: Scene;
        @group(1) @binding(0) var<uniform> obj: Obj;

        @vertex fn vs(@location(0) position: vec3f) -> @builtin(position) vec4f
        {
            return scene.lightViewProjection * obj.world * vec4f(position, 1.0);
        }
    `;

    //shader del secondo pass: illuminazione come nel tutorial 20, moltiplicata per la visibilità dalla luce
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

        struct Scene
        {
            viewProjection: mat4x4f,
            lightViewProjection: mat4x4f,
            cameraPosition: vec4f,
            lightPosition: vec4f
        }

        struct Obj
        {
            world: mat4x4f,
            color: vec4f
        }

        @group(0) @binding(0) var<uniform> scene: Scene;
        @group(1) @binding(0) var<uniform> obj: Obj;
        @group(2) @binding(0) var shadowMap: texture_depth_2d;
        @group(2) @binding(1) var shadowSampler: sampler_comparison;

        @vertex fn vs(v:Vertex) -> VertexOut
        {
            let worldPosition = obj.world * vec4f(v.position, 1.0);

            var vOut:VertexOut;
            vOut.position = scene.viewProjection * worldPosition;
            vOut.worldPosition = worldPosition.xyz;
            vOut.normal = (obj.world * vec4f(v.normal, 0.0)).xyz;
            return vOut;
        }

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {

            //posizione del pixel vista dalla luce
            let lightClip = scene.lightViewProjection * vec4f(v.worldPosition, 1.0);
            let lightNdc = lightClip.xyz / lightClip.w;

            //da coordinate dello schermo (-1..1, y verso l'alto) a coordinate texture (0..1, y verso il basso)
            let shadowUv = vec2f(lightNdc.x * 0.5 + 0.5, 0.5 - lightNdc.y * 0.5);

            //dimensione di un pixel della shadow map in coordinate texture
            let texelSize = ${1.0 / this.shadowSize};

            //textureSampleCompare confronta la profondità del pixel (meno un piccolo bias, per evitare
            //ombre sbagliate sulla superficie stessa) con quella salvata nella shadow map:
            //restituisce 1 se il pixel è illuminato, 0 se è in ombra.
            //Si fa la media di 9 campioni vicini (PCF) per ammorbidire i bordi dell'ombra.
            var visibility = 0.0;
            for (var y = -1; y <= 1; y++) {
                for (var x = -1; x <= 1; x++) {
                    let offset = vec2f(f32(x), f32(y)) * texelSize;
                    visibility += textureSampleCompare(shadowMap, shadowSampler, shadowUv + offset, lightNdc.z - 0.003);
                }
            }
            visibility = visibility / 9.0;

            //i pixel fuori dall'area vista dalla luce non hanno informazioni: li consideriamo illuminati
            if (shadowUv.x < 0.0 || shadowUv.x > 1.0 || shadowUv.y < 0.0 || shadowUv.y > 1.0 || lightNdc.z > 1.0) {
                visibility = 1.0;
            }

            //illuminazione (vedi tutorial 20)
            let normal = normalize(v.normal);
            let toLight = normalize(scene.lightPosition.xyz - v.worldPosition);
            let toCamera = normalize(scene.cameraPosition.xyz - v.worldPosition);

            let ambient = 0.2;
            let diffuse = max(dot(normal, toLight), 0.0);
            var specular = pow(max(dot(normal, normalize(toLight + toCamera)), 0.0), 64.0);
            if (diffuse <= 0.0) {
                specular = 0.0;
            }

            //l'ombra elimina la luce diffusa e speculare, ma non quella ambiente
            let color = obj.color.rgb * (ambient + diffuse * visibility) + vec3f(1.0) * specular * 0.4 * visibility;
            return vec4f(color, 1.0);
        }
    `;

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, canvas, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

        document.querySelector("p")!.innerHTML = "La luce ruota attorno alla scena: osserva come si muovono le ombre.";

        //geometrie
        const cubeMesh = createGpuMesh(device, createCube());
        const sphereMesh = createGpuMesh(device, createSphere(0.5, 32));
        const planeMesh = createGpuMesh(device, createPlane(12));
        this._meshes = [cubeMesh, sphereMesh, planeMesh];

        //uniform buffer della scena: 2 matrici (128 byte) + posizione camera (16) + posizione luce (16)
        this._sceneBuffer = device.createBuffer({
            size: 160,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //ZBuffer della camera
        this._depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //shadow map: una texture di profondità che è sia render target (primo pass) che texture letta dallo shader (secondo pass)
        this._shadowTexture = device.createTexture({
            size: [this.shadowSize, this.shadowSize],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        //sampler di confronto: compare 'less' restituisce 1 se il valore passato è minore di quello nella texture
        this._shadowSampler = device.createSampler({
            compare: 'less',
            minFilter: 'linear',
            magFilter: 'linear',
        });

        //i layout dei bind group vengono definiti a mano, perché le due pipeline condividono gli stessi bind group
        const sceneLayout = device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }]
        });
        const objectLayout = device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }]
        });
        const shadowLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } },
            ]
        });

        //pipeline del primo pass: solo vertex shader, scrive solo la profondità
        const shadowModule = await createShader(device, this.shadowShader);
        this._shadowPipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [sceneLayout, objectLayout] }),
            vertex: {
                module: shadowModule,
                buffers: [vertexBufferLayout]
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float',
                //bias: sposta leggermente la profondità scritta per ridurre le ombre errate sulle superfici
                depthBias: 1,
                depthBiasSlopeScale: 1.5,
            },
        });

        //pipeline del secondo pass: disegno normale dalla camera
        const module = await createShader(device, this.shader);
        this._pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [sceneLayout, objectLayout, shadowLayout] }),
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

        //bind group
        this._sceneBindGroup = device.createBindGroup({
            layout: sceneLayout,
            entries: [{ binding: 0, resource: { buffer: this._sceneBuffer } }],
        });

        this._shadowBindGroup = device.createBindGroup({
            layout: shadowLayout,
            entries: [
                { binding: 0, resource: this._shadowTexture.createView() },
                { binding: 1, resource: this._shadowSampler },
            ],
        });

        //ogni oggetto ha il proprio uniform buffer (matrice 64 byte + colore 16 byte) e bind group
        const createObject = (mesh: GpuMesh, color: number[]): SceneObject => {
            const uniformBuffer = device.createBuffer({
                size: 80,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            const bindGroup = device.createBindGroup({
                layout: objectLayout,
                entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
            });
            return { mesh, color, uniformBuffer, bindGroup };
        };

        //ordine: pavimento, cubo, sfera, cubo sospeso
        this._objects = [
            createObject(planeMesh, [0.7, 0.7, 0.72, 1]),
            createObject(cubeMesh, [0.2, 0.5, 1, 1]),
            createObject(sphereMesh, [1, 0.3, 0.3, 1]),
            createObject(cubeMesh, [0.3, 0.9, 0.4, 1]),
        ];
    }

    //disegna tutti gli oggetti con la pipeline già impostata nel pass
    private drawObjects(pass: GPURenderPassEncoder) {
        for (const o of this._objects) {
            pass.setVertexBuffer(0, o.mesh.vertexBuffer);
            pass.setIndexBuffer(o.mesh.indexBuffer, 'uint32');
            pass.setBindGroup(1, o.bindGroup);
            pass.drawIndexed(o.mesh.indexCount);
        }
    }

    draw() {
        const time = performance.now() / 1000.0;

        //matrici world degli oggetti
        const worlds: Mat4[] = [];
        worlds.push(mat4.identity());

        const cube: Mat4 = mat4.translation([-1.6, 0.5, 0.3]);
        mat4.rotateY(cube, time * 0.4, cube);
        worlds.push(cube);

        const sphere: Mat4 = mat4.translation([1.5, 0.7, 0.5]);
        mat4.scale(sphere, [1.4, 1.4, 1.4], sphere);
        worlds.push(sphere);

        const floating: Mat4 = mat4.translation([0, 2 + Math.sin(time) * 0.3, -1.5]);
        mat4.rotateY(floating, time, floating);
        mat4.rotateX(floating, time * 0.7, floating);
        mat4.scale(floating, [0.8, 0.8, 0.8], floating);
        worlds.push(floating);

        //camera
        const cameraPosition = vec3.fromValues(0, 4.5, 7);
        const view: Mat4 = mat4.lookAt(cameraPosition, [0, 0.3, 0], [0, 1, 0]);
        const projection: Mat4 = mat4.perspective(Math.PI / 3, this._context.canvas.width / this._context.canvas.height, 0.1, 100);
        const viewProjection: Mat4 = mat4.multiply(projection, view);

        //luce: ruota attorno alla scena, guarda verso il centro
        const lightPosition = vec3.fromValues(Math.cos(time * 0.5) * 5, 7, Math.sin(time * 0.5) * 5);
        const lightView: Mat4 = mat4.lookAt(lightPosition, [0, 0, 0], [0, 1, 0]);

        //proiezione ortogonale: i raggi della luce sono paralleli (luce direzionale, come il sole).
        //il volume (-8..8, 0.1..25) deve contenere tutta la parte di scena che deve proiettare ombre
        const lightProjection: Mat4 = mat4.ortho(-8, 8, -8, 8, 0.1, 25);
        const lightViewProjection: Mat4 = mat4.multiply(lightProjection, lightView);

        //scrive i dati nei buffer
        this._device.queue.writeBuffer(this._sceneBuffer, 0, viewProjection);
        this._device.queue.writeBuffer(this._sceneBuffer, 64, lightViewProjection);
        this._device.queue.writeBuffer(this._sceneBuffer, 128, new Float32Array([...cameraPosition, 1]));
        this._device.queue.writeBuffer(this._sceneBuffer, 144, new Float32Array([...lightPosition, 1]));

        this._objects.forEach((o, i) => {
            this._device.queue.writeBuffer(o.uniformBuffer, 0, worlds[i]);
            this._device.queue.writeBuffer(o.uniformBuffer, 64, new Float32Array(o.color));
        });

        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //PRIMO PASS: disegno dalla luce. Non ci sono colori, solo la shadow map come depth attachment
        {
            const shadowPass = encoder.beginRenderPass({
                colorAttachments: [],
                depthStencilAttachment: {
                    view: this._shadowTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                }
            });
            shadowPass.setPipeline(this._shadowPipeline);
            shadowPass.setBindGroup(0, this._sceneBindGroup);
            this.drawObjects(shadowPass);
            shadowPass.end();
        }

        //SECONDO PASS: disegno dalla camera, leggendo la shadow map
        {
            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this._context.getCurrentTexture().createView(),
                        clearValue: [0.5, 0.7, 1, 1],
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
            });
            pass.setPipeline(this._pipeline);
            pass.setBindGroup(0, this._sceneBindGroup);
            pass.setBindGroup(2, this._shadowBindGroup);
            this.drawObjects(pass);
            pass.end();
        }

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
        this._objects.forEach(o => o.uniformBuffer.destroy());
        this._depthTexture.destroy();
        this._shadowTexture.destroy();

        this._context.unconfigure();
    }
}
