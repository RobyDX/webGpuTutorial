/**
 * Depth Buffer
 * 
 * Gestione della profondità tramite ZBuffer
 */

import { baseRendering } from "../utility/baseRendering";
import { Mat4, mat4, vec3 } from 'wgpu-matrix'

export class Tutorial06 extends baseRendering {

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

    //buffer che contengono i dati che vengono passati allo shader
    private _uniformBuffer1: GPUBuffer = null!;
    private _uniformBuffer2: GPUBuffer = null!;

    //binding group, definiscono come i dati nell'uniform buffer vengono associati allo shader
    private _bindGroup1: GPUBindGroup = null!;
    private _bindGroup2: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;


    private shader: string = `

        struct Vertex {
            @location(0) position: vec2f,
            @location(1) color: vec3f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f ,
            @location(0) color: vec3f,
        };

        struct Transform
        {
            world:mat4x4f
        }

        @group(0) @binding(0) var<uniform> transform: Transform;

        @vertex fn vs(v:Vertex) -> VertexOut 
        {
            var vOut:VertexOut;
            vOut.position=transform.world *vec4f(v.position, 0.0, 1.0);
            vOut.color=v.color;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return vec4f(v.color, 1.0);
        }
    `;

    async init() {
        //ottengo il device associato alla scheda video
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();

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

        //definisce i 4 vertici di un quadrato
        const vertexData: number[] = [
            // Posizione XY   // Colore RGB
            -0.5, 0.5, 0, 1, 1,
            0.5, 0.5, 0, 1, 0,
            -0.5, -0.5, 1, 0, 0,
            0.5, -0.5, 1, 1, 0,
        ];

        //crea un vertex buffer
        this._vertexBuffer = device.createBuffer({
            size: vertexData.length * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        //copia le informazioni all'interno del buffer
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));

        //definisce l'ordine con cui ordinare i vertici per creare un quadrato
        const indexData: number[] = [0, 1, 2, 2, 1, 3];

        //crea un index buffer
        this._indexBuffer = device.createBuffer({
            size: indexData.length * 4,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        //copia le informazioni all'interno del buffer
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));

        //crea un uniform buffer
        this._uniformBuffer1 = device.createBuffer({
            size: 64,//dimensione di una matrice (16 valori da 4 byte)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //crea un secondo uniform buffer
        this._uniformBuffer2 = device.createBuffer({
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
                                shaderLocation: 0, offset: 0, format: 'float32x2',
                            },
                            {
                                shaderLocation: 1, offset: 8, format: 'float32x3',
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
        this._bindGroup1 = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformBuffer1 } },
            ],
        });

        this._bindGroup2 = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformBuffer2 } },
            ],
        });
    }

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //definisce le caratteristiche del render pass
        //depth stencil
        //view: dove andrà eseguito il calcolo dello ZBuffer
        //depthClearValue: valore con cui si effettuerà la pulizia della vista (il valore 1 indica il massimo Z)
        //depthLoadOp: operazione da fare all'avvio (clear indica che verrà pulita)
        //depthStoreOp: operazione da fare sulla view (store indica che le informazioni verranno scritte sullo zbuffer) 
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 1, 0],
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

        // si inizia un render pass, una sequenza di operazioni
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        //imposta la pipeline da eseguire
        pass.setPipeline(this._pipeline);

        //imposta il vertex buffer nel pass
        pass.setVertexBuffer(0, this._vertexBuffer);

        //imposta l'index buffer nel pass
        pass.setIndexBuffer(this._indexBuffer, 'uint32');

        {
            //crea una matrice di rotazione sull'asse Z e di traslazione
            let m: Mat4 = mat4.identity();
            mat4.translate(m, vec3.fromValues(0, 0, 0.5), m);

            mat4.rotateZ(m, new Date().getTime() / 1000.0, m);

            //scrive il contenuto nell'uniform buffer
            this._device.queue.writeBuffer(this._uniformBuffer1, 0, m);

            //associa il bindgroup
            pass.setBindGroup(0, this._bindGroup1);

            //renderizza 6 indici
            pass.drawIndexed(6);
        }

        {
            //crea una matrice di rotazione sull'asse Z e di traslazione
            let m: Mat4 = mat4.identity();
            mat4.translate(m, vec3.fromValues(0.5, 0, 0.2), m);
            mat4.rotateZ(m, new Date().getTime() / 1000.0, m);

            //scrive il contenuto nell'uniform buffer
            this._device.queue.writeBuffer(this._uniformBuffer2, 0, m);

            //associa il bindgroup
            pass.setBindGroup(0, this._bindGroup2);

            //renderizza 6 indici
            pass.drawIndexed(6);
        }

        //termine del render pass
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

        this._vertexBuffer.destroy();
        this._indexBuffer.destroy();
        this._uniformBuffer1.destroy();
        this._uniformBuffer2.destroy();
        this._depthTexture.destroy();

        this._context.unconfigure();
    }
}