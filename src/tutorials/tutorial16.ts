/**
 * Stencil Buffer
 * 
 * Creazione di maschere di rendering tramite Stencil Buffer
 */

import { baseRendering } from "../utility/baseRendering";
import { Mat4, mat4 } from 'wgpu-matrix'

export class Tutorial16 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //render pipeline per lo stencil mask
    private _pipelineMask: GPURenderPipeline = null!;
   
    //buffer che contiene i vertici della forma
    private _vertexBuffer: GPUBuffer = null!;

    //buffer che contiene gli indici della forma
    private _indexBuffer: GPUBuffer = null!;

    //buffer per lo shader principale
    private _uniformBuffer: GPUBuffer = null!;

    //buffer per lo shader di stencil mask
    private _uniformMaskBuffer: GPUBuffer = null!;

    //binding group shader principale
    private _bindGroup: GPUBindGroup = null!;

    //binding group per lo shader di stencil mask
    private _bindMaskGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;

    //texture
    private _texture: GPUTexture = null!;

    //sampler
    private _sampler: GPUSampler = null!;

    //binding group per il sampler e per la texture
    private _textureBindGroup: GPUBindGroup = null!;

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
 
        @fragment fn fs(v:VertexOut,@builtin(front_facing) isFront:bool) -> @location(0) vec4f {

           //la parte interna del modello è renderizzata con un diverso effetto
           var l=1f;
           if(!isFront){
                l=0.5f;
           } 
           return  textureSample(diffuseTexture, textureSampler, v.texcoord)*l;
        }
    `;


    private shaderMask: string = `


     @group(0) @binding(0) var<uniform> circleData: vec4f;

    @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 1,  1),  
          vec2f(-1, -1),  
          vec2f( 1, -1),
          vec2f( 1,  1),  
          vec2f( -1,  1),
          vec2f( -1,  -1),    
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
 
      @fragment fn fs(@builtin(position)position: vec4f) -> @location(0) vec4f {

        //creiamo un effetto dinamico per creare un buco all'interno del rettangolo
        let center=circleData.xy/2;
        let point=position.xy-center;    

        let angle=atan2(point.x,point.y);
        let radius=sin(angle*10)*10+circleData.z;

        if(length(point)<radius )
        {
            discard;
        }
         return vec4f(1.0, 1.0, 1.0, 1.0);
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


        //uniform shader per lo stencil mask
        this._uniformMaskBuffer = device.createBuffer({
            size: 16,//dimensione di un vettore
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //creazione di una texture da utilizzare per lo ZBuffer
        this._depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus-stencil8',
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
                format: 'depth24plus-stencil8',
                stencilFront: {
                    compare: "equal",
                    passOp: "keep",
                    failOp: "keep"
                },
                stencilBack: {
                    compare: "always",
                    passOp: "keep",
                    failOp: "keep"
                }
            },
        });


        //crea lo shader per lo stencil mask
        const moduleMask = device.createShaderModule({ code: this.shaderMask });

        //crea la pipeline per lo stencil mask
        this._pipelineMask = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: moduleMask
            },
            fragment: {
                module: moduleMask,
                targets: [{ format: presentationFormat }],
            },
            //regole per l'applicazione dello ZBuffer
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus-stencil8',
                stencilFront: {
                    compare: "never",
                    failOp: "replace",
                    depthFailOp: "keep"
                }
            },

        });

        //creazione bind group
        this._bindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformBuffer } },
            ],
        });

        //creazione bind group per lo stencil mask
        this._bindMaskGroup = device.createBindGroup({
            layout: this._pipelineMask.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformMaskBuffer } },
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
    }

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //mask pass
        const renderPassMaskDescriptor: GPURenderPassDescriptor = {
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
                stencilStoreOp: "store",
                stencilLoadOp: "clear"
            }
        };

        let t = Math.sin(new Date().getTime() / 1000) + 1;
        this._device.queue.writeBuffer(this._uniformMaskBuffer, 0, new Float32Array([this._depthTexture.width, this._depthTexture.height, t * 150, 0]));

        //rendering di un quadraton con lo shader per il render pass
        const passMask = encoder.beginRenderPass(renderPassMaskDescriptor);
        
        //imposta il valore di riferimento per lo stencil
        passMask.setStencilReference(1);
        passMask.setPipeline(this._pipelineMask);
        passMask.setBindGroup(0, this._bindMaskGroup);
        passMask.draw(6);
        passMask.end();


        //rendering della scena principale
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
                stencilStoreOp: "discard",
                stencilLoadOp: "load"
            }
        };

        // si inizia un render pass, una sequenza di operazioni
        const pass = encoder.beginRenderPass(renderPassDescriptor);


        //imposta il valore di riferimento per lo stencil
        pass.setStencilReference(1);

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
        this._uniformBuffer.destroy();
        this._uniformMaskBuffer.destroy();
        this._depthTexture.destroy();
        this._texture.destroy();

        this._context.unconfigure();
    }


}