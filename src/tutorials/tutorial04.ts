/**
 * Index Buffer
 *
 * Memorizzazione degli indici di un modello all'interno di un Buffer.
 *
 * Nel tutorial precedente i vertici condivisi tra i due triangoli erano scritti due volte. Con un
 * index buffer i vertici si elencano una volta sola (qui 4, per il quadrato) e i triangoli si
 * descrivono con gli indici dei vertici (6 indici). Si risparmia memoria, e nei modelli reali la
 * differenza è grande.
 */

import { baseRendering } from "../utility/baseRendering";
import { initWebGpu, createShader } from "../utility/webgpuInit";

export class Tutorial04 extends baseRendering {
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


    private shader: string = `

        struct Vertex {
            @location(0) position: vec2f,
            @location(1) color: vec3f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f ,
            @location(0) color: vec3f,
        };

        @vertex fn vs(v:Vertex) -> VertexOut 
        {
            var vOut:VertexOut;
            vOut.position=vec4f(v.position, 0.0, 1.0);
            vOut.color=v.color;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return vec4f(v.color, 1.0);
        }
    `;

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

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

        //crea lo shader
        const module = await createShader(device, this.shader);

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
        });
    }

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //definisce le caratteristiche del render pass
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 1, 0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        // si inizia un render pass, una sequenza di operazioni
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        //imposta la pipeline da eseguire
        pass.setPipeline(this._pipeline);

        //imposta il vertex buffer nel pass
        pass.setVertexBuffer(0, this._vertexBuffer);

        //imposta l'index buffer nel pass
        pass.setIndexBuffer(this._indexBuffer, 'uint32');

        //renderizza 6 indici
        pass.drawIndexed(6);

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

        this._context.unconfigure();
    }
}