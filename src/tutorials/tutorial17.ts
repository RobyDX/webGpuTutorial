/**
 * Query Set
 * 
 * Utilizzo di funzionalità di analisi
 */

import { baseRendering } from "../utility/baseRendering";
import { Mat4, mat4 } from 'wgpu-matrix'

export class Tutorial17 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //buffer che contiene i vertici della forma
    private _vertexBuffer: GPUBuffer = null!;

    //buffer che contiene gli indici della forma
    private _indexBuffer: GPUBuffer = null!;

    //buffer che contiene i dati che vengono passati allo shader
    private _uniformBuffer: GPUBuffer = null!;

    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader
    private _bindGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;

    //texture
    private _texture: GPUTexture = null!;

    //sampler
    private _sampler: GPUSampler = null!;

    //binding group per il sampler e per la texture
    private _textureBindGroup: GPUBindGroup = null!;

    //query set
    private _querySet: GPUQuerySet = null!;

    //buffer contenente i risultati
    private _queryBuffer: GPUBuffer = null!;

    //buffer per i contenuti
    private _resultBuffer: GPUBuffer = null!;

    private shader: string = `

        struct Vertex {
            @location(0) position: vec3f,
            @location(1) texcoord: vec2f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f ,
            @location(0) texcoord: vec2f,
        };

        struct Transform
        {
            world:mat4x4f
        }

        @group(0) @binding(0) var<uniform> transform: Transform;

        @group(1) @binding(0) var textureSampler: sampler;
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;

        @vertex fn vs(v:Vertex) -> VertexOut 
        {
            var vOut:VertexOut;
            vOut.position=transform.world *vec4f(v.position, 1.0);
            vOut.texcoord=v.texcoord;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);
        }
    `;


    async init() {
        //ottengo il device associato alla scheda video
        const adapter = await navigator.gpu?.requestAdapter();


        const device = await adapter?.requestDevice({
            requiredFeatures: ['timestamp-query']
        });

        if (!device) {
            alert("browser o dispositivo non compatibile")
            return;
        }

        this._device = device;

        //individua la canvas
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert("canvas non presente nella pagina")
            return;
        }

        //riceve il context associato alla canvas
        const context = canvas.getContext('webgpu');

        if (!context) {
            alert("browser o dispositivo non compatibile")
            return;
        }
        this._context = context;

        //configura il device associandolo alla canvas usata per il rendering
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this._context.configure({
            device: this._device,
            format: presentationFormat,
        });

        //definisce gli 8 vertici di un cubo
        const vertexData: number[] = [
            // Front face
            -0.5, -0.5, 0.5, 0, 1,
            0.5, -0.5, 0.5, 1, 1,
            0.5, 0.5, 0.5, 1, 0,
            -0.5, 0.5, 0.5, 0, 0,

            // Back face
            -0.5, -0.5, -0.5, 1, 1,
            -0.5, 0.5, -0.5, 1, 0,
            0.5, 0.5, -0.5, 0, 0,
            0.5, -0.5, -0.5, 0, 1,

            // Top face
            -0.5, 0.5, -0.5, 0, 1,
            -0.5, 0.5, 0.5, 0, 0,
            0.5, 0.5, 0.5, 1, 0,
            0.5, 0.5, -0.5, 1, 1,

            // Bottom face
            -0.5, -0.5, -0.5, 1, 1,
            0.5, -0.5, -0.5, 0, 1,
            0.5, -0.5, 0.5, 0, 0,
            -0.5, -0.5, 0.5, 1, 0,

            // Right face
            0.5, -0.5, -0.5, 1, 1,
            0.5, 0.5, -0.5, 1, 0,
            0.5, 0.5, 0.5, 0, 0,
            0.5, -0.5, 0.5, 0, 1,

            // Left face
            -0.5, -0.5, -0.5, 0, 1,
            -0.5, -0.5, 0.5, 1, 1,
            -0.5, 0.5, 0.5, 1, 0,
            -0.5, 0.5, -0.5, 0, 0,
        ];

        //crea un vertex buffer
        this._vertexBuffer = device.createBuffer({
            size: vertexData.length * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        //copia le informazioni all'interno del buffer
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));

        //definisce l'ordine con cui ordinare i vertici per creare un cubo
        const indexData: number[] = [
            0, 1, 2, 2, 3, 0,   // Front face
            4, 5, 6, 6, 7, 4,   // Back face
            8, 9, 10, 10, 11, 8,   // Top face
            12, 13, 14, 14, 15, 12,   // Bottom face
            16, 17, 18, 18, 19, 16,   // Right face
            20, 21, 22, 22, 23, 20,   // Left face
        ];

        //crea un index buffer
        this._indexBuffer = device.createBuffer({
            size: indexData.length * 4,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        //copia le informazioni all'interno del buffer
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));

        //uniform shader
        this._uniformBuffer = device.createBuffer({
            size: 64,//dimensione di una matrice (16 valori da 4 byte)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //creazione di una texture da utilizzare per lo ZBuffer
        this._depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //crea lo shader
        const module = device.createShaderModule({ code: this.shader });

        //crea la pipeline
        this._pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module,
                buffers: [
                    {
                        arrayStride: 20,// dimensione di ogni vertice
                        attributes: [
                            {
                                shaderLocation: 0, offset: 0, format: 'float32x3',
                            },
                            {
                                shaderLocation: 1, offset: 12, format: 'float32x2',
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module,
                targets: [{ format: presentationFormat }],
            },
            //regole per l'applicazione dello ZBuffer
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

        //carica un'immagine da file
        const res = await fetch("../logo_njc.png");
        const blob = await res.blob();
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });

        //inizializza una texture della dimensione e formato uguale all'immagine caricata
        this._texture = this._device.createTexture({
            format: 'rgba8unorm',
            size: [source.width, source.height, 1],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //copia l'immagine nella texture
        this._device.queue.copyExternalImageToTexture(
            { source, flipY: false },
            { texture: this._texture },
            { width: source.width, height: source.height },
        );

        //crea un sampler (come la texture viene applicata al modello)
        this._sampler = this._device.createSampler({
            minFilter: "linear",
            magFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "repeat"
        });

        this._textureBindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this._sampler },
                { binding: 1, resource: this._texture.createView() }
            ],
        });


        this._querySet = device.createQuerySet({
            type: "timestamp",  // Tipo di query
            count: 2,          // Numero massimo di query
        });

        //crea un buffer per contenere il valore
        this._queryBuffer = this._device.createBuffer({
            size: 2 * 8,  // 8 byte (un valore a 64 bit)
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });

        this._resultBuffer = device.createBuffer({
            size: this._queryBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

    }


    lastTick: number = performance.now();
    average: number = 0;
    count: number = 0;
    increase: number = 0;

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //definisce le caratteristiche del render pass
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this._depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
            timestampWrites: {
                querySet: this._querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1
            }
        };

        // si inizia un render pass, una sequenza di operazioni
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        //imposta la pipeline da eseguire
        pass.setPipeline(this._pipeline);

        //imposta il vertex buffer nel pass
        pass.setVertexBuffer(0, this._vertexBuffer);

        //imposta l'index buffer nel pass
        pass.setIndexBuffer(this._indexBuffer, 'uint32');

        {
            //crea una matrice di rotazione
            let world: Mat4 = mat4.identity();
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);

            //crea una matrice associata alla camera
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);

            //crea una matrice di proiezione
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);

            //crea la matrice di trasformazione (prodotto tra le matrici)
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));

            //scrive il contenuto nell'uniform buffer
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);

            //associa il bindgroup
            pass.setBindGroup(0, this._bindGroup);

            pass.setBindGroup(1, this._textureBindGroup);

            //renderizza 6 indici
            pass.drawIndexed(36);

        }

        //termine del render pass
        pass.end();

        //cattura i risultati
        encoder.resolveQuerySet(this._querySet, 0, this._querySet.count, this._queryBuffer, 0);

        if (this._resultBuffer.mapState == "unmapped") {
            encoder.copyBufferToBuffer(this._queryBuffer, 0, this._resultBuffer, 0, this._resultBuffer.size);
        }

        //submit dell'encoder, viene inviata la sequenza dei comandi registrati
        this._device.queue.submit([encoder.finish()]);


        //copia i dati nel query set
        if (this._resultBuffer.mapState == "unmapped") {

            this._resultBuffer.mapAsync(GPUMapMode.READ, 0, this._resultBuffer.size).then(() => {
                const times = new BigUint64Array(this._resultBuffer.getMappedRange(0, this._resultBuffer.size));

                //calcola la performance media del pass
                const gpuTime = Number(times[1] - times[0]);
                this.increase += gpuTime;
                this.count++;
                if (performance.now() - this.lastTick >= 1000) {
                    this.average = this.increase / this.count;
                    this.count = 0;
                    this.increase = 0;
                    this.lastTick = performance.now();
                }

                document.querySelector("p")!.innerHTML = "Tempo di Rendering: " + Math.ceil(this.average / 1000) + " Microsecondi";
                this._resultBuffer.unmap();
            });
        }

        //richiedi un nuovo frame
        this.frameId = requestAnimationFrame(() => this.draw());
    }

    async destroy(): Promise<void> {
        //interrompi il rendering
        cancelAnimationFrame(this.frameId);

        //elimina immediatamente tutte le risorse per non lasciarle in memoria
        await this._device.queue.onSubmittedWorkDone();

        this._vertexBuffer.destroy();
        this._indexBuffer.destroy();
        this._uniformBuffer.destroy();
        this._depthTexture.destroy();
        this._texture.destroy();

        this._context.unconfigure();
    }


}