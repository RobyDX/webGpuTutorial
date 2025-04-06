var cr=Object.defineProperty;var dr=(p,G,B)=>G in p?cr(p,G,{enumerable:!0,configurable:!0,writable:!0,value:B}):p[G]=B;var x=(p,G,B)=>dr(p,typeof G!="symbol"?G+"":G,B);(function(){const G=document.createElement("link").relList;if(G&&G.supports&&G.supports("modulepreload"))return;for(const v of document.querySelectorAll('link[rel="modulepreload"]'))c(v);new MutationObserver(v=>{for(const w of v)if(w.type==="childList")for(const U of w.addedNodes)U.tagName==="LINK"&&U.rel==="modulepreload"&&c(U)}).observe(document,{childList:!0,subtree:!0});function B(v){const w={};return v.integrity&&(w.integrity=v.integrity),v.referrerPolicy&&(w.referrerPolicy=v.referrerPolicy),v.crossOrigin==="use-credentials"?w.credentials="include":v.crossOrigin==="anonymous"?w.credentials="omit":w.credentials="same-origin",w}function c(v){if(v.ep)return;v.ep=!0;const w=B(v);fetch(v.href,w)}})();const lr=`/**\r
 * Inizializzazione WebGPU\r
 * \r
 * Creazione di un progetto di base\r
 */\r
import { baseRendering } from "../utility/baseRendering";\r
\r
export class Tutorial00 extends baseRendering {\r
\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //per ora non eseguiamo nulla\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._context.unconfigure();\r
    }\r
}`,fr=`import { baseRendering } from "../utility/baseRendering";\r
\r
/**\r
 * Render target\r
 * \r
 * Rendering di una canvas con pulizia dello schermo\r
 */\r
export class Tutorial01 extends baseRendering {\r
\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //set di colori (valori da 0 ad 1 per componenti RGB)\r
    private color: number[][] = [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [1, 1, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0]];\r
    private numColor: number = 0;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
\r
        //evento per modificare il colore\r
        canvas.onclick = () => {\r
            this.numColor++;\r
            if (this.numColor > 6)\r
                this.numColor = 0;\r
        };\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        //view: dove andrà eseguito il rendering, in questo caso sulla view associata alla canvas\r
        //clearValue: valore con cui si effettuerà la pulizia della vista (il colore di sfondo)\r
        //loadOp: operazione da fare all'avvio (clear indica che verrà pulita)\r
        //storeOp: operazione da fare sulla view (store indica che le informazioni verranno scritte sulla view) \r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: this.color[this.numColor],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //termine del render pass, l'unica operazione è stata la pulizia della view\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._context.unconfigure();\r
    }\r
}`,pr=`/**\r
 * Shaders\r
 * \r
 * Rendering di un triangolo tramite Shader\r
 */\r
import { baseRendering } from "../utility/baseRendering";\r
\r
export class Tutorial02 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //lo shader renderizza un triangolo rosso\r
    //i vertici del triangolo sono contenuti nello shader\r
    private shader: string = \`\r
      @vertex fn vs(\r
        @builtin(vertex_index) vertexIndex : u32\r
      ) -> @builtin(position) vec4f {\r
        let pos = array(\r
          vec2f( 0.0,  0.5),  \r
          vec2f(-0.5, -0.5),  \r
          vec2f( 0.5, -0.5)   \r
        );\r
 \r
        return vec4f(pos[vertexIndex], 0.0, 1.0);\r
      }\r
 \r
      @fragment fn fs() -> @location(0) vec4f {\r
        return vec4f(1.0, 0.0, 0.0, 1.0);\r
      }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //crea lo shader\r
        const module = this._device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = this._device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //renderizza 3 vertici\r
        pass.draw(3);\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._context.unconfigure();\r
    }\r
}`,hr=`/**\r
 * Vertex Buffer\r
 * \r
 * Memorizzazione dei vertici di un modello all'interno di un Buffer\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
\r
export class Tutorial03 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec2f,\r
            @location(1) color: vec3f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) color: vec3f,\r
        };\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=vec4f(v.position, 0.0, 1.0);\r
            vOut.color=v.color;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return vec4f(v.color, 1.0);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce un quadrato formato da 2 triangoli con 3 vertici ciascuno\r
        const vertexData: number[] = [\r
            // Posizione XY   // Colore RGB\r
            -0.5, 0.5, 0, 1, 1,\r
            0.5, 0.5, 0, 1, 0,\r
            -0.5, -0.5, 1, 0, 0,\r
            -0.5, -0.5, 1, 0, 0,\r
            0.5, 0.5, 0, 1, 0,\r
            0.5, -0.5, 1, 1, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20, // dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x2',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 8, format: 'float32x3',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //renderizza 6 vertici\r
        pass.draw(6);\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,vr=`/**\r
 * Index Buffer\r
 * \r
 * Memorizzazione degli indici di un modello all'interno di un Buffer\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
\r
export class Tutorial04 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec2f,\r
            @location(1) color: vec3f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) color: vec3f,\r
        };\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=vec4f(v.position, 0.0, 1.0);\r
            vOut.color=v.color;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return vec4f(v.color, 1.0);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce i 4 vertici di un quadrato\r
        const vertexData: number[] = [\r
            // Posizione XY   // Colore RGB\r
            -0.5, 0.5, 0, 1, 1,\r
            0.5, 0.5, 0, 1, 0,\r
            -0.5, -0.5, 1, 0, 0,\r
            0.5, -0.5, 1, 1, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un quadrato\r
        const indexData: number[] = [0, 1, 2, 2, 1, 3];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x2',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 8, format: 'float32x3',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        //renderizza 6 indici\r
        pass.drawIndexed(6);\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,mr=`/**\r
 * Uniform Buffer\r
 * \r
 * Memorizzazione dei dati dinamici di un modello all'interno di un buffer\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial05 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec2f,\r
            @location(1) color: vec3f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) color: vec3f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 0.0, 1.0);\r
            vOut.color=v.color;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return vec4f(v.color, 1.0);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce i 4 vertici di un quadrato\r
        const vertexData: number[] = [\r
            // Posizione XY   // Colore RGB\r
            -0.5, 0.5, 0, 1, 1,\r
            0.5, 0.5, 0, 1, 0,\r
            -0.5, -0.5, 1, 0, 0,\r
            0.5, -0.5, 1, 1, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un quadrato\r
        const indexData: number[] = [0, 1, 2, 2, 1, 3];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //crea un uniform buffer\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x2',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 8, format: 'float32x3',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //crea una matrice di rotazione sull'asse Z\r
        let m: Mat4 = mat4.identity();\r
        mat4.rotateZ(m, new Date().getTime() / 1000.0, m);\r
\r
        //scrive il contenuto nell'uniform buffer\r
        this._device.queue.writeBuffer(this._uniformBuffer, 0, m);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //associa il bindgroup\r
        pass.setBindGroup(0, this._bindGroup);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        //renderizza 6 indici\r
        pass.drawIndexed(6);\r
\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,gr=`/**\r
 * Depth Buffer\r
 * \r
 * Gestione della profondità tramite ZBuffer\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4, vec3 } from 'wgpu-matrix'\r
\r
export class Tutorial06 extends baseRendering {\r
\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contengono i dati che vengono passati allo shader\r
    private _uniformBuffer1: GPUBuffer = null!;\r
    private _uniformBuffer2: GPUBuffer = null!;\r
\r
    //binding group, definiscono come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup1: GPUBindGroup = null!;\r
    private _bindGroup2: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec2f,\r
            @location(1) color: vec3f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) color: vec3f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 0.0, 1.0);\r
            vOut.color=v.color;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return vec4f(v.color, 1.0);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce i 4 vertici di un quadrato\r
        const vertexData: number[] = [\r
            // Posizione XY   // Colore RGB\r
            -0.5, 0.5, 0, 1, 1,\r
            0.5, 0.5, 0, 1, 0,\r
            -0.5, -0.5, 1, 0, 0,\r
            0.5, -0.5, 1, 1, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un quadrato\r
        const indexData: number[] = [0, 1, 2, 2, 1, 3];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //crea un uniform buffer\r
        this._uniformBuffer1 = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //crea un secondo uniform buffer\r
        this._uniformBuffer2 = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x2',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 8, format: 'float32x3',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup1 = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer1 } },\r
            ],\r
        });\r
\r
        this._bindGroup2 = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer2 } },\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        //depth stencil\r
        //view: dove andrà eseguito il calcolo dello ZBuffer\r
        //depthClearValue: valore con cui si effettuerà la pulizia della vista (il valore 1 indica il massimo Z)\r
        //depthLoadOp: operazione da fare all'avvio (clear indica che verrà pulita)\r
        //depthStoreOp: operazione da fare sulla view (store indica che le informazioni verranno scritte sullo zbuffer) \r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione sull'asse Z e di traslazione\r
            let m: Mat4 = mat4.identity();\r
            mat4.translate(m, vec3.fromValues(0, 0, 0.5), m);\r
\r
            mat4.rotateZ(m, new Date().getTime() / 1000.0, m);\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer1, 0, m);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup1);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(6);\r
        }\r
\r
        {\r
            //crea una matrice di rotazione sull'asse Z e di traslazione\r
            let m: Mat4 = mat4.identity();\r
            mat4.translate(m, vec3.fromValues(0.5, 0, 0.2), m);\r
            mat4.rotateZ(m, new Date().getTime() / 1000.0, m);\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer2, 0, m);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup2);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(6);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer1.destroy();\r
        this._uniformBuffer2.destroy();\r
        this._depthTexture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,xr=`/**\r
 * Matrici di trasformazione\r
 * \r
 * Utilizzo delle matrici di trasformazione per trasformare i modelli all'interno dello Shader\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial07 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) color: vec3f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) color: vec3f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.color=v.color;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return vec4f(v.color, 1.0);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Posizione XYZ   // Colore RGB\r
            -0.5, -0.5, -0.5, 1, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0, 1,\r
            -0.5, 0.5, -0.5, 1, 1, 0,\r
            -0.5, -0.5, 0.5, 1, 0, 1,\r
            0.5, -0.5, 0.5, 0, 1, 1,\r
            0.5, 0.5, 0.5, 1, 1, 1,\r
            -0.5, 0.5, 0.5, 0, 0, 0\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,\r
            1, 5, 6, 6, 2, 1,\r
            4, 5, 6, 6, 7, 4,\r
            0, 4, 7, 7, 3, 0,\r
            3, 2, 6, 6, 7, 3,\r
            0, 1, 5, 5, 4, 0];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 24,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x3',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
\r
}`,_r=`/**\r
 * Texture\r
 * \r
 * Utilizzo di immagini Texture all'interno degli shader\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial08 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
\r
\r
}`,Br=`/**\r
 * Render Bundle\r
 * \r
 * Ottimizzazione dei rendering tramite memorizzazione dei comandi all'interno di render bundle\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
\r
export class Tutorial09 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //numero di cubi a video\r
    private _cubeCount: number = 16;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffers: GPUBuffer[] = [];\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroups: GPUBindGroup[] = [];\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    private _renderBundle: GPURenderBundle = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        for (let i = 0; i < this._cubeCount; i++) {\r
            this._uniformBuffers.push(device.createBuffer({\r
                size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
            }));\r
        }\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        for (let i = 0; i < this._cubeCount; i++) {\r
            this._bindGroups.push(device.createBindGroup({\r
                layout: this._pipeline.getBindGroupLayout(0),\r
                entries: [\r
                    { binding: 0, resource: { buffer: this._uniformBuffers[i] } },\r
                ],\r
            }));\r
        }\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
\r
\r
\r
        //crea di un render bundle encoder\r
        const renderBundleEncoder = this._device.createRenderBundleEncoder({\r
            colorFormats: ["bgra8unorm"],\r
            depthStencilFormat: 'depth24plus',\r
        });\r
\r
        //imposta la pipeline da eseguire\r
        renderBundleEncoder.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        renderBundleEncoder.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        renderBundleEncoder.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        //registra tutti i comandi da eseguire\r
        for (let i = 0; i < this._cubeCount; i++) {\r
\r
            //associa il bindgroup\r
            renderBundleEncoder.setBindGroup(0, this._bindGroups[i]);\r
\r
            renderBundleEncoder.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            renderBundleEncoder.drawIndexed(36);\r
\r
        }\r
\r
        //chiude l'encoder e crea un render bundle\r
        this._renderBundle = renderBundleEncoder.finish();\r
\r
\r
    }\r
\r
\r
\r
\r
    draw() {\r
\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //aggiorna tutte le matrici\r
        this.updateMatrices();\r
\r
        //esegue il bundle\r
        pass.executeBundles([this._renderBundle]);\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    updateMatrices() {\r
        //crea una matrice associata alla camera\r
        let view: Mat4 = mat4.lookAt([0, 5, -10], [0, 0, 0], [0, 1, 0]);\r
\r
        //crea una matrice di proiezione\r
        let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
        let vec: [number, number] = [0, 0];\r
        let d = Math.sqrt(this._cubeCount);\r
\r
        //popola tutti gli uniform buffer\r
        for (let i = 0; i < this._cubeCount; i++) {\r
            //crea una matrice di rotazione\r
\r
            let world: Mat4 = mat4.identity();\r
\r
            mat4.translate(world, [vec[0] * 2 - d + 1, vec[1] * 2 - d + 1, 0], world);\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffers[i], 0, transform);\r
\r
            vec[0]++;\r
            if (vec[0] >= d) {\r
                vec[1]++;\r
                vec[0] = 0;\r
            }\r
\r
        }\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffers.forEach(u => u.destroy());\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,wr=`/**\r
 * Geometry Instancing\r
 * \r
 * Rendering multiplo di oggetti tramite il meccanismo di instancing\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
\r
\r
export class Tutorial10 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _instanceBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //numero di cubi a video\r
    private _cubeCount: number = 16;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
            @location(2) instanceData: vec4f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
            @location(1) color:vec3f\r
        };\r
\r
        struct Transform\r
        {\r
            world:array<mat4x4f, 16>\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world[i32(v.instanceData.x)] *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            vOut.color=v.instanceData.yzw;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord)* vec4f(v.color,1);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //instance buffer\r
        const instanceData: number[] = [\r
            0, 1, 1, 1,\r
            1, 1, 0, 0,\r
            2, 0, 1, 0,\r
            3, 0, 0, 1,\r
            4, 1, 0, 1,\r
            5, 0, 1, 1,\r
            6, 1, 1, 0,\r
            7, 1, 1, 1,\r
            8, 1, 0.5, 0.5,\r
            9, 0.5, 0.5, 1,\r
            10, 0.5, 1, 0.5,\r
            11, 0.5, 1, 1,\r
            12, 1, 0.5, 1,\r
            13, 1, 1, 0.5,\r
            14, 0.5, 0.5, 0.5,\r
            15, 0.1, 0.1, 0.1,\r
        ];\r
\r
        //crea un vertex buffer per l'instancing\r
        this._instanceBuffer = device.createBuffer({\r
            size: instanceData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._instanceBuffer, 0, new Float32Array(instanceData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64 * this._cubeCount,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    },\r
                    {\r
                        arrayStride: 16,\r
                        stepMode: "instance",\r
                        attributes: [\r
                            {\r
                                shaderLocation: 2, offset: 0, format: "float32x4"\r
                            }]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
\r
    }\r
\r
\r
\r
\r
    draw() {\r
\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //aggiorna tutte le matrici\r
        this.updateMatrices();\r
\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'instance buffer\r
        pass.setVertexBuffer(1, this._instanceBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
\r
        //associa il bindgroup\r
        pass.setBindGroup(0, this._bindGroup);\r
\r
        pass.setBindGroup(1, this._textureBindGroup);\r
\r
        //renderizza 6 indici\r
        pass.drawIndexed(36, 16);\r
\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    updateMatrices() {\r
        //crea una matrice associata alla camera\r
        let view: Mat4 = mat4.lookAt([0, 5, -10], [0, 0, 0], [0, 1, 0]);\r
\r
        //crea una matrice di proiezione\r
        let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
        let vec: [number, number] = [0, 0];\r
        let d = Math.sqrt(this._cubeCount);\r
\r
        //popola tutti gli uniform buffer\r
        for (let i = 0; i < this._cubeCount; i++) {\r
            //crea una matrice di rotazione\r
\r
            let world: Mat4 = mat4.identity();\r
\r
            mat4.translate(world, [vec[0] * 2 - d + 1, vec[1] * 2 - d + 1, 0], world);\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 64 * i, transform);\r
\r
            vec[0]++;\r
            if (vec[0] >= d) {\r
                vec[1]++;\r
                vec[0] = 0;\r
            }\r
\r
        }\r
    }\r
\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._instanceBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,br=`/**\r
 * MSAA\r
 * \r
 * Miglioramento della resa grafica tramite Multi Sample Antialasing\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial11 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipelineMultiSample: GPURenderPipeline = null!;\r
    private _pipelineNoSample: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTextureMultiSample: GPUTexture = null!;\r
    private _depthTextureNoSample: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    private multisampleTexture: GPUTexture = null!;\r
\r
    private sampleCount: number = 4;\r
    private multipleSampleOn: boolean = true;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            _=textureSample(diffuseTexture, textureSampler, v.texcoord);\r
            return vec4f(1,1,1,1) ;\r
        }\r
    \`;\r
\r
    async init() {\r
\r
\r
\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        document.querySelector("p")!.innerText = this.multipleSampleOn ? "MSAA Attivo" : "MSAA Non Attivo";\r
        canvas.onclick = () => {\r
            this.multipleSampleOn = !this.multipleSampleOn;\r
\r
            document.querySelector("p")!.innerHTML = this.multipleSampleOn ? "MSAA Attivo" : "MSAA Non Attivo";\r
        };\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer per il MultiSample\r
        this._depthTextureMultiSample = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
            sampleCount: this.sampleCount\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer senza MultiSample\r
        this._depthTextureNoSample = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT\r
        });\r
\r
        //texture per il render target multisample\r
        this.multisampleTexture = this._device.createTexture({\r
            format: "bgra8unorm",\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
            size: [canvas.width, canvas.height],\r
            sampleCount: this.sampleCount,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline con multisample\r
        this._pipelineMultiSample = device.createRenderPipeline({\r
            layout: this._device.createPipelineLayout({\r
                bindGroupLayouts: [\r
                    this._device.createBindGroupLayout({\r
                        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }]\r
                    }),\r
                    this._device.createBindGroupLayout({\r
                        entries: [\r
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} },\r
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} }]\r
                    })\r
                ]\r
            }),\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
            multisample: {\r
                count: this.sampleCount\r
            }\r
        });\r
\r
        //crea la pipeline senza multisample\r
        this._pipelineNoSample = device.createRenderPipeline({\r
            layout: this._device.createPipelineLayout({\r
                bindGroupLayouts: [\r
                    this._device.createBindGroupLayout({\r
                        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }]\r
                    }),\r
                    this._device.createBindGroupLayout({\r
                        entries: [\r
                            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} },\r
                            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} }]\r
                    })\r
                ]\r
            }),\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            }\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._device.createBindGroupLayout({\r
                entries: [\r
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }\r
                ]\r
            }),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._device.createBindGroupLayout({\r
                entries: [\r
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} },\r
                    { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} }\r
                ]\r
            }),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
\r
\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass per il MSAA\r
        let pass: GPURenderPassEncoder;\r
\r
        if (this.multipleSampleOn) {\r
            const renderPassDescriptor: GPURenderPassDescriptor = {\r
                colorAttachments: [\r
                    {\r
                        view: this.multisampleTexture.createView(),\r
                        resolveTarget: this._context.getCurrentTexture().createView(),\r
                        clearValue: [0, 0, 0, 0],\r
                        loadOp: 'clear',\r
                        storeOp: 'store',\r
                    },\r
                ],\r
                depthStencilAttachment: {\r
                    view: this._depthTextureMultiSample.createView(),\r
                    depthClearValue: 1.0,\r
                    depthLoadOp: 'clear',\r
                    depthStoreOp: 'store',\r
                }\r
            };\r
\r
            // si inizia un render pass, una sequenza di operazioni\r
            pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
            //imposta la pipeline da eseguire\r
            pass.setPipeline(this._pipelineMultiSample);\r
\r
        } else {\r
            //definisce le caratteristiche del render pass\r
            const renderPassDescriptor: GPURenderPassDescriptor = {\r
                colorAttachments: [\r
                    {\r
                        view: this._context.getCurrentTexture().createView(),\r
                        clearValue: [0, 0, 0, 0],\r
                        loadOp: 'clear',\r
                        storeOp: 'store',\r
                    },\r
                ],\r
                depthStencilAttachment: {\r
                    view: this._depthTextureNoSample.createView(),\r
                    depthClearValue: 1.0,\r
                    depthLoadOp: 'clear',\r
                    depthStoreOp: 'store',\r
                }\r
            };\r
\r
            // si inizia un render pass, una sequenza di operazioni\r
            pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
            //imposta la pipeline da eseguire\r
            pass.setPipeline(this._pipelineNoSample);\r
        }\r
\r
\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    destroy(): void {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTextureMultiSample.destroy();\r
        this._depthTextureNoSample.destroy();\r
        this._device.destroy();\r
    }\r
}`,Tr=`/**\r
 * Render to Texture\r
 * \r
 * Rendering su texture per realizzare effetti a più step\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial12 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
\r
    //coppia di render target e depth texture aggiuntivi\r
    private _renderTarget2: GPUTexture = null!;\r
    private _depthTexture2: GPUTexture = null!;\r
\r
    //binding per utilizzare il render target\r
    private _textureBindGroup2: GPUBindGroup = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
\r
        //creazione di render target ausiliari\r
\r
        //creazione di una texture da utilizzare il render target\r
        this._renderTarget2 = device.createTexture({\r
            size: [512, 512],\r
            format: 'bgra8unorm',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture2 = device.createTexture({\r
            size: [512, 512],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        this._textureBindGroup2 = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._renderTarget2.createView() }\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
\r
\r
        //rendering su una texture\r
        {\r
            //definisce le caratteristiche del render pass per renderizzare su una texture\r
            const renderPassDescriptor: GPURenderPassDescriptor = {\r
                colorAttachments: [\r
                    {\r
                        view: this._renderTarget2.createView(),\r
                        clearValue: [0, 0, 1, 0],\r
                        loadOp: 'clear',\r
                        storeOp: 'store',\r
                    },\r
                ],\r
                depthStencilAttachment: {\r
                    view: this._depthTexture2.createView(),\r
                    depthClearValue: 1.0,\r
                    depthLoadOp: 'clear',\r
                    depthStoreOp: 'store',\r
                }\r
            };\r
\r
            // si inizia un render pass, una sequenza di operazioni\r
            const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
            //imposta la pipeline da eseguire\r
            pass.setPipeline(this._pipeline);\r
\r
            //imposta il vertex buffer nel pass\r
            pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
            //imposta l'index buffer nel pass\r
            pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
            {\r
                //crea una matrice di rotazione\r
                let world: Mat4 = mat4.identity();\r
                mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
                //crea una matrice associata alla camera\r
                let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
                //crea una matrice di proiezione\r
                let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
                //crea la matrice di trasformazione (prodotto tra le matrici)\r
                let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
                //scrive il contenuto nell'uniform buffer\r
                this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
                //associa il bindgroup\r
                pass.setBindGroup(0, this._bindGroup);\r
\r
                pass.setBindGroup(1, this._textureBindGroup);\r
\r
                //renderizza 6 indici\r
                pass.drawIndexed(36);\r
            }\r
\r
            //termine del render pass\r
            pass.end();\r
        }\r
\r
        //ultimo step\r
        {\r
            //definisce le caratteristiche del render pass\r
            const renderPassDescriptor: GPURenderPassDescriptor = {\r
                colorAttachments: [\r
                    {\r
                        view: this._context.getCurrentTexture().createView(),\r
                        clearValue: [0, 0, 0, 0],\r
                        loadOp: 'clear',\r
                        storeOp: 'store',\r
                    },\r
                ],\r
                depthStencilAttachment: {\r
                    view: this._depthTexture.createView(),\r
                    depthClearValue: 1.0,\r
                    depthLoadOp: 'clear',\r
                    depthStoreOp: 'store',\r
                }\r
            };\r
\r
            // si inizia un render pass, una sequenza di operazioni\r
            const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
            //imposta la pipeline da eseguire\r
            pass.setPipeline(this._pipeline);\r
\r
            //imposta il vertex buffer nel pass\r
            pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
            //imposta l'index buffer nel pass\r
            pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
            {\r
\r
                //associa il bindgroup\r
                pass.setBindGroup(0, this._bindGroup);\r
\r
                pass.setBindGroup(1, this._textureBindGroup2);\r
\r
                //renderizza 6 indici\r
                pass.drawIndexed(36);\r
            }\r
\r
            //termine del render pass\r
            pass.end();\r
        }\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    destroy(): void {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._device.destroy();\r
    }\r
}`,Pr=`/**\r
 * Utilizzo di Video\r
 * \r
 * Utilizzo di Video come texture dei modelli\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial13 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    private _video: HTMLVideoElement = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_external;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSampleBaseClampToEdge(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
    async init() {\r
\r
        //carica un video\r
        this._video = document.createElement("video");\r
        this._video.src = "./earth.mp4";\r
        this._video.autoplay = true;\r
        this._video.loop = true;\r
        this._video.play();\r
\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
\r
\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
    }\r
\r
    draw() {\r
\r
        if (this._video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {\r
            // Il video è pronto\r
            requestAnimationFrame(() => this.draw());\r
            return;\r
        }\r
\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 1, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, 0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([1, 1, -1], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            //crea texture a partire dal video\r
            const videoTexture = this._device.importExternalTexture({ source: this._video });\r
\r
            //crea un binding in tempo reale\r
            this._textureBindGroup = this._device.createBindGroup({\r
                layout: this._pipeline.getBindGroupLayout(1),\r
                entries: [\r
                    { binding: 0, resource: this._sampler },\r
                    { binding: 1, resource: videoTexture }\r
                ],\r
            });\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    destroy(): void {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,Gr=`/**\r
 * Compute Shader\r
 * \r
 * Utilizzo della scheda video per l'esecuzione di calcoli\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
\r
export class Tutorial14 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //compute pipeline\r
    private _pipeline: GPUComputePipeline = null!;\r
\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //buffer di input\r
    private _inputBuffer: GPUBuffer = null!;\r
\r
    //buffer di output\r
    private _outputBuffer: GPUBuffer = null!;\r
\r
    //buffer per il mapping\r
    private _readBuffer: GPUBuffer = null!;\r
\r
    //dimensione del buffer\r
    private size: number = 1024;\r
\r
    private jsTime: number = 0;\r
    private webGpuTime: number = 0;\r
\r
    //lo shader esegue un compute per la risoluzione di un'equazione di secondo grado\r
    private shader: string = \`\r
      \r
        @group(0) @binding(0) var<storage,read> inputBuffer:array<f32>;\r
        @group(0) @binding(1) var<storage,read_write> resultBuffer:array<f32>;\r
\r
        @compute @workgroup_size(16,16) \r
        fn main(\r
            @builtin(global_invocation_id) global_id : vec3<u32>) \r
        {\r
\r
            let width:u32=\${this.size}u;\r
\r
            let index:u32=global_id.y*width+global_id.x;\r
\r
            let x = inputBuffer[index];\r
\r
            //esecuzione della formula di taylor per sin(x)\r
            var result = 0f;\r
            var sign = -1f;\r
            for (var i = 1f; i < 30; i+=2) {\r
                var fact = 1f;\r
                var n = i;\r
\r
                while (n > 1) {\r
                    fact *= n;\r
                    n=n-1;\r
                }\r
                sign *= -1;\r
\r
                result += (pow(x, i) / fact) * sign;\r
            }\r
\r
            resultBuffer[index]=result;\r
            \r
            \r
        }\r
 \r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //crea il compute shader\r
        const module = this._device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline per il compute shader\r
        this._pipeline = this._device.createComputePipeline({\r
            layout: 'auto',\r
            compute: { module: module }\r
        });\r
\r
\r
\r
        //buffer con valori da 0 a 9 per simulare l'input della formula di taylor\r
        this._inputBuffer = this._device.createBuffer({\r
            size: this.size * this.size * 4,\r
            usage: GPUBufferUsage.STORAGE,\r
            mappedAtCreation: true\r
        });\r
\r
        //crea una serie di valori per la risoluzione della formula\r
        const factors: number[] = [];\r
        for (let index = 0; index < this.size; index++) {\r
            factors.push(Math.floor(Math.random() * 10));\r
        }\r
\r
        //carico sul buffer\r
        new Float32Array(this._inputBuffer.getMappedRange()).set(factors);\r
        this._inputBuffer.unmap();\r
\r
\r
        //output buffer contenente i risultati\r
        this._outputBuffer = this._device.createBuffer({\r
            size: this.size * this.size * 4,\r
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC\r
        });\r
\r
        //buffer per leggere il risultato\r
        this._readBuffer = this._device.createBuffer({\r
            size: this.size * this.size * 4,\r
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ\r
        });\r
\r
        //binding\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._inputBuffer } },\r
                { binding: 1, resource: { buffer: this._outputBuffer } },\r
            ],\r
        });\r
\r
        //test javascript\r
\r
        this.jsTime = performance.now();\r
\r
        const resultTest: number[] = [];\r
\r
        for (var w = 0; w < this.size * this.size; w++) {\r
\r
            var x = factors[w];\r
            //esecuzione della formula di taylor per sin(x)\r
\r
            var result = 0;\r
            let sign = -1;\r
            for (let index = 1; index < 30; index += 2) {\r
                let fact = 1;\r
                let n = index;\r
\r
                while (n > 1) {\r
                    fact *= n;\r
                    n--;\r
                }\r
                sign *= -1;\r
\r
                result += (Math.pow(x, index) / fact) * sign;\r
            }\r
\r
            resultTest.push(result);\r
        }\r
\r
        this.jsTime = performance.now() - this.jsTime;\r
\r
        document.querySelector("p")!.innerHTML =\r
            \`\r
        <p>Tempo di Esecuzione da Javascript \${this.jsTime.toFixed(2)} ms</p>\r
        <p>Risultato prima funzione: \${resultTest[0].toFixed(2)} </p>\`;\r
\r
        await this.runCompute(this.size);\r
    }\r
\r
    draw() {\r
\r
    }\r
\r
    async runCompute(size: number) {\r
        // si crea un command encoder che eseguirà le operazioni\r
\r
        this.webGpuTime = performance.now();\r
\r
        const encoder = this._device.createCommandEncoder();\r
\r
\r
        // si inizia un compute pass\r
        const pass = encoder.beginComputePass();\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
        pass.setBindGroup(0, this._bindGroup);\r
\r
        //esegue il compute shader eseguendo un numero di workgroup per ogni lato\r
        pass.dispatchWorkgroups(size / 16, size / 16, 1);\r
\r
        //termine del compute pass\r
        pass.end();\r
\r
        //copia l'output buffer su un buffer di lettura\r
        //gli storage buffer non possono essere letti direttamente\r
        encoder.copyBufferToBuffer(this._outputBuffer, 0, this._readBuffer, 0, this._outputBuffer.size);\r
\r
        //submit dell'encoder, viene effettivamente lanciata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
\r
        //legge i risultati\r
        let x1: number = 0;\r
        await this._readBuffer.mapAsync(GPUMapMode.READ);\r
        var data = new Float32Array(this._readBuffer.getMappedRange());\r
        x1 = data[0];\r
        this._readBuffer.unmap();\r
\r
        //calcola il tempo di esecuzione\r
        this.webGpuTime = (performance.now() - this.webGpuTime);\r
\r
\r
        document.querySelector("p")!.innerHTML +=\r
            \`\r
          <p>Tempo di Esecuzione da WebGPU \${(this.webGpuTime).toFixed(2)} ms</p>\r
          <p>Risultato prima funzione: \${x1.toFixed(2)} </p>\r
          <p>La GPU è più veloce di \${(this.jsTime / this.webGpuTime).toFixed(2)} volte</p>\r
          \`;\r
\r
    }\r
\r
    destroy(): void {\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
\r
        this._inputBuffer.destroy();\r
        this._outputBuffer.destroy();\r
        this._readBuffer.destroy();\r
\r
        this._context.unconfigure();\r
\r
    }\r
}`,yr=`/**\r
 * Sobel Filter\r
 * \r
 * Esempio di utilizzo di compute shader in fase di rendering\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial15 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    //binding group per il sampler e per la texture per l'effetto Sobel\r
    private _sobelBindGroup: GPUBindGroup = null!;\r
\r
    private showSobel: boolean = true;\r
\r
    //compute pipeline\r
    private _computePipeline: GPUComputePipeline = null!;\r
\r
    //binding group per il compute\r
    private _computeBindGroup: GPUBindGroup = null!;\r
\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
\r
\r
    private computeShaderCode: string = \`\r
    \r
    \r
    @group(0) @binding(0) var inputTex: texture_2d<f32>;\r
    @group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;\r
\r
    const Gx : array<array<f32, 3>, 3> = array(\r
        array(-1.0,  0.0,  1.0),\r
        array(-2.0,  0.0,  2.0),\r
        array(-1.0,  0.0,  1.0)\r
    );\r
\r
    const Gy : array<array<f32, 3>, 3> = array(\r
        array(-1.0, -2.0, -1.0),\r
        array( 0.0,  0.0,  0.0),\r
        array( 1.0,  2.0,  1.0)\r
    );\r
\r
    @compute @workgroup_size(8, 8)\r
    fn main(@builtin(global_invocation_id) id : vec3<u32>) {\r
        let texCoord = vec2<i32>(id.xy);\r
        var gx = vec3<f32>(0.0);\r
        var gy = vec3<f32>(0.0);\r
        \r
        for (var i: i32 = -1; i <= 1; i++) {\r
            for (var j: i32 = -1; j <= 1; j++) {\r
                let offset = texCoord + vec2<i32>(i, j);\r
                let sample = textureLoad(inputTex, offset, 0).rgb;\r
                gx += sample * Gx[i + 1][j + 1];\r
                gy += sample * Gy[i + 1][j + 1];\r
            }\r
        }\r
\r
        let edgeStrength = length(gx) + length(gy);\r
        let finalColor = vec4<f32>(vec3(edgeStrength), 1.0);\r
        textureStore(outputTex, texCoord, finalColor);\r
    }\r
\`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        //output per il compute shader\r
        const outputTexture = device.createTexture({\r
            size: { width: this._texture.width, height: this._texture.height },\r
            format: "rgba8unorm",\r
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,\r
        });\r
\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
\r
        this._sobelBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: outputTexture.createView() }\r
            ],\r
        });\r
\r
        //compute shader\r
\r
\r
        //crea lo shader\r
        const computemodule = device.createShaderModule({ code: this.computeShaderCode });\r
\r
        //crea la pipeline\r
        this._computePipeline = device.createComputePipeline({\r
            layout: "auto",\r
            compute: { module: computemodule }\r
        });\r
\r
\r
        //creazione bind group\r
        this._computeBindGroup = device.createBindGroup({\r
            layout: this._computePipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: this._texture.createView() },\r
                { binding: 1, resource: outputTexture.createView() },\r
            ],\r
        });\r
\r
        canvas.onclick = () => this.showSobel = !this.showSobel;\r
\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        const computePass = encoder.beginComputePass();\r
        computePass.setBindGroup(0, this._computeBindGroup);\r
        computePass.setPipeline(this._computePipeline);\r
        computePass.dispatchWorkgroups(64, 64, 1);\r
        computePass.end();\r
\r
\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            if (this.showSobel)\r
                pass.setBindGroup(1, this._sobelBindGroup);\r
            else\r
                pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass, l'unica operazione è stata la pulizia della view\r
        pass.end();\r
\r
        //submit dell'encoder, viene effettivamente lanciata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
\r
    destroy(): void {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
}`,Ur=`/**\r
 * Stencil Buffer\r
 * \r
 * Creazione di maschere di rendering tramite Stencil Buffer\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial16 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //render pipeline per lo stencil mask\r
    private _pipelineMask: GPURenderPipeline = null!;\r
   \r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer per lo shader principale\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //buffer per lo shader di stencil mask\r
    private _uniformMaskBuffer: GPUBuffer = null!;\r
\r
    //binding group shader principale\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //binding group per lo shader di stencil mask\r
    private _bindMaskGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut,@builtin(front_facing) isFront:bool) -> @location(0) vec4f {\r
\r
           //la parte interna del modello è renderizzata con un diverso effetto\r
           var l=1f;\r
           if(!isFront){\r
                l=0.5f;\r
           } \r
           return  textureSample(diffuseTexture, textureSampler, v.texcoord)*l;\r
        }\r
    \`;\r
\r
\r
    private shaderMask: string = \`\r
\r
\r
     @group(0) @binding(0) var<uniform> circleData: vec4f;\r
\r
    @vertex fn vs(\r
        @builtin(vertex_index) vertexIndex : u32\r
      ) -> @builtin(position) vec4f {\r
        let pos = array(\r
          vec2f( 1,  1),  \r
          vec2f(-1, -1),  \r
          vec2f( 1, -1),\r
          vec2f( 1,  1),  \r
          vec2f( -1,  1),\r
          vec2f( -1,  -1),    \r
        );\r
 \r
        return vec4f(pos[vertexIndex], 0.0, 1.0);\r
      }\r
 \r
      @fragment fn fs(@builtin(position)position: vec4f) -> @location(0) vec4f {\r
\r
        //creiamo un effetto dinamico per creare un buco all'interno del rettangolo\r
        let center=circleData.xy/2;\r
        let point=position.xy-center;    \r
\r
        let angle=atan2(point.x,point.y);\r
        let radius=sin(angle*10)*10+circleData.z;\r
\r
        if(length(point)<radius )\r
        {\r
            discard;\r
        }\r
         return vec4f(1.0, 1.0, 1.0, 1.0);\r
      }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
\r
        //uniform shader per lo stencil mask\r
        this._uniformMaskBuffer = device.createBuffer({\r
            size: 16,//dimensione di un vettore\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus-stencil8',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus-stencil8',\r
                stencilFront: {\r
                    compare: "equal",\r
                    passOp: "keep",\r
                    failOp: "keep"\r
                },\r
                stencilBack: {\r
                    compare: "always",\r
                    passOp: "keep",\r
                    failOp: "keep"\r
                }\r
            },\r
        });\r
\r
\r
        //crea lo shader per lo stencil mask\r
        const moduleMask = device.createShaderModule({ code: this.shaderMask });\r
\r
        //crea la pipeline per lo stencil mask\r
        this._pipelineMask = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module: moduleMask\r
            },\r
            fragment: {\r
                module: moduleMask,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus-stencil8',\r
                stencilFront: {\r
                    compare: "never",\r
                    failOp: "replace",\r
                    depthFailOp: "keep"\r
                }\r
            },\r
\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //creazione bind group per lo stencil mask\r
        this._bindMaskGroup = device.createBindGroup({\r
            layout: this._pipelineMask.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformMaskBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //mask pass\r
        const renderPassMaskDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
                stencilStoreOp: "store",\r
                stencilLoadOp: "clear"\r
            }\r
        };\r
\r
        let t = Math.sin(new Date().getTime() / 1000) + 1;\r
        this._device.queue.writeBuffer(this._uniformMaskBuffer, 0, new Float32Array([this._depthTexture.width, this._depthTexture.height, t * 150, 0]));\r
\r
        //rendering di un quadraton con lo shader per il render pass\r
        const passMask = encoder.beginRenderPass(renderPassMaskDescriptor);\r
        \r
        //imposta il valore di riferimento per lo stencil\r
        passMask.setStencilReference(1);\r
        passMask.setPipeline(this._pipelineMask);\r
        passMask.setBindGroup(0, this._bindMaskGroup);\r
        passMask.draw(6);\r
        passMask.end();\r
\r
\r
        //rendering della scena principale\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
                stencilStoreOp: "discard",\r
                stencilLoadOp: "load"\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
\r
        //imposta il valore di riferimento per lo stencil\r
        pass.setStencilReference(1);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._uniformMaskBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
\r
\r
}`,Dr=`/**\r
 * Query Set\r
 * \r
 * Utilizzo di funzionalità di analisi\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial17 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    //query set\r
    private _querySet: GPUQuerySet = null!;\r
\r
    //buffer contenente i risultati\r
    private _queryBuffer: GPUBuffer = null!;\r
\r
    //buffer per i contenuti\r
    private _resultBuffer: GPUBuffer = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
\r
\r
        const device = await adapter?.requestDevice({\r
            requiredFeatures: ['timestamp-query']\r
        });\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
        const res = await fetch("../logo_njc.png");\r
        const blob = await res.blob();\r
        const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' });\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [source.width, source.height, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //copia l'immagine nella texture\r
        this._device.queue.copyExternalImageToTexture(\r
            { source, flipY: false },\r
            { texture: this._texture },\r
            { width: source.width, height: source.height },\r
        );\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
\r
\r
        this._querySet = device.createQuerySet({\r
            type: "timestamp",  // Tipo di query\r
            count: 2,          // Numero massimo di query\r
        });\r
\r
        //crea un buffer per contenere il valore\r
        this._queryBuffer = this._device.createBuffer({\r
            size: 2 * 8,  // 8 byte (un valore a 64 bit)\r
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,\r
        });\r
\r
        this._resultBuffer = device.createBuffer({\r
            size: this._queryBuffer.size,\r
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,\r
        });\r
\r
    }\r
\r
\r
    lastTick: number = performance.now();\r
    average: number = 0;\r
    count: number = 0;\r
    increase: number = 0;\r
\r
    draw() {\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            },\r
            timestampWrites: {\r
                querySet: this._querySet,\r
                beginningOfPassWriteIndex: 0,\r
                endOfPassWriteIndex: 1\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 1000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //cattura i risultati\r
        encoder.resolveQuerySet(this._querySet, 0, this._querySet.count, this._queryBuffer, 0);\r
\r
        if (this._resultBuffer.mapState == "unmapped") {\r
            encoder.copyBufferToBuffer(this._queryBuffer, 0, this._resultBuffer, 0, this._resultBuffer.size);\r
        }\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
\r
        //copia i dati nel query set\r
        if (this._resultBuffer.mapState == "unmapped") {\r
\r
            this._resultBuffer.mapAsync(GPUMapMode.READ, 0, this._resultBuffer.size).then(() => {\r
                const times = new BigUint64Array(this._resultBuffer.getMappedRange(0, this._resultBuffer.size));\r
\r
                //calcola la performance media del pass\r
                const gpuTime = Number(times[1] - times[0]);\r
                this.increase += gpuTime;\r
                this.count++;\r
                if (performance.now() - this.lastTick >= 1000) {\r
                    this.average = this.increase / this.count;\r
                    this.count = 0;\r
                    this.increase = 0;\r
                    this.lastTick = performance.now();\r
                }\r
\r
                document.querySelector("p")!.innerHTML = "Tempo di Rendering: " + Math.ceil(this.average / 1000) + " Microsecondi";\r
                this._resultBuffer.unmap();\r
            });\r
        }\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
\r
\r
}`,Sr=`/**\r
 * Testo su una Texture\r
 * \r
 * Utilizzare una canvas come texture per disegnare testo\r
 */\r
\r
import { baseRendering } from "../utility/baseRendering";\r
import { Mat4, mat4 } from 'wgpu-matrix'\r
\r
export class Tutorial18 extends baseRendering {\r
    //device, l'oggetto incaricato di creare e gestire le risorse\r
    private _device: GPUDevice = null!;\r
\r
    //contesto di rendering associato al tag canvas\r
    private _context: GPUCanvasContext = null!;\r
\r
    //render pipeline\r
    private _pipeline: GPURenderPipeline = null!;\r
\r
    //buffer che contiene i vertici della forma\r
    private _vertexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene gli indici della forma\r
    private _indexBuffer: GPUBuffer = null!;\r
\r
    //buffer che contiene i dati che vengono passati allo shader\r
    private _uniformBuffer: GPUBuffer = null!;\r
\r
    //binding group, definisce come i dati nell'uniform buffer vengono associati allo shader\r
    private _bindGroup: GPUBindGroup = null!;\r
\r
    //texture contenente lo ZBuffer\r
    private _depthTexture: GPUTexture = null!;\r
\r
    //texture\r
    private _texture: GPUTexture = null!;\r
\r
    //sampler\r
    private _sampler: GPUSampler = null!;\r
\r
    //binding group per il sampler e per la texture\r
    private _textureBindGroup: GPUBindGroup = null!;\r
\r
    //context 2d\r
    private _context2D: CanvasRenderingContext2D = null!;\r
\r
    //canvas offline\r
    private _offlineCanvas: HTMLCanvasElement = null!;\r
\r
    private shader: string = \`\r
\r
        struct Vertex {\r
            @location(0) position: vec3f,\r
            @location(1) texcoord: vec2f,\r
        };\r
\r
        struct VertexOut {\r
            @builtin(position) position: vec4f ,\r
            @location(0) texcoord: vec2f,\r
        };\r
\r
        struct Transform\r
        {\r
            world:mat4x4f\r
        }\r
\r
        @group(0) @binding(0) var<uniform> transform: Transform;\r
\r
        @group(1) @binding(0) var textureSampler: sampler;\r
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;\r
\r
        @vertex fn vs(v:Vertex) -> VertexOut \r
        {\r
            var vOut:VertexOut;\r
            vOut.position=transform.world *vec4f(v.position, 1.0);\r
            vOut.texcoord=v.texcoord;\r
            return vOut;\r
        }\r
 \r
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {\r
            return  textureSample(diffuseTexture, textureSampler, v.texcoord);\r
        }\r
    \`;\r
\r
    async init() {\r
        //ottengo il device associato alla scheda video\r
        const adapter = await navigator.gpu?.requestAdapter();\r
        const device = await adapter?.requestDevice();\r
\r
        if (!device) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
\r
        this._device = device;\r
\r
        //individua la canvas\r
        const canvas = document.querySelector('canvas');\r
        if (!canvas) {\r
            alert("canvas non presente nella pagina")\r
            return;\r
        }\r
\r
        //riceve il context associato alla canvas\r
        const context = canvas.getContext('webgpu');\r
\r
\r
\r
        if (!context) {\r
            alert("browser o dispositivo non compatibile")\r
            return;\r
        }\r
        this._context = context;\r
\r
        //configura il device associandolo alla canvas usata per il rendering\r
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();\r
        this._context.configure({\r
            device: this._device,\r
            format: presentationFormat,\r
        });\r
\r
        //definisce gli 8 vertici di un cubo\r
        const vertexData: number[] = [\r
            // Front face\r
            -0.5, -0.5, 0.5, 0, 1,\r
            0.5, -0.5, 0.5, 1, 1,\r
            0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, 0.5, 0, 0,\r
\r
            // Back face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            -0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, -0.5, 0, 0,\r
            0.5, -0.5, -0.5, 0, 1,\r
\r
            // Top face\r
            -0.5, 0.5, -0.5, 0, 1,\r
            -0.5, 0.5, 0.5, 0, 0,\r
            0.5, 0.5, 0.5, 1, 0,\r
            0.5, 0.5, -0.5, 1, 1,\r
\r
            // Bottom face\r
            -0.5, -0.5, -0.5, 1, 1,\r
            0.5, -0.5, -0.5, 0, 1,\r
            0.5, -0.5, 0.5, 0, 0,\r
            -0.5, -0.5, 0.5, 1, 0,\r
\r
            // Right face\r
            0.5, -0.5, -0.5, 1, 1,\r
            0.5, 0.5, -0.5, 1, 0,\r
            0.5, 0.5, 0.5, 0, 0,\r
            0.5, -0.5, 0.5, 0, 1,\r
\r
            // Left face\r
            -0.5, -0.5, -0.5, 0, 1,\r
            -0.5, -0.5, 0.5, 1, 1,\r
            -0.5, 0.5, 0.5, 1, 0,\r
            -0.5, 0.5, -0.5, 0, 0,\r
        ];\r
\r
        //crea un vertex buffer\r
        this._vertexBuffer = device.createBuffer({\r
            size: vertexData.length * 4,\r
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array(vertexData));\r
\r
        //definisce l'ordine con cui ordinare i vertici per creare un cubo\r
        const indexData: number[] = [\r
            0, 1, 2, 2, 3, 0,   // Front face\r
            4, 5, 6, 6, 7, 4,   // Back face\r
            8, 9, 10, 10, 11, 8,   // Top face\r
            12, 13, 14, 14, 15, 12,   // Bottom face\r
            16, 17, 18, 18, 19, 16,   // Right face\r
            20, 21, 22, 22, 23, 20,   // Left face\r
        ];\r
\r
        //crea un index buffer\r
        this._indexBuffer = device.createBuffer({\r
            size: indexData.length * 4,\r
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,\r
        });\r
\r
        //copia le informazioni all'interno del buffer\r
        device.queue.writeBuffer(this._indexBuffer, 0, new Uint32Array(indexData));\r
\r
        //uniform shader\r
        this._uniformBuffer = device.createBuffer({\r
            size: 64,//dimensione di una matrice (16 valori da 4 byte)\r
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST\r
        });\r
\r
        //creazione di una texture da utilizzare per lo ZBuffer\r
        this._depthTexture = device.createTexture({\r
            size: [canvas.width, canvas.height],\r
            format: 'depth24plus',\r
            usage: GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea lo shader\r
        const module = device.createShaderModule({ code: this.shader });\r
\r
        //crea la pipeline\r
        this._pipeline = device.createRenderPipeline({\r
            layout: 'auto',\r
            vertex: {\r
                module,\r
                buffers: [\r
                    {\r
                        arrayStride: 20,// dimensione di ogni vertice\r
                        attributes: [\r
                            {\r
                                shaderLocation: 0, offset: 0, format: 'float32x3',\r
                            },\r
                            {\r
                                shaderLocation: 1, offset: 12, format: 'float32x2',\r
                            }\r
                        ]\r
                    }\r
                ]\r
            },\r
            fragment: {\r
                module,\r
                targets: [{ format: presentationFormat }],\r
            },\r
            //regole per l'applicazione dello ZBuffer\r
            depthStencil: {\r
                depthWriteEnabled: true,\r
                depthCompare: 'less',\r
                format: 'depth24plus',\r
            },\r
        });\r
\r
        //creazione bind group\r
        this._bindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(0),\r
            entries: [\r
                { binding: 0, resource: { buffer: this._uniformBuffer } },\r
            ],\r
        });\r
\r
        //carica un'immagine da file\r
\r
        //inizializza una texture della dimensione e formato uguale all'immagine caricata\r
        this._texture = this._device.createTexture({\r
            format: 'rgba8unorm',\r
            size: [256, 256, 1],\r
            usage: GPUTextureUsage.TEXTURE_BINDING |\r
                GPUTextureUsage.COPY_DST |\r
                GPUTextureUsage.RENDER_ATTACHMENT,\r
        });\r
\r
        //crea una canvas offline della stessa dimensione della texture\r
        this._offlineCanvas = document.createElement('canvas');\r
        this._offlineCanvas.width = this._texture.width;\r
        this._offlineCanvas.height = this._texture.height;\r
\r
        //crea un context 2d\r
        this._context2D = this._offlineCanvas.getContext('2d')!;\r
\r
        //crea un sampler (come la texture viene applicata al modello)\r
        this._sampler = this._device.createSampler({\r
            minFilter: "linear",\r
            magFilter: "linear",\r
            addressModeU: "repeat",\r
            addressModeV: "repeat"\r
        });\r
\r
        this._textureBindGroup = device.createBindGroup({\r
            layout: this._pipeline.getBindGroupLayout(1),\r
            entries: [\r
                { binding: 0, resource: this._sampler },\r
                { binding: 1, resource: this._texture.createView() }\r
            ],\r
        });\r
    }\r
\r
    draw() {\r
\r
        //utilizzo del context2d per pulire la canvas offline e scriverci sopra del testo\r
        this._context2D.fillStyle = "#0000FF";\r
        this._context2D.fillRect(0, 0, this._offlineCanvas.width, this._offlineCanvas.height);\r
        this._context2D.font = "32px Arial";\r
        this._context2D.fillStyle = "white";\r
        const d = new Date();\r
\r
        this._context2D.fillText("Time", 32, 64);\r
        this._context2D.fillText(\`\${d.getDate().toString().padStart(2, '0')}:\${(d.getMonth() + 1).toString().padStart(2, '0')}:\${d.getFullYear().toString().padStart(2, '0')}\`\r
            , 32, 96);\r
        this._context2D.fillText(\`\${d.getHours().toString().padStart(2, '0')}:\${d.getMinutes().toString().padStart(2, '0')}:\${d.getSeconds().toString().padStart(2, '0')}\`\r
            , 32, 128);\r
\r
        // si crea un command encoder che eseguirà le operazioni\r
        const encoder = this._device.createCommandEncoder();\r
\r
        //ottiene l'immagine dalla canvas e la copia sulla texture\r
        createImageBitmap(this._offlineCanvas).then(data => {\r
            this._device.queue.copyExternalImageToTexture(\r
                {\r
                    source: data\r
                },\r
                {\r
                    texture: this._texture\r
                },\r
                [this._offlineCanvas.width, this._offlineCanvas.height]);\r
        });\r
\r
        //definisce le caratteristiche del render pass\r
        const renderPassDescriptor: GPURenderPassDescriptor = {\r
            colorAttachments: [\r
                {\r
                    view: this._context.getCurrentTexture().createView(),\r
                    clearValue: [0, 0, 0, 0],\r
                    loadOp: 'clear',\r
                    storeOp: 'store',\r
                },\r
            ],\r
            depthStencilAttachment: {\r
                view: this._depthTexture.createView(),\r
                depthClearValue: 1.0,\r
                depthLoadOp: 'clear',\r
                depthStoreOp: 'store',\r
            }\r
        };\r
\r
        // si inizia un render pass, una sequenza di operazioni\r
        const pass = encoder.beginRenderPass(renderPassDescriptor);\r
\r
        //imposta la pipeline da eseguire\r
        pass.setPipeline(this._pipeline);\r
\r
        //imposta il vertex buffer nel pass\r
        pass.setVertexBuffer(0, this._vertexBuffer);\r
\r
        //imposta l'index buffer nel pass\r
        pass.setIndexBuffer(this._indexBuffer, 'uint32');\r
\r
        {\r
            //crea una matrice di rotazione\r
            let world: Mat4 = mat4.identity();\r
            mat4.rotateY(world, new Date().getTime() / 2000.0, world);\r
\r
            //crea una matrice associata alla camera\r
            let view: Mat4 = mat4.lookAt([0, 1, -2], [0, 0, 0], [0, 1, 0]);\r
\r
            //crea una matrice di proiezione\r
            let projection: Mat4 = mat4.perspective(Math.PI / 3, 1, 0.1, 1000);\r
\r
            //crea la matrice di trasformazione (prodotto tra le matrici)\r
            let transform: Mat4 = mat4.multiply(projection, mat4.multiply(view, world));\r
\r
            //scrive il contenuto nell'uniform buffer\r
            this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);\r
\r
            //associa il bindgroup\r
            pass.setBindGroup(0, this._bindGroup);\r
\r
            pass.setBindGroup(1, this._textureBindGroup);\r
\r
            //renderizza 6 indici\r
            pass.drawIndexed(36);\r
        }\r
\r
        //termine del render pass\r
        pass.end();\r
\r
        //submit dell'encoder, viene inviata la sequenza dei comandi registrati\r
        this._device.queue.submit([encoder.finish()]);\r
\r
        //richiedi un nuovo frame\r
        this.frameId = requestAnimationFrame(() => this.draw());\r
    }\r
\r
    async destroy(): Promise<void> {\r
        //interrompi il rendering\r
        cancelAnimationFrame(this.frameId);\r
\r
        //elimina immediatamente tutte le risorse per non lasciarle in memoria\r
        await this._device.queue.onSubmittedWorkDone();\r
\r
        this._vertexBuffer.destroy();\r
        this._indexBuffer.destroy();\r
        this._uniformBuffer.destroy();\r
        this._depthTexture.destroy();\r
        this._texture.destroy();\r
\r
        this._context.unconfigure();\r
    }\r
\r
\r
}`;class ie{constructor(){x(this,"frameId",0)}}class zr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null)}async init(){var S;const B=await((S=navigator.gpu)==null?void 0:S.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U})}draw(){const B=this._device.createCommandEncoder();this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._context.unconfigure()}}class Mr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"color",[[0,0,0,0],[1,0,0,0],[0,1,0,0],[0,0,1,0],[1,1,0,0],[1,0,1,0],[0,1,1,0]]);x(this,"numColor",0)}async init(){var S;const B=await((S=navigator.gpu)==null?void 0:S.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U}),v.onclick=()=>{this.numColor++,this.numColor>6&&(this.numColor=0)}}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:this.color[this.numColor],loadOp:"clear",storeOp:"store"}]};B.beginRenderPass(c).end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._context.unconfigure()}}class Or extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"shader",`
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  
          vec2f(-0.5, -0.5),  
          vec2f( 0.5, -0.5)   
        );
 
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
 
      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `)}async init(){var z;const B=await((z=navigator.gpu)==null?void 0:z.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=this._device.createShaderModule({code:this.shader});this._pipeline=this._device.createRenderPipeline({layout:"auto",vertex:{module:S},fragment:{module:S,targets:[{format:U}]}})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}]},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.draw(3),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._context.unconfigure()}}class Ar extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"shader",`

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
    `)}async init(){var V;const B=await((V=navigator.gpu)==null?void 0:V.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,.5,0,1,1,.5,.5,0,1,0,-.5,-.5,1,0,0,-.5,-.5,1,0,0,.5,.5,0,1,0,.5,-.5,1,1,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:z,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]}]},fragment:{module:z,targets:[{format:U}]}})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}]},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.draw(6),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._context.unconfigure()}}class Er extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"shader",`

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
    `)}async init(){var N;const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,.5,0,1,1,.5,.5,0,1,0,-.5,-.5,1,0,0,.5,-.5,1,1,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,1,3];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z));const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]}]},fragment:{module:V,targets:[{format:U}]}})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}]},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32"),v.drawIndexed(6),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._context.unconfigure()}}function Vr(p,G){return class extends p{constructor(...B){super(...B),G(this)}}}const qr=Vr(Array,p=>p.fill(0));let Y=1e-6;function Rr(p){function G(m=0,g=0){const _=new p(2);return m!==void 0&&(_[0]=m,g!==void 0&&(_[1]=g)),_}const B=G;function c(m,g,_){const e=_??new p(2);return e[0]=m,e[1]=g,e}function v(m,g){const _=g??new p(2);return _[0]=Math.ceil(m[0]),_[1]=Math.ceil(m[1]),_}function w(m,g){const _=g??new p(2);return _[0]=Math.floor(m[0]),_[1]=Math.floor(m[1]),_}function U(m,g){const _=g??new p(2);return _[0]=Math.round(m[0]),_[1]=Math.round(m[1]),_}function S(m,g=0,_=1,e){const u=e??new p(2);return u[0]=Math.min(_,Math.max(g,m[0])),u[1]=Math.min(_,Math.max(g,m[1])),u}function z(m,g,_){const e=_??new p(2);return e[0]=m[0]+g[0],e[1]=m[1]+g[1],e}function V(m,g,_,e){const u=e??new p(2);return u[0]=m[0]+g[0]*_,u[1]=m[1]+g[1]*_,u}function N(m,g){const _=m[0],e=m[1],u=g[0],i=g[1],a=Math.sqrt(_*_+e*e),t=Math.sqrt(u*u+i*i),o=a*t,h=o&&De(m,g)/o;return Math.acos(h)}function X(m,g,_){const e=_??new p(2);return e[0]=m[0]-g[0],e[1]=m[1]-g[1],e}const F=X;function C(m,g){return Math.abs(m[0]-g[0])<Y&&Math.abs(m[1]-g[1])<Y}function $(m,g){return m[0]===g[0]&&m[1]===g[1]}function j(m,g,_,e){const u=e??new p(2);return u[0]=m[0]+_*(g[0]-m[0]),u[1]=m[1]+_*(g[1]-m[1]),u}function ve(m,g,_,e){const u=e??new p(2);return u[0]=m[0]+_[0]*(g[0]-m[0]),u[1]=m[1]+_[1]*(g[1]-m[1]),u}function oe(m,g,_){const e=_??new p(2);return e[0]=Math.max(m[0],g[0]),e[1]=Math.max(m[1],g[1]),e}function be(m,g,_){const e=_??new p(2);return e[0]=Math.min(m[0],g[0]),e[1]=Math.min(m[1],g[1]),e}function se(m,g,_){const e=_??new p(2);return e[0]=m[0]*g,e[1]=m[1]*g,e}const Oe=se;function Ge(m,g,_){const e=_??new p(2);return e[0]=m[0]/g,e[1]=m[1]/g,e}function ye(m,g){const _=g??new p(2);return _[0]=1/m[0],_[1]=1/m[1],_}const Ae=ye;function Ue(m,g,_){const e=_??new p(3),u=m[0]*g[1]-m[1]*g[0];return e[0]=0,e[1]=0,e[2]=u,e}function De(m,g){return m[0]*g[0]+m[1]*g[1]}function ne(m){const g=m[0],_=m[1];return Math.sqrt(g*g+_*_)}const qe=ne;function me(m){const g=m[0],_=m[1];return g*g+_*_}const Re=me;function ue(m,g){const _=m[0]-g[0],e=m[1]-g[1];return Math.sqrt(_*_+e*e)}const H=ue;function W(m,g){const _=m[0]-g[0],e=m[1]-g[1];return _*_+e*e}const k=W;function ge(m,g){const _=g??new p(2),e=m[0],u=m[1],i=Math.sqrt(e*e+u*u);return i>1e-5?(_[0]=e/i,_[1]=u/i):(_[0]=0,_[1]=0),_}function Fe(m,g){const _=g??new p(2);return _[0]=-m[0],_[1]=-m[1],_}function J(m,g){const _=g??new p(2);return _[0]=m[0],_[1]=m[1],_}const Ce=J;function Te(m,g,_){const e=_??new p(2);return e[0]=m[0]*g[0],e[1]=m[1]*g[1],e}const Ie=Te;function Pe(m,g,_){const e=_??new p(2);return e[0]=m[0]/g[0],e[1]=m[1]/g[1],e}const Ee=Pe;function Ve(m=1,g){const _=g??new p(2),e=Math.random()*2*Math.PI;return _[0]=Math.cos(e)*m,_[1]=Math.sin(e)*m,_}function b(m){const g=m??new p(2);return g[0]=0,g[1]=0,g}function D(m,g,_){const e=_??new p(2),u=m[0],i=m[1];return e[0]=u*g[0]+i*g[4]+g[12],e[1]=u*g[1]+i*g[5]+g[13],e}function f(m,g,_){const e=_??new p(2),u=m[0],i=m[1];return e[0]=g[0]*u+g[4]*i+g[8],e[1]=g[1]*u+g[5]*i+g[9],e}function r(m,g,_,e){const u=e??new p(2),i=m[0]-g[0],a=m[1]-g[1],t=Math.sin(_),o=Math.cos(_);return u[0]=i*o-a*t+g[0],u[1]=i*t+a*o+g[1],u}function s(m,g,_){const e=_??new p(2);return ge(m,e),se(e,g,e)}function n(m,g,_){const e=_??new p(2);return ne(m)>g?s(m,g,e):J(m,e)}function d(m,g,_){const e=_??new p(2);return j(m,g,.5,e)}return{create:G,fromValues:B,set:c,ceil:v,floor:w,round:U,clamp:S,add:z,addScaled:V,angle:N,subtract:X,sub:F,equalsApproximately:C,equals:$,lerp:j,lerpV:ve,max:oe,min:be,mulScalar:se,scale:Oe,divScalar:Ge,inverse:ye,invert:Ae,cross:Ue,dot:De,length:ne,len:qe,lengthSq:me,lenSq:Re,distance:ue,dist:H,distanceSq:W,distSq:k,normalize:ge,negate:Fe,copy:J,clone:Ce,multiply:Te,mul:Ie,divide:Pe,div:Ee,random:Ve,zero:b,transformMat4:D,transformMat3:f,rotate:r,setLength:s,truncate:n,midpoint:d}}const er=new Map;function sr(p){let G=er.get(p);return G||(G=Rr(p),er.set(p,G)),G}function Fr(p){function G(t,o,h){const l=new p(3);return t!==void 0&&(l[0]=t,o!==void 0&&(l[1]=o,h!==void 0&&(l[2]=h))),l}const B=G;function c(t,o,h,l){const T=l??new p(3);return T[0]=t,T[1]=o,T[2]=h,T}function v(t,o){const h=o??new p(3);return h[0]=Math.ceil(t[0]),h[1]=Math.ceil(t[1]),h[2]=Math.ceil(t[2]),h}function w(t,o){const h=o??new p(3);return h[0]=Math.floor(t[0]),h[1]=Math.floor(t[1]),h[2]=Math.floor(t[2]),h}function U(t,o){const h=o??new p(3);return h[0]=Math.round(t[0]),h[1]=Math.round(t[1]),h[2]=Math.round(t[2]),h}function S(t,o=0,h=1,l){const T=l??new p(3);return T[0]=Math.min(h,Math.max(o,t[0])),T[1]=Math.min(h,Math.max(o,t[1])),T[2]=Math.min(h,Math.max(o,t[2])),T}function z(t,o,h){const l=h??new p(3);return l[0]=t[0]+o[0],l[1]=t[1]+o[1],l[2]=t[2]+o[2],l}function V(t,o,h,l){const T=l??new p(3);return T[0]=t[0]+o[0]*h,T[1]=t[1]+o[1]*h,T[2]=t[2]+o[2]*h,T}function N(t,o){const h=t[0],l=t[1],T=t[2],P=o[0],y=o[1],E=o[2],M=Math.sqrt(h*h+l*l+T*T),O=Math.sqrt(P*P+y*y+E*E),q=M*O,L=q&&De(t,o)/q;return Math.acos(L)}function X(t,o,h){const l=h??new p(3);return l[0]=t[0]-o[0],l[1]=t[1]-o[1],l[2]=t[2]-o[2],l}const F=X;function C(t,o){return Math.abs(t[0]-o[0])<Y&&Math.abs(t[1]-o[1])<Y&&Math.abs(t[2]-o[2])<Y}function $(t,o){return t[0]===o[0]&&t[1]===o[1]&&t[2]===o[2]}function j(t,o,h,l){const T=l??new p(3);return T[0]=t[0]+h*(o[0]-t[0]),T[1]=t[1]+h*(o[1]-t[1]),T[2]=t[2]+h*(o[2]-t[2]),T}function ve(t,o,h,l){const T=l??new p(3);return T[0]=t[0]+h[0]*(o[0]-t[0]),T[1]=t[1]+h[1]*(o[1]-t[1]),T[2]=t[2]+h[2]*(o[2]-t[2]),T}function oe(t,o,h){const l=h??new p(3);return l[0]=Math.max(t[0],o[0]),l[1]=Math.max(t[1],o[1]),l[2]=Math.max(t[2],o[2]),l}function be(t,o,h){const l=h??new p(3);return l[0]=Math.min(t[0],o[0]),l[1]=Math.min(t[1],o[1]),l[2]=Math.min(t[2],o[2]),l}function se(t,o,h){const l=h??new p(3);return l[0]=t[0]*o,l[1]=t[1]*o,l[2]=t[2]*o,l}const Oe=se;function Ge(t,o,h){const l=h??new p(3);return l[0]=t[0]/o,l[1]=t[1]/o,l[2]=t[2]/o,l}function ye(t,o){const h=o??new p(3);return h[0]=1/t[0],h[1]=1/t[1],h[2]=1/t[2],h}const Ae=ye;function Ue(t,o,h){const l=h??new p(3),T=t[2]*o[0]-t[0]*o[2],P=t[0]*o[1]-t[1]*o[0];return l[0]=t[1]*o[2]-t[2]*o[1],l[1]=T,l[2]=P,l}function De(t,o){return t[0]*o[0]+t[1]*o[1]+t[2]*o[2]}function ne(t){const o=t[0],h=t[1],l=t[2];return Math.sqrt(o*o+h*h+l*l)}const qe=ne;function me(t){const o=t[0],h=t[1],l=t[2];return o*o+h*h+l*l}const Re=me;function ue(t,o){const h=t[0]-o[0],l=t[1]-o[1],T=t[2]-o[2];return Math.sqrt(h*h+l*l+T*T)}const H=ue;function W(t,o){const h=t[0]-o[0],l=t[1]-o[1],T=t[2]-o[2];return h*h+l*l+T*T}const k=W;function ge(t,o){const h=o??new p(3),l=t[0],T=t[1],P=t[2],y=Math.sqrt(l*l+T*T+P*P);return y>1e-5?(h[0]=l/y,h[1]=T/y,h[2]=P/y):(h[0]=0,h[1]=0,h[2]=0),h}function Fe(t,o){const h=o??new p(3);return h[0]=-t[0],h[1]=-t[1],h[2]=-t[2],h}function J(t,o){const h=o??new p(3);return h[0]=t[0],h[1]=t[1],h[2]=t[2],h}const Ce=J;function Te(t,o,h){const l=h??new p(3);return l[0]=t[0]*o[0],l[1]=t[1]*o[1],l[2]=t[2]*o[2],l}const Ie=Te;function Pe(t,o,h){const l=h??new p(3);return l[0]=t[0]/o[0],l[1]=t[1]/o[1],l[2]=t[2]/o[2],l}const Ee=Pe;function Ve(t=1,o){const h=o??new p(3),l=Math.random()*2*Math.PI,T=Math.random()*2-1,P=Math.sqrt(1-T*T)*t;return h[0]=Math.cos(l)*P,h[1]=Math.sin(l)*P,h[2]=T*t,h}function b(t){const o=t??new p(3);return o[0]=0,o[1]=0,o[2]=0,o}function D(t,o,h){const l=h??new p(3),T=t[0],P=t[1],y=t[2],E=o[3]*T+o[7]*P+o[11]*y+o[15]||1;return l[0]=(o[0]*T+o[4]*P+o[8]*y+o[12])/E,l[1]=(o[1]*T+o[5]*P+o[9]*y+o[13])/E,l[2]=(o[2]*T+o[6]*P+o[10]*y+o[14])/E,l}function f(t,o,h){const l=h??new p(3),T=t[0],P=t[1],y=t[2];return l[0]=T*o[0*4+0]+P*o[1*4+0]+y*o[2*4+0],l[1]=T*o[0*4+1]+P*o[1*4+1]+y*o[2*4+1],l[2]=T*o[0*4+2]+P*o[1*4+2]+y*o[2*4+2],l}function r(t,o,h){const l=h??new p(3),T=t[0],P=t[1],y=t[2];return l[0]=T*o[0]+P*o[4]+y*o[8],l[1]=T*o[1]+P*o[5]+y*o[9],l[2]=T*o[2]+P*o[6]+y*o[10],l}function s(t,o,h){const l=h??new p(3),T=o[0],P=o[1],y=o[2],E=o[3]*2,M=t[0],O=t[1],q=t[2],L=P*q-y*O,R=y*M-T*q,I=T*O-P*M;return l[0]=M+L*E+(P*I-y*R)*2,l[1]=O+R*E+(y*L-T*I)*2,l[2]=q+I*E+(T*R-P*L)*2,l}function n(t,o){const h=o??new p(3);return h[0]=t[12],h[1]=t[13],h[2]=t[14],h}function d(t,o,h){const l=h??new p(3),T=o*4;return l[0]=t[T+0],l[1]=t[T+1],l[2]=t[T+2],l}function m(t,o){const h=o??new p(3),l=t[0],T=t[1],P=t[2],y=t[4],E=t[5],M=t[6],O=t[8],q=t[9],L=t[10];return h[0]=Math.sqrt(l*l+T*T+P*P),h[1]=Math.sqrt(y*y+E*E+M*M),h[2]=Math.sqrt(O*O+q*q+L*L),h}function g(t,o,h,l){const T=l??new p(3),P=[],y=[];return P[0]=t[0]-o[0],P[1]=t[1]-o[1],P[2]=t[2]-o[2],y[0]=P[0],y[1]=P[1]*Math.cos(h)-P[2]*Math.sin(h),y[2]=P[1]*Math.sin(h)+P[2]*Math.cos(h),T[0]=y[0]+o[0],T[1]=y[1]+o[1],T[2]=y[2]+o[2],T}function _(t,o,h,l){const T=l??new p(3),P=[],y=[];return P[0]=t[0]-o[0],P[1]=t[1]-o[1],P[2]=t[2]-o[2],y[0]=P[2]*Math.sin(h)+P[0]*Math.cos(h),y[1]=P[1],y[2]=P[2]*Math.cos(h)-P[0]*Math.sin(h),T[0]=y[0]+o[0],T[1]=y[1]+o[1],T[2]=y[2]+o[2],T}function e(t,o,h,l){const T=l??new p(3),P=[],y=[];return P[0]=t[0]-o[0],P[1]=t[1]-o[1],P[2]=t[2]-o[2],y[0]=P[0]*Math.cos(h)-P[1]*Math.sin(h),y[1]=P[0]*Math.sin(h)+P[1]*Math.cos(h),y[2]=P[2],T[0]=y[0]+o[0],T[1]=y[1]+o[1],T[2]=y[2]+o[2],T}function u(t,o,h){const l=h??new p(3);return ge(t,l),se(l,o,l)}function i(t,o,h){const l=h??new p(3);return ne(t)>o?u(t,o,l):J(t,l)}function a(t,o,h){const l=h??new p(3);return j(t,o,.5,l)}return{create:G,fromValues:B,set:c,ceil:v,floor:w,round:U,clamp:S,add:z,addScaled:V,angle:N,subtract:X,sub:F,equalsApproximately:C,equals:$,lerp:j,lerpV:ve,max:oe,min:be,mulScalar:se,scale:Oe,divScalar:Ge,inverse:ye,invert:Ae,cross:Ue,dot:De,length:ne,len:qe,lengthSq:me,lenSq:Re,distance:ue,dist:H,distanceSq:W,distSq:k,normalize:ge,negate:Fe,copy:J,clone:Ce,multiply:Te,mul:Ie,divide:Pe,div:Ee,random:Ve,zero:b,transformMat4:D,transformMat4Upper3x3:f,transformMat3:r,transformQuat:s,getTranslation:n,getAxis:d,getScaling:m,rotateX:g,rotateY:_,rotateZ:e,setLength:u,truncate:i,midpoint:a}}const rr=new Map;function We(p){let G=rr.get(p);return G||(G=Fr(p),rr.set(p,G)),G}function Cr(p){const G=sr(p),B=We(p);function c(r,s,n,d,m,g,_,e,u){const i=new p(12);return i[3]=0,i[7]=0,i[11]=0,r!==void 0&&(i[0]=r,s!==void 0&&(i[1]=s,n!==void 0&&(i[2]=n,d!==void 0&&(i[4]=d,m!==void 0&&(i[5]=m,g!==void 0&&(i[6]=g,_!==void 0&&(i[8]=_,e!==void 0&&(i[9]=e,u!==void 0&&(i[10]=u))))))))),i}function v(r,s,n,d,m,g,_,e,u,i){const a=i??new p(12);return a[0]=r,a[1]=s,a[2]=n,a[3]=0,a[4]=d,a[5]=m,a[6]=g,a[7]=0,a[8]=_,a[9]=e,a[10]=u,a[11]=0,a}function w(r,s){const n=s??new p(12);return n[0]=r[0],n[1]=r[1],n[2]=r[2],n[3]=0,n[4]=r[4],n[5]=r[5],n[6]=r[6],n[7]=0,n[8]=r[8],n[9]=r[9],n[10]=r[10],n[11]=0,n}function U(r,s){const n=s??new p(12),d=r[0],m=r[1],g=r[2],_=r[3],e=d+d,u=m+m,i=g+g,a=d*e,t=m*e,o=m*u,h=g*e,l=g*u,T=g*i,P=_*e,y=_*u,E=_*i;return n[0]=1-o-T,n[1]=t+E,n[2]=h-y,n[3]=0,n[4]=t-E,n[5]=1-a-T,n[6]=l+P,n[7]=0,n[8]=h+y,n[9]=l-P,n[10]=1-a-o,n[11]=0,n}function S(r,s){const n=s??new p(12);return n[0]=-r[0],n[1]=-r[1],n[2]=-r[2],n[4]=-r[4],n[5]=-r[5],n[6]=-r[6],n[8]=-r[8],n[9]=-r[9],n[10]=-r[10],n}function z(r,s,n){const d=n??new p(12);return d[0]=r[0]*s,d[1]=r[1]*s,d[2]=r[2]*s,d[4]=r[4]*s,d[5]=r[5]*s,d[6]=r[6]*s,d[8]=r[8]*s,d[9]=r[9]*s,d[10]=r[10]*s,d}const V=z;function N(r,s,n){const d=n??new p(12);return d[0]=r[0]+s[0],d[1]=r[1]+s[1],d[2]=r[2]+s[2],d[4]=r[4]+s[4],d[5]=r[5]+s[5],d[6]=r[6]+s[6],d[8]=r[8]+s[8],d[9]=r[9]+s[9],d[10]=r[10]+s[10],d}function X(r,s){const n=s??new p(12);return n[0]=r[0],n[1]=r[1],n[2]=r[2],n[4]=r[4],n[5]=r[5],n[6]=r[6],n[8]=r[8],n[9]=r[9],n[10]=r[10],n}const F=X;function C(r,s){return Math.abs(r[0]-s[0])<Y&&Math.abs(r[1]-s[1])<Y&&Math.abs(r[2]-s[2])<Y&&Math.abs(r[4]-s[4])<Y&&Math.abs(r[5]-s[5])<Y&&Math.abs(r[6]-s[6])<Y&&Math.abs(r[8]-s[8])<Y&&Math.abs(r[9]-s[9])<Y&&Math.abs(r[10]-s[10])<Y}function $(r,s){return r[0]===s[0]&&r[1]===s[1]&&r[2]===s[2]&&r[4]===s[4]&&r[5]===s[5]&&r[6]===s[6]&&r[8]===s[8]&&r[9]===s[9]&&r[10]===s[10]}function j(r){const s=r??new p(12);return s[0]=1,s[1]=0,s[2]=0,s[4]=0,s[5]=1,s[6]=0,s[8]=0,s[9]=0,s[10]=1,s}function ve(r,s){const n=s??new p(12);if(n===r){let o;return o=r[1],r[1]=r[4],r[4]=o,o=r[2],r[2]=r[8],r[8]=o,o=r[6],r[6]=r[9],r[9]=o,n}const d=r[0*4+0],m=r[0*4+1],g=r[0*4+2],_=r[1*4+0],e=r[1*4+1],u=r[1*4+2],i=r[2*4+0],a=r[2*4+1],t=r[2*4+2];return n[0]=d,n[1]=_,n[2]=i,n[4]=m,n[5]=e,n[6]=a,n[8]=g,n[9]=u,n[10]=t,n}function oe(r,s){const n=s??new p(12),d=r[0*4+0],m=r[0*4+1],g=r[0*4+2],_=r[1*4+0],e=r[1*4+1],u=r[1*4+2],i=r[2*4+0],a=r[2*4+1],t=r[2*4+2],o=t*e-u*a,h=-t*_+u*i,l=a*_-e*i,T=1/(d*o+m*h+g*l);return n[0]=o*T,n[1]=(-t*m+g*a)*T,n[2]=(u*m-g*e)*T,n[4]=h*T,n[5]=(t*d-g*i)*T,n[6]=(-u*d+g*_)*T,n[8]=l*T,n[9]=(-a*d+m*i)*T,n[10]=(e*d-m*_)*T,n}function be(r){const s=r[0],n=r[0*4+1],d=r[0*4+2],m=r[1*4+0],g=r[1*4+1],_=r[1*4+2],e=r[2*4+0],u=r[2*4+1],i=r[2*4+2];return s*(g*i-u*_)-m*(n*i-u*d)+e*(n*_-g*d)}const se=oe;function Oe(r,s,n){const d=n??new p(12),m=r[0],g=r[1],_=r[2],e=r[4],u=r[5],i=r[6],a=r[8],t=r[9],o=r[10],h=s[0],l=s[1],T=s[2],P=s[4],y=s[5],E=s[6],M=s[8],O=s[9],q=s[10];return d[0]=m*h+e*l+a*T,d[1]=g*h+u*l+t*T,d[2]=_*h+i*l+o*T,d[4]=m*P+e*y+a*E,d[5]=g*P+u*y+t*E,d[6]=_*P+i*y+o*E,d[8]=m*M+e*O+a*q,d[9]=g*M+u*O+t*q,d[10]=_*M+i*O+o*q,d}const Ge=Oe;function ye(r,s,n){const d=n??j();return r!==d&&(d[0]=r[0],d[1]=r[1],d[2]=r[2],d[4]=r[4],d[5]=r[5],d[6]=r[6]),d[8]=s[0],d[9]=s[1],d[10]=1,d}function Ae(r,s){const n=s??G.create();return n[0]=r[8],n[1]=r[9],n}function Ue(r,s,n){const d=n??G.create(),m=s*4;return d[0]=r[m+0],d[1]=r[m+1],d}function De(r,s,n,d){const m=d===r?r:X(r,d),g=n*4;return m[g+0]=s[0],m[g+1]=s[1],m}function ne(r,s){const n=s??G.create(),d=r[0],m=r[1],g=r[4],_=r[5];return n[0]=Math.sqrt(d*d+m*m),n[1]=Math.sqrt(g*g+_*_),n}function qe(r,s){const n=s??B.create(),d=r[0],m=r[1],g=r[2],_=r[4],e=r[5],u=r[6],i=r[8],a=r[9],t=r[10];return n[0]=Math.sqrt(d*d+m*m+g*g),n[1]=Math.sqrt(_*_+e*e+u*u),n[2]=Math.sqrt(i*i+a*a+t*t),n}function me(r,s){const n=s??new p(12);return n[0]=1,n[1]=0,n[2]=0,n[4]=0,n[5]=1,n[6]=0,n[8]=r[0],n[9]=r[1],n[10]=1,n}function Re(r,s,n){const d=n??new p(12),m=s[0],g=s[1],_=r[0],e=r[1],u=r[2],i=r[1*4+0],a=r[1*4+1],t=r[1*4+2],o=r[2*4+0],h=r[2*4+1],l=r[2*4+2];return r!==d&&(d[0]=_,d[1]=e,d[2]=u,d[4]=i,d[5]=a,d[6]=t),d[8]=_*m+i*g+o,d[9]=e*m+a*g+h,d[10]=u*m+t*g+l,d}function ue(r,s){const n=s??new p(12),d=Math.cos(r),m=Math.sin(r);return n[0]=d,n[1]=m,n[2]=0,n[4]=-m,n[5]=d,n[6]=0,n[8]=0,n[9]=0,n[10]=1,n}function H(r,s,n){const d=n??new p(12),m=r[0*4+0],g=r[0*4+1],_=r[0*4+2],e=r[1*4+0],u=r[1*4+1],i=r[1*4+2],a=Math.cos(s),t=Math.sin(s);return d[0]=a*m+t*e,d[1]=a*g+t*u,d[2]=a*_+t*i,d[4]=a*e-t*m,d[5]=a*u-t*g,d[6]=a*i-t*_,r!==d&&(d[8]=r[8],d[9]=r[9],d[10]=r[10]),d}function W(r,s){const n=s??new p(12),d=Math.cos(r),m=Math.sin(r);return n[0]=1,n[1]=0,n[2]=0,n[4]=0,n[5]=d,n[6]=m,n[8]=0,n[9]=-m,n[10]=d,n}function k(r,s,n){const d=n??new p(12),m=r[4],g=r[5],_=r[6],e=r[8],u=r[9],i=r[10],a=Math.cos(s),t=Math.sin(s);return d[4]=a*m+t*e,d[5]=a*g+t*u,d[6]=a*_+t*i,d[8]=a*e-t*m,d[9]=a*u-t*g,d[10]=a*i-t*_,r!==d&&(d[0]=r[0],d[1]=r[1],d[2]=r[2]),d}function ge(r,s){const n=s??new p(12),d=Math.cos(r),m=Math.sin(r);return n[0]=d,n[1]=0,n[2]=-m,n[4]=0,n[5]=1,n[6]=0,n[8]=m,n[9]=0,n[10]=d,n}function Fe(r,s,n){const d=n??new p(12),m=r[0*4+0],g=r[0*4+1],_=r[0*4+2],e=r[2*4+0],u=r[2*4+1],i=r[2*4+2],a=Math.cos(s),t=Math.sin(s);return d[0]=a*m-t*e,d[1]=a*g-t*u,d[2]=a*_-t*i,d[8]=a*e+t*m,d[9]=a*u+t*g,d[10]=a*i+t*_,r!==d&&(d[4]=r[4],d[5]=r[5],d[6]=r[6]),d}const J=ue,Ce=H;function Te(r,s){const n=s??new p(12);return n[0]=r[0],n[1]=0,n[2]=0,n[4]=0,n[5]=r[1],n[6]=0,n[8]=0,n[9]=0,n[10]=1,n}function Ie(r,s,n){const d=n??new p(12),m=s[0],g=s[1];return d[0]=m*r[0*4+0],d[1]=m*r[0*4+1],d[2]=m*r[0*4+2],d[4]=g*r[1*4+0],d[5]=g*r[1*4+1],d[6]=g*r[1*4+2],r!==d&&(d[8]=r[8],d[9]=r[9],d[10]=r[10]),d}function Pe(r,s){const n=s??new p(12);return n[0]=r[0],n[1]=0,n[2]=0,n[4]=0,n[5]=r[1],n[6]=0,n[8]=0,n[9]=0,n[10]=r[2],n}function Ee(r,s,n){const d=n??new p(12),m=s[0],g=s[1],_=s[2];return d[0]=m*r[0*4+0],d[1]=m*r[0*4+1],d[2]=m*r[0*4+2],d[4]=g*r[1*4+0],d[5]=g*r[1*4+1],d[6]=g*r[1*4+2],d[8]=_*r[2*4+0],d[9]=_*r[2*4+1],d[10]=_*r[2*4+2],d}function Ve(r,s){const n=s??new p(12);return n[0]=r,n[1]=0,n[2]=0,n[4]=0,n[5]=r,n[6]=0,n[8]=0,n[9]=0,n[10]=1,n}function b(r,s,n){const d=n??new p(12);return d[0]=s*r[0*4+0],d[1]=s*r[0*4+1],d[2]=s*r[0*4+2],d[4]=s*r[1*4+0],d[5]=s*r[1*4+1],d[6]=s*r[1*4+2],r!==d&&(d[8]=r[8],d[9]=r[9],d[10]=r[10]),d}function D(r,s){const n=s??new p(12);return n[0]=r,n[1]=0,n[2]=0,n[4]=0,n[5]=r,n[6]=0,n[8]=0,n[9]=0,n[10]=r,n}function f(r,s,n){const d=n??new p(12);return d[0]=s*r[0*4+0],d[1]=s*r[0*4+1],d[2]=s*r[0*4+2],d[4]=s*r[1*4+0],d[5]=s*r[1*4+1],d[6]=s*r[1*4+2],d[8]=s*r[2*4+0],d[9]=s*r[2*4+1],d[10]=s*r[2*4+2],d}return{add:N,clone:F,copy:X,create:c,determinant:be,equals:$,equalsApproximately:C,fromMat4:w,fromQuat:U,get3DScaling:qe,getAxis:Ue,getScaling:ne,getTranslation:Ae,identity:j,inverse:oe,invert:se,mul:Ge,mulScalar:V,multiply:Oe,multiplyScalar:z,negate:S,rotate:H,rotateX:k,rotateY:Fe,rotateZ:Ce,rotation:ue,rotationX:W,rotationY:ge,rotationZ:J,scale:Ie,scale3D:Ee,scaling:Te,scaling3D:Pe,set:v,setAxis:De,setTranslation:ye,translate:Re,translation:me,transpose:ve,uniformScale:b,uniformScale3D:f,uniformScaling:Ve,uniformScaling3D:D}}const tr=new Map;function Ir(p){let G=tr.get(p);return G||(G=Cr(p),tr.set(p,G)),G}function Nr(p){const G=We(p);function B(e,u,i,a,t,o,h,l,T,P,y,E,M,O,q,L){const R=new p(16);return e!==void 0&&(R[0]=e,u!==void 0&&(R[1]=u,i!==void 0&&(R[2]=i,a!==void 0&&(R[3]=a,t!==void 0&&(R[4]=t,o!==void 0&&(R[5]=o,h!==void 0&&(R[6]=h,l!==void 0&&(R[7]=l,T!==void 0&&(R[8]=T,P!==void 0&&(R[9]=P,y!==void 0&&(R[10]=y,E!==void 0&&(R[11]=E,M!==void 0&&(R[12]=M,O!==void 0&&(R[13]=O,q!==void 0&&(R[14]=q,L!==void 0&&(R[15]=L)))))))))))))))),R}function c(e,u,i,a,t,o,h,l,T,P,y,E,M,O,q,L,R){const I=R??new p(16);return I[0]=e,I[1]=u,I[2]=i,I[3]=a,I[4]=t,I[5]=o,I[6]=h,I[7]=l,I[8]=T,I[9]=P,I[10]=y,I[11]=E,I[12]=M,I[13]=O,I[14]=q,I[15]=L,I}function v(e,u){const i=u??new p(16);return i[0]=e[0],i[1]=e[1],i[2]=e[2],i[3]=0,i[4]=e[4],i[5]=e[5],i[6]=e[6],i[7]=0,i[8]=e[8],i[9]=e[9],i[10]=e[10],i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function w(e,u){const i=u??new p(16),a=e[0],t=e[1],o=e[2],h=e[3],l=a+a,T=t+t,P=o+o,y=a*l,E=t*l,M=t*T,O=o*l,q=o*T,L=o*P,R=h*l,I=h*T,Q=h*P;return i[0]=1-M-L,i[1]=E+Q,i[2]=O-I,i[3]=0,i[4]=E-Q,i[5]=1-y-L,i[6]=q+R,i[7]=0,i[8]=O+I,i[9]=q-R,i[10]=1-y-M,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function U(e,u){const i=u??new p(16);return i[0]=-e[0],i[1]=-e[1],i[2]=-e[2],i[3]=-e[3],i[4]=-e[4],i[5]=-e[5],i[6]=-e[6],i[7]=-e[7],i[8]=-e[8],i[9]=-e[9],i[10]=-e[10],i[11]=-e[11],i[12]=-e[12],i[13]=-e[13],i[14]=-e[14],i[15]=-e[15],i}function S(e,u,i){const a=i??new p(16);return a[0]=e[0]+u[0],a[1]=e[1]+u[1],a[2]=e[2]+u[2],a[3]=e[3]+u[3],a[4]=e[4]+u[4],a[5]=e[5]+u[5],a[6]=e[6]+u[6],a[7]=e[7]+u[7],a[8]=e[8]+u[8],a[9]=e[9]+u[9],a[10]=e[10]+u[10],a[11]=e[11]+u[11],a[12]=e[12]+u[12],a[13]=e[13]+u[13],a[14]=e[14]+u[14],a[15]=e[15]+u[15],a}function z(e,u,i){const a=i??new p(16);return a[0]=e[0]*u,a[1]=e[1]*u,a[2]=e[2]*u,a[3]=e[3]*u,a[4]=e[4]*u,a[5]=e[5]*u,a[6]=e[6]*u,a[7]=e[7]*u,a[8]=e[8]*u,a[9]=e[9]*u,a[10]=e[10]*u,a[11]=e[11]*u,a[12]=e[12]*u,a[13]=e[13]*u,a[14]=e[14]*u,a[15]=e[15]*u,a}const V=z;function N(e,u){const i=u??new p(16);return i[0]=e[0],i[1]=e[1],i[2]=e[2],i[3]=e[3],i[4]=e[4],i[5]=e[5],i[6]=e[6],i[7]=e[7],i[8]=e[8],i[9]=e[9],i[10]=e[10],i[11]=e[11],i[12]=e[12],i[13]=e[13],i[14]=e[14],i[15]=e[15],i}const X=N;function F(e,u){return Math.abs(e[0]-u[0])<Y&&Math.abs(e[1]-u[1])<Y&&Math.abs(e[2]-u[2])<Y&&Math.abs(e[3]-u[3])<Y&&Math.abs(e[4]-u[4])<Y&&Math.abs(e[5]-u[5])<Y&&Math.abs(e[6]-u[6])<Y&&Math.abs(e[7]-u[7])<Y&&Math.abs(e[8]-u[8])<Y&&Math.abs(e[9]-u[9])<Y&&Math.abs(e[10]-u[10])<Y&&Math.abs(e[11]-u[11])<Y&&Math.abs(e[12]-u[12])<Y&&Math.abs(e[13]-u[13])<Y&&Math.abs(e[14]-u[14])<Y&&Math.abs(e[15]-u[15])<Y}function C(e,u){return e[0]===u[0]&&e[1]===u[1]&&e[2]===u[2]&&e[3]===u[3]&&e[4]===u[4]&&e[5]===u[5]&&e[6]===u[6]&&e[7]===u[7]&&e[8]===u[8]&&e[9]===u[9]&&e[10]===u[10]&&e[11]===u[11]&&e[12]===u[12]&&e[13]===u[13]&&e[14]===u[14]&&e[15]===u[15]}function $(e){const u=e??new p(16);return u[0]=1,u[1]=0,u[2]=0,u[3]=0,u[4]=0,u[5]=1,u[6]=0,u[7]=0,u[8]=0,u[9]=0,u[10]=1,u[11]=0,u[12]=0,u[13]=0,u[14]=0,u[15]=1,u}function j(e,u){const i=u??new p(16);if(i===e){let Z;return Z=e[1],e[1]=e[4],e[4]=Z,Z=e[2],e[2]=e[8],e[8]=Z,Z=e[3],e[3]=e[12],e[12]=Z,Z=e[6],e[6]=e[9],e[9]=Z,Z=e[7],e[7]=e[13],e[13]=Z,Z=e[11],e[11]=e[14],e[14]=Z,i}const a=e[0*4+0],t=e[0*4+1],o=e[0*4+2],h=e[0*4+3],l=e[1*4+0],T=e[1*4+1],P=e[1*4+2],y=e[1*4+3],E=e[2*4+0],M=e[2*4+1],O=e[2*4+2],q=e[2*4+3],L=e[3*4+0],R=e[3*4+1],I=e[3*4+2],Q=e[3*4+3];return i[0]=a,i[1]=l,i[2]=E,i[3]=L,i[4]=t,i[5]=T,i[6]=M,i[7]=R,i[8]=o,i[9]=P,i[10]=O,i[11]=I,i[12]=h,i[13]=y,i[14]=q,i[15]=Q,i}function ve(e,u){const i=u??new p(16),a=e[0*4+0],t=e[0*4+1],o=e[0*4+2],h=e[0*4+3],l=e[1*4+0],T=e[1*4+1],P=e[1*4+2],y=e[1*4+3],E=e[2*4+0],M=e[2*4+1],O=e[2*4+2],q=e[2*4+3],L=e[3*4+0],R=e[3*4+1],I=e[3*4+2],Q=e[3*4+3],Z=O*Q,ee=I*q,re=P*Q,te=I*y,ae=P*q,ce=O*y,de=o*Q,le=I*h,fe=o*q,pe=O*h,xe=o*y,_e=P*h,Be=E*R,we=L*M,Se=l*R,ze=L*T,Me=l*M,Ne=E*T,Le=a*R,Ye=L*t,ke=a*M,Xe=E*t,je=a*T,He=l*t,$e=Z*T+te*M+ae*R-(ee*T+re*M+ce*R),Qe=ee*t+de*M+pe*R-(Z*t+le*M+fe*R),Je=re*t+le*T+xe*R-(te*t+de*T+_e*R),Ke=ce*t+fe*T+_e*M-(ae*t+pe*T+xe*M),he=1/(a*$e+l*Qe+E*Je+L*Ke);return i[0]=he*$e,i[1]=he*Qe,i[2]=he*Je,i[3]=he*Ke,i[4]=he*(ee*l+re*E+ce*L-(Z*l+te*E+ae*L)),i[5]=he*(Z*a+le*E+fe*L-(ee*a+de*E+pe*L)),i[6]=he*(te*a+de*l+_e*L-(re*a+le*l+xe*L)),i[7]=he*(ae*a+pe*l+xe*E-(ce*a+fe*l+_e*E)),i[8]=he*(Be*y+ze*q+Me*Q-(we*y+Se*q+Ne*Q)),i[9]=he*(we*h+Le*q+Xe*Q-(Be*h+Ye*q+ke*Q)),i[10]=he*(Se*h+Ye*y+je*Q-(ze*h+Le*y+He*Q)),i[11]=he*(Ne*h+ke*y+He*q-(Me*h+Xe*y+je*q)),i[12]=he*(Se*O+Ne*I+we*P-(Me*I+Be*P+ze*O)),i[13]=he*(ke*I+Be*o+Ye*O-(Le*O+Xe*I+we*o)),i[14]=he*(Le*P+He*I+ze*o-(je*I+Se*o+Ye*P)),i[15]=he*(je*O+Me*o+Xe*P-(ke*P+He*O+Ne*o)),i}function oe(e){const u=e[0],i=e[0*4+1],a=e[0*4+2],t=e[0*4+3],o=e[1*4+0],h=e[1*4+1],l=e[1*4+2],T=e[1*4+3],P=e[2*4+0],y=e[2*4+1],E=e[2*4+2],M=e[2*4+3],O=e[3*4+0],q=e[3*4+1],L=e[3*4+2],R=e[3*4+3],I=E*R,Q=L*M,Z=l*R,ee=L*T,re=l*M,te=E*T,ae=a*R,ce=L*t,de=a*M,le=E*t,fe=a*T,pe=l*t,xe=I*h+ee*y+re*q-(Q*h+Z*y+te*q),_e=Q*i+ae*y+le*q-(I*i+ce*y+de*q),Be=Z*i+ce*h+fe*q-(ee*i+ae*h+pe*q),we=te*i+de*h+pe*y-(re*i+le*h+fe*y);return u*xe+o*_e+P*Be+O*we}const be=ve;function se(e,u,i){const a=i??new p(16),t=e[0],o=e[1],h=e[2],l=e[3],T=e[4],P=e[5],y=e[6],E=e[7],M=e[8],O=e[9],q=e[10],L=e[11],R=e[12],I=e[13],Q=e[14],Z=e[15],ee=u[0],re=u[1],te=u[2],ae=u[3],ce=u[4],de=u[5],le=u[6],fe=u[7],pe=u[8],xe=u[9],_e=u[10],Be=u[11],we=u[12],Se=u[13],ze=u[14],Me=u[15];return a[0]=t*ee+T*re+M*te+R*ae,a[1]=o*ee+P*re+O*te+I*ae,a[2]=h*ee+y*re+q*te+Q*ae,a[3]=l*ee+E*re+L*te+Z*ae,a[4]=t*ce+T*de+M*le+R*fe,a[5]=o*ce+P*de+O*le+I*fe,a[6]=h*ce+y*de+q*le+Q*fe,a[7]=l*ce+E*de+L*le+Z*fe,a[8]=t*pe+T*xe+M*_e+R*Be,a[9]=o*pe+P*xe+O*_e+I*Be,a[10]=h*pe+y*xe+q*_e+Q*Be,a[11]=l*pe+E*xe+L*_e+Z*Be,a[12]=t*we+T*Se+M*ze+R*Me,a[13]=o*we+P*Se+O*ze+I*Me,a[14]=h*we+y*Se+q*ze+Q*Me,a[15]=l*we+E*Se+L*ze+Z*Me,a}const Oe=se;function Ge(e,u,i){const a=i??$();return e!==a&&(a[0]=e[0],a[1]=e[1],a[2]=e[2],a[3]=e[3],a[4]=e[4],a[5]=e[5],a[6]=e[6],a[7]=e[7],a[8]=e[8],a[9]=e[9],a[10]=e[10],a[11]=e[11]),a[12]=u[0],a[13]=u[1],a[14]=u[2],a[15]=1,a}function ye(e,u){const i=u??G.create();return i[0]=e[12],i[1]=e[13],i[2]=e[14],i}function Ae(e,u,i){const a=i??G.create(),t=u*4;return a[0]=e[t+0],a[1]=e[t+1],a[2]=e[t+2],a}function Ue(e,u,i,a){const t=a===e?a:N(e,a),o=i*4;return t[o+0]=u[0],t[o+1]=u[1],t[o+2]=u[2],t}function De(e,u){const i=u??G.create(),a=e[0],t=e[1],o=e[2],h=e[4],l=e[5],T=e[6],P=e[8],y=e[9],E=e[10];return i[0]=Math.sqrt(a*a+t*t+o*o),i[1]=Math.sqrt(h*h+l*l+T*T),i[2]=Math.sqrt(P*P+y*y+E*E),i}function ne(e,u,i,a,t){const o=t??new p(16),h=Math.tan(Math.PI*.5-.5*e);if(o[0]=h/u,o[1]=0,o[2]=0,o[3]=0,o[4]=0,o[5]=h,o[6]=0,o[7]=0,o[8]=0,o[9]=0,o[11]=-1,o[12]=0,o[13]=0,o[15]=0,Number.isFinite(a)){const l=1/(i-a);o[10]=a*l,o[14]=a*i*l}else o[10]=-1,o[14]=-i;return o}function qe(e,u,i,a=1/0,t){const o=t??new p(16),h=1/Math.tan(e*.5);if(o[0]=h/u,o[1]=0,o[2]=0,o[3]=0,o[4]=0,o[5]=h,o[6]=0,o[7]=0,o[8]=0,o[9]=0,o[11]=-1,o[12]=0,o[13]=0,o[15]=0,a===1/0)o[10]=0,o[14]=i;else{const l=1/(a-i);o[10]=i*l,o[14]=a*i*l}return o}function me(e,u,i,a,t,o,h){const l=h??new p(16);return l[0]=2/(u-e),l[1]=0,l[2]=0,l[3]=0,l[4]=0,l[5]=2/(a-i),l[6]=0,l[7]=0,l[8]=0,l[9]=0,l[10]=1/(t-o),l[11]=0,l[12]=(u+e)/(e-u),l[13]=(a+i)/(i-a),l[14]=t/(t-o),l[15]=1,l}function Re(e,u,i,a,t,o,h){const l=h??new p(16),T=u-e,P=a-i,y=t-o;return l[0]=2*t/T,l[1]=0,l[2]=0,l[3]=0,l[4]=0,l[5]=2*t/P,l[6]=0,l[7]=0,l[8]=(e+u)/T,l[9]=(a+i)/P,l[10]=o/y,l[11]=-1,l[12]=0,l[13]=0,l[14]=t*o/y,l[15]=0,l}function ue(e,u,i,a,t,o=1/0,h){const l=h??new p(16),T=u-e,P=a-i;if(l[0]=2*t/T,l[1]=0,l[2]=0,l[3]=0,l[4]=0,l[5]=2*t/P,l[6]=0,l[7]=0,l[8]=(e+u)/T,l[9]=(a+i)/P,l[11]=-1,l[12]=0,l[13]=0,l[15]=0,o===1/0)l[10]=0,l[14]=t;else{const y=1/(o-t);l[10]=t*y,l[14]=o*t*y}return l}const H=G.create(),W=G.create(),k=G.create();function ge(e,u,i,a){const t=a??new p(16);return G.normalize(G.subtract(u,e,k),k),G.normalize(G.cross(i,k,H),H),G.normalize(G.cross(k,H,W),W),t[0]=H[0],t[1]=H[1],t[2]=H[2],t[3]=0,t[4]=W[0],t[5]=W[1],t[6]=W[2],t[7]=0,t[8]=k[0],t[9]=k[1],t[10]=k[2],t[11]=0,t[12]=e[0],t[13]=e[1],t[14]=e[2],t[15]=1,t}function Fe(e,u,i,a){const t=a??new p(16);return G.normalize(G.subtract(e,u,k),k),G.normalize(G.cross(i,k,H),H),G.normalize(G.cross(k,H,W),W),t[0]=H[0],t[1]=H[1],t[2]=H[2],t[3]=0,t[4]=W[0],t[5]=W[1],t[6]=W[2],t[7]=0,t[8]=k[0],t[9]=k[1],t[10]=k[2],t[11]=0,t[12]=e[0],t[13]=e[1],t[14]=e[2],t[15]=1,t}function J(e,u,i,a){const t=a??new p(16);return G.normalize(G.subtract(e,u,k),k),G.normalize(G.cross(i,k,H),H),G.normalize(G.cross(k,H,W),W),t[0]=H[0],t[1]=W[0],t[2]=k[0],t[3]=0,t[4]=H[1],t[5]=W[1],t[6]=k[1],t[7]=0,t[8]=H[2],t[9]=W[2],t[10]=k[2],t[11]=0,t[12]=-(H[0]*e[0]+H[1]*e[1]+H[2]*e[2]),t[13]=-(W[0]*e[0]+W[1]*e[1]+W[2]*e[2]),t[14]=-(k[0]*e[0]+k[1]*e[1]+k[2]*e[2]),t[15]=1,t}function Ce(e,u){const i=u??new p(16);return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=e[0],i[13]=e[1],i[14]=e[2],i[15]=1,i}function Te(e,u,i){const a=i??new p(16),t=u[0],o=u[1],h=u[2],l=e[0],T=e[1],P=e[2],y=e[3],E=e[1*4+0],M=e[1*4+1],O=e[1*4+2],q=e[1*4+3],L=e[2*4+0],R=e[2*4+1],I=e[2*4+2],Q=e[2*4+3],Z=e[3*4+0],ee=e[3*4+1],re=e[3*4+2],te=e[3*4+3];return e!==a&&(a[0]=l,a[1]=T,a[2]=P,a[3]=y,a[4]=E,a[5]=M,a[6]=O,a[7]=q,a[8]=L,a[9]=R,a[10]=I,a[11]=Q),a[12]=l*t+E*o+L*h+Z,a[13]=T*t+M*o+R*h+ee,a[14]=P*t+O*o+I*h+re,a[15]=y*t+q*o+Q*h+te,a}function Ie(e,u){const i=u??new p(16),a=Math.cos(e),t=Math.sin(e);return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=a,i[6]=t,i[7]=0,i[8]=0,i[9]=-t,i[10]=a,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function Pe(e,u,i){const a=i??new p(16),t=e[4],o=e[5],h=e[6],l=e[7],T=e[8],P=e[9],y=e[10],E=e[11],M=Math.cos(u),O=Math.sin(u);return a[4]=M*t+O*T,a[5]=M*o+O*P,a[6]=M*h+O*y,a[7]=M*l+O*E,a[8]=M*T-O*t,a[9]=M*P-O*o,a[10]=M*y-O*h,a[11]=M*E-O*l,e!==a&&(a[0]=e[0],a[1]=e[1],a[2]=e[2],a[3]=e[3],a[12]=e[12],a[13]=e[13],a[14]=e[14],a[15]=e[15]),a}function Ee(e,u){const i=u??new p(16),a=Math.cos(e),t=Math.sin(e);return i[0]=a,i[1]=0,i[2]=-t,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=t,i[9]=0,i[10]=a,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function Ve(e,u,i){const a=i??new p(16),t=e[0*4+0],o=e[0*4+1],h=e[0*4+2],l=e[0*4+3],T=e[2*4+0],P=e[2*4+1],y=e[2*4+2],E=e[2*4+3],M=Math.cos(u),O=Math.sin(u);return a[0]=M*t-O*T,a[1]=M*o-O*P,a[2]=M*h-O*y,a[3]=M*l-O*E,a[8]=M*T+O*t,a[9]=M*P+O*o,a[10]=M*y+O*h,a[11]=M*E+O*l,e!==a&&(a[4]=e[4],a[5]=e[5],a[6]=e[6],a[7]=e[7],a[12]=e[12],a[13]=e[13],a[14]=e[14],a[15]=e[15]),a}function b(e,u){const i=u??new p(16),a=Math.cos(e),t=Math.sin(e);return i[0]=a,i[1]=t,i[2]=0,i[3]=0,i[4]=-t,i[5]=a,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function D(e,u,i){const a=i??new p(16),t=e[0*4+0],o=e[0*4+1],h=e[0*4+2],l=e[0*4+3],T=e[1*4+0],P=e[1*4+1],y=e[1*4+2],E=e[1*4+3],M=Math.cos(u),O=Math.sin(u);return a[0]=M*t+O*T,a[1]=M*o+O*P,a[2]=M*h+O*y,a[3]=M*l+O*E,a[4]=M*T-O*t,a[5]=M*P-O*o,a[6]=M*y-O*h,a[7]=M*E-O*l,e!==a&&(a[8]=e[8],a[9]=e[9],a[10]=e[10],a[11]=e[11],a[12]=e[12],a[13]=e[13],a[14]=e[14],a[15]=e[15]),a}function f(e,u,i){const a=i??new p(16);let t=e[0],o=e[1],h=e[2];const l=Math.sqrt(t*t+o*o+h*h);t/=l,o/=l,h/=l;const T=t*t,P=o*o,y=h*h,E=Math.cos(u),M=Math.sin(u),O=1-E;return a[0]=T+(1-T)*E,a[1]=t*o*O+h*M,a[2]=t*h*O-o*M,a[3]=0,a[4]=t*o*O-h*M,a[5]=P+(1-P)*E,a[6]=o*h*O+t*M,a[7]=0,a[8]=t*h*O+o*M,a[9]=o*h*O-t*M,a[10]=y+(1-y)*E,a[11]=0,a[12]=0,a[13]=0,a[14]=0,a[15]=1,a}const r=f;function s(e,u,i,a){const t=a??new p(16);let o=u[0],h=u[1],l=u[2];const T=Math.sqrt(o*o+h*h+l*l);o/=T,h/=T,l/=T;const P=o*o,y=h*h,E=l*l,M=Math.cos(i),O=Math.sin(i),q=1-M,L=P+(1-P)*M,R=o*h*q+l*O,I=o*l*q-h*O,Q=o*h*q-l*O,Z=y+(1-y)*M,ee=h*l*q+o*O,re=o*l*q+h*O,te=h*l*q-o*O,ae=E+(1-E)*M,ce=e[0],de=e[1],le=e[2],fe=e[3],pe=e[4],xe=e[5],_e=e[6],Be=e[7],we=e[8],Se=e[9],ze=e[10],Me=e[11];return t[0]=L*ce+R*pe+I*we,t[1]=L*de+R*xe+I*Se,t[2]=L*le+R*_e+I*ze,t[3]=L*fe+R*Be+I*Me,t[4]=Q*ce+Z*pe+ee*we,t[5]=Q*de+Z*xe+ee*Se,t[6]=Q*le+Z*_e+ee*ze,t[7]=Q*fe+Z*Be+ee*Me,t[8]=re*ce+te*pe+ae*we,t[9]=re*de+te*xe+ae*Se,t[10]=re*le+te*_e+ae*ze,t[11]=re*fe+te*Be+ae*Me,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t}const n=s;function d(e,u){const i=u??new p(16);return i[0]=e[0],i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=e[1],i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=e[2],i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function m(e,u,i){const a=i??new p(16),t=u[0],o=u[1],h=u[2];return a[0]=t*e[0*4+0],a[1]=t*e[0*4+1],a[2]=t*e[0*4+2],a[3]=t*e[0*4+3],a[4]=o*e[1*4+0],a[5]=o*e[1*4+1],a[6]=o*e[1*4+2],a[7]=o*e[1*4+3],a[8]=h*e[2*4+0],a[9]=h*e[2*4+1],a[10]=h*e[2*4+2],a[11]=h*e[2*4+3],e!==a&&(a[12]=e[12],a[13]=e[13],a[14]=e[14],a[15]=e[15]),a}function g(e,u){const i=u??new p(16);return i[0]=e,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=e,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=e,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function _(e,u,i){const a=i??new p(16);return a[0]=u*e[0*4+0],a[1]=u*e[0*4+1],a[2]=u*e[0*4+2],a[3]=u*e[0*4+3],a[4]=u*e[1*4+0],a[5]=u*e[1*4+1],a[6]=u*e[1*4+2],a[7]=u*e[1*4+3],a[8]=u*e[2*4+0],a[9]=u*e[2*4+1],a[10]=u*e[2*4+2],a[11]=u*e[2*4+3],e!==a&&(a[12]=e[12],a[13]=e[13],a[14]=e[14],a[15]=e[15]),a}return{add:S,aim:ge,axisRotate:s,axisRotation:f,cameraAim:Fe,clone:X,copy:N,create:B,determinant:oe,equals:C,equalsApproximately:F,fromMat3:v,fromQuat:w,frustum:Re,frustumReverseZ:ue,getAxis:Ae,getScaling:De,getTranslation:ye,identity:$,inverse:ve,invert:be,lookAt:J,mul:Oe,mulScalar:V,multiply:se,multiplyScalar:z,negate:U,ortho:me,perspective:ne,perspectiveReverseZ:qe,rotate:n,rotateX:Pe,rotateY:Ve,rotateZ:D,rotation:r,rotationX:Ie,rotationY:Ee,rotationZ:b,scale:m,scaling:d,set:c,setAxis:Ue,setTranslation:Ge,translate:Te,translation:Ce,transpose:j,uniformScale:_,uniformScaling:g}}const ir=new Map;function Lr(p){let G=ir.get(p);return G||(G=Nr(p),ir.set(p,G)),G}function Yr(p){const G=We(p);function B(b,D,f,r){const s=new p(4);return b!==void 0&&(s[0]=b,D!==void 0&&(s[1]=D,f!==void 0&&(s[2]=f,r!==void 0&&(s[3]=r)))),s}const c=B;function v(b,D,f,r,s){const n=s??new p(4);return n[0]=b,n[1]=D,n[2]=f,n[3]=r,n}function w(b,D,f){const r=f??new p(4),s=D*.5,n=Math.sin(s);return r[0]=n*b[0],r[1]=n*b[1],r[2]=n*b[2],r[3]=Math.cos(s),r}function U(b,D){const f=D??G.create(3),r=Math.acos(b[3])*2,s=Math.sin(r*.5);return s>Y?(f[0]=b[0]/s,f[1]=b[1]/s,f[2]=b[2]/s):(f[0]=1,f[1]=0,f[2]=0),{angle:r,axis:f}}function S(b,D){const f=ne(b,D);return Math.acos(2*f*f-1)}function z(b,D,f){const r=f??new p(4),s=b[0],n=b[1],d=b[2],m=b[3],g=D[0],_=D[1],e=D[2],u=D[3];return r[0]=s*u+m*g+n*e-d*_,r[1]=n*u+m*_+d*g-s*e,r[2]=d*u+m*e+s*_-n*g,r[3]=m*u-s*g-n*_-d*e,r}const V=z;function N(b,D,f){const r=f??new p(4),s=D*.5,n=b[0],d=b[1],m=b[2],g=b[3],_=Math.sin(s),e=Math.cos(s);return r[0]=n*e+g*_,r[1]=d*e+m*_,r[2]=m*e-d*_,r[3]=g*e-n*_,r}function X(b,D,f){const r=f??new p(4),s=D*.5,n=b[0],d=b[1],m=b[2],g=b[3],_=Math.sin(s),e=Math.cos(s);return r[0]=n*e-m*_,r[1]=d*e+g*_,r[2]=m*e+n*_,r[3]=g*e-d*_,r}function F(b,D,f){const r=f??new p(4),s=D*.5,n=b[0],d=b[1],m=b[2],g=b[3],_=Math.sin(s),e=Math.cos(s);return r[0]=n*e+d*_,r[1]=d*e-n*_,r[2]=m*e+g*_,r[3]=g*e-m*_,r}function C(b,D,f,r){const s=r??new p(4),n=b[0],d=b[1],m=b[2],g=b[3];let _=D[0],e=D[1],u=D[2],i=D[3],a=n*_+d*e+m*u+g*i;a<0&&(a=-a,_=-_,e=-e,u=-u,i=-i);let t,o;if(1-a>Y){const h=Math.acos(a),l=Math.sin(h);t=Math.sin((1-f)*h)/l,o=Math.sin(f*h)/l}else t=1-f,o=f;return s[0]=t*n+o*_,s[1]=t*d+o*e,s[2]=t*m+o*u,s[3]=t*g+o*i,s}function $(b,D){const f=D??new p(4),r=b[0],s=b[1],n=b[2],d=b[3],m=r*r+s*s+n*n+d*d,g=m?1/m:0;return f[0]=-r*g,f[1]=-s*g,f[2]=-n*g,f[3]=d*g,f}function j(b,D){const f=D??new p(4);return f[0]=-b[0],f[1]=-b[1],f[2]=-b[2],f[3]=b[3],f}function ve(b,D){const f=D??new p(4),r=b[0]+b[5]+b[10];if(r>0){const s=Math.sqrt(r+1);f[3]=.5*s;const n=.5/s;f[0]=(b[6]-b[9])*n,f[1]=(b[8]-b[2])*n,f[2]=(b[1]-b[4])*n}else{let s=0;b[5]>b[0]&&(s=1),b[10]>b[s*4+s]&&(s=2);const n=(s+1)%3,d=(s+2)%3,m=Math.sqrt(b[s*4+s]-b[n*4+n]-b[d*4+d]+1);f[s]=.5*m;const g=.5/m;f[3]=(b[n*4+d]-b[d*4+n])*g,f[n]=(b[n*4+s]+b[s*4+n])*g,f[d]=(b[d*4+s]+b[s*4+d])*g}return f}function oe(b,D,f,r,s){const n=s??new p(4),d=b*.5,m=D*.5,g=f*.5,_=Math.sin(d),e=Math.cos(d),u=Math.sin(m),i=Math.cos(m),a=Math.sin(g),t=Math.cos(g);switch(r){case"xyz":n[0]=_*i*t+e*u*a,n[1]=e*u*t-_*i*a,n[2]=e*i*a+_*u*t,n[3]=e*i*t-_*u*a;break;case"xzy":n[0]=_*i*t-e*u*a,n[1]=e*u*t-_*i*a,n[2]=e*i*a+_*u*t,n[3]=e*i*t+_*u*a;break;case"yxz":n[0]=_*i*t+e*u*a,n[1]=e*u*t-_*i*a,n[2]=e*i*a-_*u*t,n[3]=e*i*t+_*u*a;break;case"yzx":n[0]=_*i*t+e*u*a,n[1]=e*u*t+_*i*a,n[2]=e*i*a-_*u*t,n[3]=e*i*t-_*u*a;break;case"zxy":n[0]=_*i*t-e*u*a,n[1]=e*u*t+_*i*a,n[2]=e*i*a+_*u*t,n[3]=e*i*t-_*u*a;break;case"zyx":n[0]=_*i*t-e*u*a,n[1]=e*u*t+_*i*a,n[2]=e*i*a-_*u*t,n[3]=e*i*t+_*u*a;break;default:throw new Error(`Unknown rotation order: ${r}`)}return n}function be(b,D){const f=D??new p(4);return f[0]=b[0],f[1]=b[1],f[2]=b[2],f[3]=b[3],f}const se=be;function Oe(b,D,f){const r=f??new p(4);return r[0]=b[0]+D[0],r[1]=b[1]+D[1],r[2]=b[2]+D[2],r[3]=b[3]+D[3],r}function Ge(b,D,f){const r=f??new p(4);return r[0]=b[0]-D[0],r[1]=b[1]-D[1],r[2]=b[2]-D[2],r[3]=b[3]-D[3],r}const ye=Ge;function Ae(b,D,f){const r=f??new p(4);return r[0]=b[0]*D,r[1]=b[1]*D,r[2]=b[2]*D,r[3]=b[3]*D,r}const Ue=Ae;function De(b,D,f){const r=f??new p(4);return r[0]=b[0]/D,r[1]=b[1]/D,r[2]=b[2]/D,r[3]=b[3]/D,r}function ne(b,D){return b[0]*D[0]+b[1]*D[1]+b[2]*D[2]+b[3]*D[3]}function qe(b,D,f,r){const s=r??new p(4);return s[0]=b[0]+f*(D[0]-b[0]),s[1]=b[1]+f*(D[1]-b[1]),s[2]=b[2]+f*(D[2]-b[2]),s[3]=b[3]+f*(D[3]-b[3]),s}function me(b){const D=b[0],f=b[1],r=b[2],s=b[3];return Math.sqrt(D*D+f*f+r*r+s*s)}const Re=me;function ue(b){const D=b[0],f=b[1],r=b[2],s=b[3];return D*D+f*f+r*r+s*s}const H=ue;function W(b,D){const f=D??new p(4),r=b[0],s=b[1],n=b[2],d=b[3],m=Math.sqrt(r*r+s*s+n*n+d*d);return m>1e-5?(f[0]=r/m,f[1]=s/m,f[2]=n/m,f[3]=d/m):(f[0]=0,f[1]=0,f[2]=0,f[3]=1),f}function k(b,D){return Math.abs(b[0]-D[0])<Y&&Math.abs(b[1]-D[1])<Y&&Math.abs(b[2]-D[2])<Y&&Math.abs(b[3]-D[3])<Y}function ge(b,D){return b[0]===D[0]&&b[1]===D[1]&&b[2]===D[2]&&b[3]===D[3]}function Fe(b){const D=b??new p(4);return D[0]=0,D[1]=0,D[2]=0,D[3]=1,D}const J=G.create(),Ce=G.create(),Te=G.create();function Ie(b,D,f){const r=f??new p(4),s=G.dot(b,D);return s<-.999999?(G.cross(Ce,b,J),G.len(J)<1e-6&&G.cross(Te,b,J),G.normalize(J,J),w(J,Math.PI,r),r):s>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(G.cross(b,D,J),r[0]=J[0],r[1]=J[1],r[2]=J[2],r[3]=1+s,W(r,r))}const Pe=new p(4),Ee=new p(4);function Ve(b,D,f,r,s,n){const d=n??new p(4);return C(b,r,s,Pe),C(D,f,s,Ee),C(Pe,Ee,2*s*(1-s),d),d}return{create:B,fromValues:c,set:v,fromAxisAngle:w,toAxisAngle:U,angle:S,multiply:z,mul:V,rotateX:N,rotateY:X,rotateZ:F,slerp:C,inverse:$,conjugate:j,fromMat:ve,fromEuler:oe,copy:be,clone:se,add:Oe,subtract:Ge,sub:ye,mulScalar:Ae,scale:Ue,divScalar:De,dot:ne,lerp:qe,length:me,len:Re,lengthSq:ue,lenSq:H,normalize:W,equalsApproximately:k,equals:ge,identity:Fe,rotationTo:Ie,sqlerp:Ve}}const nr=new Map;function kr(p){let G=nr.get(p);return G||(G=Yr(p),nr.set(p,G)),G}function Xr(p){function G(f,r,s,n){const d=new p(4);return f!==void 0&&(d[0]=f,r!==void 0&&(d[1]=r,s!==void 0&&(d[2]=s,n!==void 0&&(d[3]=n)))),d}const B=G;function c(f,r,s,n,d){const m=d??new p(4);return m[0]=f,m[1]=r,m[2]=s,m[3]=n,m}function v(f,r){const s=r??new p(4);return s[0]=Math.ceil(f[0]),s[1]=Math.ceil(f[1]),s[2]=Math.ceil(f[2]),s[3]=Math.ceil(f[3]),s}function w(f,r){const s=r??new p(4);return s[0]=Math.floor(f[0]),s[1]=Math.floor(f[1]),s[2]=Math.floor(f[2]),s[3]=Math.floor(f[3]),s}function U(f,r){const s=r??new p(4);return s[0]=Math.round(f[0]),s[1]=Math.round(f[1]),s[2]=Math.round(f[2]),s[3]=Math.round(f[3]),s}function S(f,r=0,s=1,n){const d=n??new p(4);return d[0]=Math.min(s,Math.max(r,f[0])),d[1]=Math.min(s,Math.max(r,f[1])),d[2]=Math.min(s,Math.max(r,f[2])),d[3]=Math.min(s,Math.max(r,f[3])),d}function z(f,r,s){const n=s??new p(4);return n[0]=f[0]+r[0],n[1]=f[1]+r[1],n[2]=f[2]+r[2],n[3]=f[3]+r[3],n}function V(f,r,s,n){const d=n??new p(4);return d[0]=f[0]+r[0]*s,d[1]=f[1]+r[1]*s,d[2]=f[2]+r[2]*s,d[3]=f[3]+r[3]*s,d}function N(f,r,s){const n=s??new p(4);return n[0]=f[0]-r[0],n[1]=f[1]-r[1],n[2]=f[2]-r[2],n[3]=f[3]-r[3],n}const X=N;function F(f,r){return Math.abs(f[0]-r[0])<Y&&Math.abs(f[1]-r[1])<Y&&Math.abs(f[2]-r[2])<Y&&Math.abs(f[3]-r[3])<Y}function C(f,r){return f[0]===r[0]&&f[1]===r[1]&&f[2]===r[2]&&f[3]===r[3]}function $(f,r,s,n){const d=n??new p(4);return d[0]=f[0]+s*(r[0]-f[0]),d[1]=f[1]+s*(r[1]-f[1]),d[2]=f[2]+s*(r[2]-f[2]),d[3]=f[3]+s*(r[3]-f[3]),d}function j(f,r,s,n){const d=n??new p(4);return d[0]=f[0]+s[0]*(r[0]-f[0]),d[1]=f[1]+s[1]*(r[1]-f[1]),d[2]=f[2]+s[2]*(r[2]-f[2]),d[3]=f[3]+s[3]*(r[3]-f[3]),d}function ve(f,r,s){const n=s??new p(4);return n[0]=Math.max(f[0],r[0]),n[1]=Math.max(f[1],r[1]),n[2]=Math.max(f[2],r[2]),n[3]=Math.max(f[3],r[3]),n}function oe(f,r,s){const n=s??new p(4);return n[0]=Math.min(f[0],r[0]),n[1]=Math.min(f[1],r[1]),n[2]=Math.min(f[2],r[2]),n[3]=Math.min(f[3],r[3]),n}function be(f,r,s){const n=s??new p(4);return n[0]=f[0]*r,n[1]=f[1]*r,n[2]=f[2]*r,n[3]=f[3]*r,n}const se=be;function Oe(f,r,s){const n=s??new p(4);return n[0]=f[0]/r,n[1]=f[1]/r,n[2]=f[2]/r,n[3]=f[3]/r,n}function Ge(f,r){const s=r??new p(4);return s[0]=1/f[0],s[1]=1/f[1],s[2]=1/f[2],s[3]=1/f[3],s}const ye=Ge;function Ae(f,r){return f[0]*r[0]+f[1]*r[1]+f[2]*r[2]+f[3]*r[3]}function Ue(f){const r=f[0],s=f[1],n=f[2],d=f[3];return Math.sqrt(r*r+s*s+n*n+d*d)}const De=Ue;function ne(f){const r=f[0],s=f[1],n=f[2],d=f[3];return r*r+s*s+n*n+d*d}const qe=ne;function me(f,r){const s=f[0]-r[0],n=f[1]-r[1],d=f[2]-r[2],m=f[3]-r[3];return Math.sqrt(s*s+n*n+d*d+m*m)}const Re=me;function ue(f,r){const s=f[0]-r[0],n=f[1]-r[1],d=f[2]-r[2],m=f[3]-r[3];return s*s+n*n+d*d+m*m}const H=ue;function W(f,r){const s=r??new p(4),n=f[0],d=f[1],m=f[2],g=f[3],_=Math.sqrt(n*n+d*d+m*m+g*g);return _>1e-5?(s[0]=n/_,s[1]=d/_,s[2]=m/_,s[3]=g/_):(s[0]=0,s[1]=0,s[2]=0,s[3]=0),s}function k(f,r){const s=r??new p(4);return s[0]=-f[0],s[1]=-f[1],s[2]=-f[2],s[3]=-f[3],s}function ge(f,r){const s=r??new p(4);return s[0]=f[0],s[1]=f[1],s[2]=f[2],s[3]=f[3],s}const Fe=ge;function J(f,r,s){const n=s??new p(4);return n[0]=f[0]*r[0],n[1]=f[1]*r[1],n[2]=f[2]*r[2],n[3]=f[3]*r[3],n}const Ce=J;function Te(f,r,s){const n=s??new p(4);return n[0]=f[0]/r[0],n[1]=f[1]/r[1],n[2]=f[2]/r[2],n[3]=f[3]/r[3],n}const Ie=Te;function Pe(f){const r=f??new p(4);return r[0]=0,r[1]=0,r[2]=0,r[3]=0,r}function Ee(f,r,s){const n=s??new p(4),d=f[0],m=f[1],g=f[2],_=f[3];return n[0]=r[0]*d+r[4]*m+r[8]*g+r[12]*_,n[1]=r[1]*d+r[5]*m+r[9]*g+r[13]*_,n[2]=r[2]*d+r[6]*m+r[10]*g+r[14]*_,n[3]=r[3]*d+r[7]*m+r[11]*g+r[15]*_,n}function Ve(f,r,s){const n=s??new p(4);return W(f,n),be(n,r,n)}function b(f,r,s){const n=s??new p(4);return Ue(f)>r?Ve(f,r,n):ge(f,n)}function D(f,r,s){const n=s??new p(4);return $(f,r,.5,n)}return{create:G,fromValues:B,set:c,ceil:v,floor:w,round:U,clamp:S,add:z,addScaled:V,subtract:N,sub:X,equalsApproximately:F,equals:C,lerp:$,lerpV:j,max:ve,min:oe,mulScalar:be,scale:se,divScalar:Oe,inverse:Ge,invert:ye,dot:Ae,length:Ue,len:De,lengthSq:ne,lenSq:qe,distance:me,dist:Re,distanceSq:ue,distSq:H,normalize:W,negate:k,copy:ge,clone:Fe,multiply:J,mul:Ce,divide:Te,div:Ie,zero:Pe,transformMat4:Ee,setLength:Ve,truncate:b,midpoint:D}}const ar=new Map;function jr(p){let G=ar.get(p);return G||(G=Xr(p),ar.set(p,G)),G}function Ze(p,G,B,c,v,w){return{mat3:Ir(p),mat4:Lr(G),quat:kr(B),vec2:sr(c),vec3:We(v),vec4:jr(w)}}const{mat4:A,vec3:or}=Ze(Float32Array,Float32Array,Float32Array,Float32Array,Float32Array,Float32Array);Ze(Float64Array,Float64Array,Float64Array,Float64Array,Float64Array,Float64Array);Ze(qr,Array,Array,Array,Array,Array);class Hr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"shader",`

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
    `)}async init(){var N;const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,.5,0,1,1,.5,.5,0,1,0,-.5,-.5,1,0,0,.5,-.5,1,1,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,1,3];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]}]},fragment:{module:V,targets:[{format:U}]}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}]},v=B.beginRenderPass(c);let w=A.identity();A.rotateZ(w,new Date().getTime()/1e3,w),this._device.queue.writeBuffer(this._uniformBuffer,0,w),v.setPipeline(this._pipeline),v.setBindGroup(0,this._bindGroup),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32"),v.drawIndexed(6),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._context.unconfigure()}}class Wr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer1",null);x(this,"_uniformBuffer2",null);x(this,"_bindGroup1",null);x(this,"_bindGroup2",null);x(this,"_depthTexture",null);x(this,"shader",`

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
    `)}async init(){var N;const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,.5,0,1,1,.5,.5,0,1,0,-.5,-.5,1,0,0,.5,-.5,1,1,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,1,3];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer1=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._uniformBuffer2=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x3"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup1=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer1}}]}),this._bindGroup2=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer2}}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.translate(w,or.fromValues(0,0,.5),w),A.rotateZ(w,new Date().getTime()/1e3,w),this._device.queue.writeBuffer(this._uniformBuffer1,0,w),v.setBindGroup(0,this._bindGroup1),v.drawIndexed(6)}{let w=A.identity();A.translate(w,or.fromValues(.5,0,.2),w),A.rotateZ(w,new Date().getTime()/1e3,w),this._device.queue.writeBuffer(this._uniformBuffer2,0,w),v.setBindGroup(0,this._bindGroup2),v.drawIndexed(6)}v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer1.destroy(),this._uniformBuffer2.destroy(),this._depthTexture.destroy(),this._context.unconfigure()}}class Zr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"shader",`

        struct Vertex {
            @location(0) position: vec3f,
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
            vOut.position=transform.world *vec4f(v.position, 1.0);
            vOut.color=v.color;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return vec4f(v.color, 1.0);
        }
    `)}async init(){var N;const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,-.5,1,0,0,.5,-.5,-.5,0,1,0,.5,.5,-.5,0,0,1,-.5,.5,-.5,1,1,0,-.5,-.5,.5,1,0,1,.5,-.5,.5,0,1,1,.5,.5,.5,1,1,1,-.5,.5,.5,0,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,1,5,6,6,2,1,4,5,6,6,7,4,0,4,7,7,3,0,3,2,6,6,7,3,0,1,5,5,4,0];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.rotateY(w,new Date().getTime()/1e3,w);let U=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),S=A.perspective(Math.PI/3,1,.1,1e3),z=A.multiply(S,A.multiply(U,w));this._device.queue.writeBuffer(this._uniformBuffer,0,z),v.setBindGroup(0,this._bindGroup),v.drawIndexed(36)}v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._context.unconfigure()}}class $r extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"shader",`

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
    `)}async init(){var C;const B=await((C=navigator.gpu)==null?void 0:C.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.rotateY(w,new Date().getTime()/1e3,w);let U=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),S=A.perspective(Math.PI/3,1,.1,1e3),z=A.multiply(S,A.multiply(U,w));this._device.queue.writeBuffer(this._uniformBuffer,0,z),v.setBindGroup(0,this._bindGroup),v.setBindGroup(1,this._textureBindGroup),v.drawIndexed(36)}v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class Qr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_cubeCount",16);x(this,"_uniformBuffers",[]);x(this,"_bindGroups",[]);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_renderBundle",null);x(this,"shader",`

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
    `)}async init(){var $;const B=await(($=navigator.gpu)==null?void 0:$.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z));for(let j=0;j<this._cubeCount;j++)this._uniformBuffers.push(c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}});for(let j=0;j<this._cubeCount;j++)this._bindGroups.push(c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffers[j]}}]}));const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]});const C=this._device.createRenderBundleEncoder({colorFormats:["bgra8unorm"],depthStencilFormat:"depth24plus"});C.setPipeline(this._pipeline),C.setVertexBuffer(0,this._vertexBuffer),C.setIndexBuffer(this._indexBuffer,"uint32");for(let j=0;j<this._cubeCount;j++)C.setBindGroup(0,this._bindGroups[j]),C.setBindGroup(1,this._textureBindGroup),C.drawIndexed(36);this._renderBundle=C.finish()}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);this.updateMatrices(),v.executeBundles([this._renderBundle]),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}updateMatrices(){let B=A.lookAt([0,5,-10],[0,0,0],[0,1,0]),c=A.perspective(Math.PI/3,1,.1,1e3),v=[0,0],w=Math.sqrt(this._cubeCount);for(let U=0;U<this._cubeCount;U++){let S=A.identity();A.translate(S,[v[0]*2-w+1,v[1]*2-w+1,0],S),A.rotateY(S,new Date().getTime()/1e3,S);let z=A.multiply(c,A.multiply(B,S));this._device.queue.writeBuffer(this._uniformBuffers[U],0,z),v[0]++,v[0]>=w&&(v[1]++,v[0]=0)}}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffers.forEach(B=>B.destroy()),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class Jr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_instanceBuffer",null);x(this,"_indexBuffer",null);x(this,"_cubeCount",16);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"shader",`

        struct Vertex {
            @location(0) position: vec3f,
            @location(1) texcoord: vec2f,
            @location(2) instanceData: vec4f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f ,
            @location(0) texcoord: vec2f,
            @location(1) color:vec3f
        };

        struct Transform
        {
            world:array<mat4x4f, 16>
        }

        @group(0) @binding(0) var<uniform> transform: Transform;

        @group(1) @binding(0) var textureSampler: sampler;
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;

        @vertex fn vs(v:Vertex) -> VertexOut 
        {
            var vOut:VertexOut;
            vOut.position=transform.world[i32(v.instanceData.x)] *vec4f(v.position, 1.0);
            vOut.texcoord=v.texcoord;
            vOut.color=v.instanceData.yzw;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return  textureSample(diffuseTexture, textureSampler, v.texcoord)* vec4f(v.color,1);
        }
    `)}async init(){var $;const B=await(($=navigator.gpu)==null?void 0:$.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,1,1,1,1,0,0,2,0,1,0,3,0,0,1,4,1,0,1,5,0,1,1,6,1,1,0,7,1,1,1,8,1,.5,.5,9,.5,.5,1,10,.5,1,.5,11,.5,1,1,12,1,.5,1,13,1,1,.5,14,.5,.5,.5,15,.1,.1,.1];this._instanceBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._instanceBuffer,0,new Float32Array(z));const V=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:V.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(V)),this._uniformBuffer=c.createBuffer({size:64*this._cubeCount,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const N=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:N,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]},{arrayStride:16,stepMode:"instance",attributes:[{shaderLocation:2,offset:0,format:"float32x4"}]}]},fragment:{module:N,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const F=await(await fetch("../logo_njc.png")).blob(),C=await createImageBitmap(F,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[C.width,C.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:C,flipY:!1},{texture:this._texture},{width:C.width,height:C.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);this.updateMatrices(),v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setVertexBuffer(1,this._instanceBuffer),v.setIndexBuffer(this._indexBuffer,"uint32"),v.setBindGroup(0,this._bindGroup),v.setBindGroup(1,this._textureBindGroup),v.drawIndexed(36,16),v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}updateMatrices(){let B=A.lookAt([0,5,-10],[0,0,0],[0,1,0]),c=A.perspective(Math.PI/3,1,.1,1e3),v=[0,0],w=Math.sqrt(this._cubeCount);for(let U=0;U<this._cubeCount;U++){let S=A.identity();A.translate(S,[v[0]*2-w+1,v[1]*2-w+1,0],S),A.rotateY(S,new Date().getTime()/1e3,S);let z=A.multiply(c,A.multiply(B,S));this._device.queue.writeBuffer(this._uniformBuffer,64*U,z),v[0]++,v[0]>=w&&(v[1]++,v[0]=0)}}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._instanceBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class Kr extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipelineMultiSample",null);x(this,"_pipelineNoSample",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTextureMultiSample",null);x(this,"_depthTextureNoSample",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"multisampleTexture",null);x(this,"sampleCount",4);x(this,"multipleSampleOn",!0);x(this,"shader",`

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
            _=textureSample(diffuseTexture, textureSampler, v.texcoord);
            return vec4f(1,1,1,1) ;
        }
    `)}async init(){var C;const B=await((C=navigator.gpu)==null?void 0:C.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}document.querySelector("p").innerText=this.multipleSampleOn?"MSAA Attivo":"MSAA Non Attivo",v.onclick=()=>{this.multipleSampleOn=!this.multipleSampleOn,document.querySelector("p").innerHTML=this.multipleSampleOn?"MSAA Attivo":"MSAA Non Attivo"};const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTextureMultiSample=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT,sampleCount:this.sampleCount}),this._depthTextureNoSample=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.multisampleTexture=this._device.createTexture({format:"bgra8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT,size:[v.width,v.height],sampleCount:this.sampleCount});const V=c.createShaderModule({code:this.shader});this._pipelineMultiSample=c.createRenderPipeline({layout:this._device.createPipelineLayout({bindGroupLayouts:[this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{}}]})]}),vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"},multisample:{count:this.sampleCount}}),this._pipelineNoSample=c.createRenderPipeline({layout:this._device.createPipelineLayout({bindGroupLayouts:[this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{}}]})]}),vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,texture:{}}]}),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]})}draw(){const B=this._device.createCommandEncoder();let c;if(this.multipleSampleOn){const v={colorAttachments:[{view:this.multisampleTexture.createView(),resolveTarget:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTextureMultiSample.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};c=B.beginRenderPass(v),c.setPipeline(this._pipelineMultiSample)}else{const v={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTextureNoSample.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};c=B.beginRenderPass(v),c.setPipeline(this._pipelineNoSample)}c.setVertexBuffer(0,this._vertexBuffer),c.setIndexBuffer(this._indexBuffer,"uint32");{let v=A.identity();A.rotateY(v,new Date().getTime()/1e3,v);let w=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),U=A.perspective(Math.PI/3,1,.1,1e3),S=A.multiply(U,A.multiply(w,v));this._device.queue.writeBuffer(this._uniformBuffer,0,S),c.setBindGroup(0,this._bindGroup),c.setBindGroup(1,this._textureBindGroup),c.drawIndexed(36)}c.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}destroy(){cancelAnimationFrame(this.frameId),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTextureMultiSample.destroy(),this._depthTextureNoSample.destroy(),this._device.destroy()}}class et extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_renderTarget2",null);x(this,"_depthTexture2",null);x(this,"_textureBindGroup2",null);x(this,"shader",`

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
    `)}async init(){var C;const B=await((C=navigator.gpu)==null?void 0:C.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]}),this._renderTarget2=c.createTexture({size:[512,512],format:"bgra8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this._depthTexture2=c.createTexture({size:[512,512],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),this._textureBindGroup2=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._renderTarget2.createView()}]})}draw(){const B=this._device.createCommandEncoder();{const c={colorAttachments:[{view:this._renderTarget2.createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture2.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.rotateY(w,new Date().getTime()/1e3,w);let U=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),S=A.perspective(Math.PI/3,1,.1,1e3),z=A.multiply(S,A.multiply(U,w));this._device.queue.writeBuffer(this._uniformBuffer,0,z),v.setBindGroup(0,this._bindGroup),v.setBindGroup(1,this._textureBindGroup),v.drawIndexed(36)}v.end()}{const c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32"),v.setBindGroup(0,this._bindGroup),v.setBindGroup(1,this._textureBindGroup2),v.drawIndexed(36),v.end()}this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}destroy(){cancelAnimationFrame(this.frameId),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._device.destroy()}}class rt extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_video",null);x(this,"shader",`

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
        @group(1) @binding(1) var diffuseTexture: texture_external;

        @vertex fn vs(v:Vertex) -> VertexOut 
        {
            var vOut:VertexOut;
            vOut.position=transform.world *vec4f(v.position, 1.0);
            vOut.texcoord=v.texcoord;
            return vOut;
        }
 
        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return  textureSampleBaseClampToEdge(diffuseTexture, textureSampler, v.texcoord);
        }
    `)}async init(){var N;this._video=document.createElement("video"),this._video.src="./earth.mp4",this._video.autoplay=!0,this._video.loop=!0,this._video.play();const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"})}draw(){if(this._video.readyState<HTMLMediaElement.HAVE_CURRENT_DATA){requestAnimationFrame(()=>this.draw());return}const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,1,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.rotateY(w,0,w);let U=A.lookAt([1,1,-1],[0,0,0],[0,1,0]),S=A.perspective(Math.PI/3,1,.1,1e3),z=A.multiply(S,A.multiply(U,w));this._device.queue.writeBuffer(this._uniformBuffer,0,z),v.setBindGroup(0,this._bindGroup);const V=this._device.importExternalTexture({source:this._video});this._textureBindGroup=this._device.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:V}]}),v.setBindGroup(1,this._textureBindGroup),v.drawIndexed(36)}v.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}destroy(){cancelAnimationFrame(this.frameId),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._context.unconfigure()}}class tt extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_bindGroup",null);x(this,"_inputBuffer",null);x(this,"_outputBuffer",null);x(this,"_readBuffer",null);x(this,"size",1024);x(this,"jsTime",0);x(this,"webGpuTime",0);x(this,"shader",`
      
        @group(0) @binding(0) var<storage,read> inputBuffer:array<f32>;
        @group(0) @binding(1) var<storage,read_write> resultBuffer:array<f32>;

        @compute @workgroup_size(16,16) 
        fn main(
            @builtin(global_invocation_id) global_id : vec3<u32>) 
        {

            let width:u32=${this.size}u;

            let index:u32=global_id.y*width+global_id.x;

            let x = inputBuffer[index];

            //esecuzione della formula di taylor per sin(x)
            var result = 0f;
            var sign = -1f;
            for (var i = 1f; i < 30; i+=2) {
                var fact = 1f;
                var n = i;

                while (n > 1) {
                    fact *= n;
                    n=n-1;
                }
                sign *= -1;

                result += (pow(x, i) / fact) * sign;
            }

            resultBuffer[index]=result;
            
            
        }
 
    `)}async init(){var C;const B=await((C=navigator.gpu)==null?void 0:C.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=this._device.createShaderModule({code:this.shader});this._pipeline=this._device.createComputePipeline({layout:"auto",compute:{module:S}}),this._inputBuffer=this._device.createBuffer({size:this.size*this.size*4,usage:GPUBufferUsage.STORAGE,mappedAtCreation:!0});const z=[];for(let $=0;$<this.size;$++)z.push(Math.floor(Math.random()*10));new Float32Array(this._inputBuffer.getMappedRange()).set(z),this._inputBuffer.unmap(),this._outputBuffer=this._device.createBuffer({size:this.size*this.size*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this._readBuffer=this._device.createBuffer({size:this.size*this.size*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._inputBuffer}},{binding:1,resource:{buffer:this._outputBuffer}}]}),this.jsTime=performance.now();const V=[];for(var N=0;N<this.size*this.size;N++){var X=z[N],F=0;let $=-1;for(let j=1;j<30;j+=2){let ve=1,oe=j;for(;oe>1;)ve*=oe,oe--;$*=-1,F+=Math.pow(X,j)/ve*$}V.push(F)}this.jsTime=performance.now()-this.jsTime,document.querySelector("p").innerHTML=`
        <p>Tempo di Esecuzione da Javascript ${this.jsTime.toFixed(2)} ms</p>
        <p>Risultato prima funzione: ${V[0].toFixed(2)} </p>`,await this.runCompute(this.size)}draw(){}async runCompute(B){this.webGpuTime=performance.now();const c=this._device.createCommandEncoder(),v=c.beginComputePass();v.setPipeline(this._pipeline),v.setBindGroup(0,this._bindGroup),v.dispatchWorkgroups(B/16,B/16,1),v.end(),c.copyBufferToBuffer(this._outputBuffer,0,this._readBuffer,0,this._outputBuffer.size),this._device.queue.submit([c.finish()]);let w=0;await this._readBuffer.mapAsync(GPUMapMode.READ);var U=new Float32Array(this._readBuffer.getMappedRange());w=U[0],this._readBuffer.unmap(),this.webGpuTime=performance.now()-this.webGpuTime,document.querySelector("p").innerHTML+=`
          <p>Tempo di Esecuzione da WebGPU ${this.webGpuTime.toFixed(2)} ms</p>
          <p>Risultato prima funzione: ${w.toFixed(2)} </p>
          <p>La GPU è più veloce di ${(this.jsTime/this.webGpuTime).toFixed(2)} volte</p>
          `}destroy(){this._inputBuffer.destroy(),this._outputBuffer.destroy(),this._readBuffer.destroy(),this._context.unconfigure()}}class it extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_sobelBindGroup",null);x(this,"showSobel",!0);x(this,"_computePipeline",null);x(this,"_computeBindGroup",null);x(this,"shader",`

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
    `);x(this,"computeShaderCode",`
    
    
    @group(0) @binding(0) var inputTex: texture_2d<f32>;
    @group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;

    const Gx : array<array<f32, 3>, 3> = array(
        array(-1.0,  0.0,  1.0),
        array(-2.0,  0.0,  2.0),
        array(-1.0,  0.0,  1.0)
    );

    const Gy : array<array<f32, 3>, 3> = array(
        array(-1.0, -2.0, -1.0),
        array( 0.0,  0.0,  0.0),
        array( 1.0,  2.0,  1.0)
    );

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id : vec3<u32>) {
        let texCoord = vec2<i32>(id.xy);
        var gx = vec3<f32>(0.0);
        var gy = vec3<f32>(0.0);
        
        for (var i: i32 = -1; i <= 1; i++) {
            for (var j: i32 = -1; j <= 1; j++) {
                let offset = texCoord + vec2<i32>(i, j);
                let sample = textureLoad(inputTex, offset, 0).rgb;
                gx += sample * Gx[i + 1][j + 1];
                gy += sample * Gy[i + 1][j + 1];
            }
        }

        let edgeStrength = length(gx) + length(gy);
        let finalColor = vec4<f32>(vec3(edgeStrength), 1.0);
        textureStore(outputTex, texCoord, finalColor);
    }
`)}async init(){var j;const B=await((j=navigator.gpu)==null?void 0:j.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"});const C=c.createTexture({size:{width:this._texture.width,height:this._texture.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC});this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]}),this._sobelBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:C.createView()}]});const $=c.createShaderModule({code:this.computeShaderCode});this._computePipeline=c.createComputePipeline({layout:"auto",compute:{module:$}}),this._computeBindGroup=c.createBindGroup({layout:this._computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this._texture.createView()},{binding:1,resource:C.createView()}]}),v.onclick=()=>this.showSobel=!this.showSobel}draw(){const B=this._device.createCommandEncoder(),c=B.beginComputePass();c.setBindGroup(0,this._computeBindGroup),c.setPipeline(this._computePipeline),c.dispatchWorkgroups(64,64,1),c.end();const v={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},w=B.beginRenderPass(v);w.setPipeline(this._pipeline),w.setVertexBuffer(0,this._vertexBuffer),w.setIndexBuffer(this._indexBuffer,"uint32");{let U=A.identity();A.rotateY(U,new Date().getTime()/1e3,U);let S=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),z=A.perspective(Math.PI/3,1,.1,1e3),V=A.multiply(z,A.multiply(S,U));this._device.queue.writeBuffer(this._uniformBuffer,0,V),w.setBindGroup(0,this._bindGroup),this.showSobel?w.setBindGroup(1,this._sobelBindGroup):w.setBindGroup(1,this._textureBindGroup),w.drawIndexed(36)}w.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}destroy(){cancelAnimationFrame(this.frameId),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class nt extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_pipelineMask",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_uniformMaskBuffer",null);x(this,"_bindGroup",null);x(this,"_bindMaskGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"shader",`

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
    `);x(this,"shaderMask",`


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
    `)}async init(){var $;const B=await(($=navigator.gpu)==null?void 0:$.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._uniformMaskBuffer=c.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus-stencil8",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus-stencil8",stencilFront:{compare:"equal",passOp:"keep",failOp:"keep"},stencilBack:{compare:"always",passOp:"keep",failOp:"keep"}}});const N=c.createShaderModule({code:this.shaderMask});this._pipelineMask=c.createRenderPipeline({layout:"auto",vertex:{module:N},fragment:{module:N,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus-stencil8",stencilFront:{compare:"never",failOp:"replace",depthFailOp:"keep"}}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]}),this._bindMaskGroup=c.createBindGroup({layout:this._pipelineMask.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformMaskBuffer}}]});const F=await(await fetch("../logo_njc.png")).blob(),C=await createImageBitmap(F,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[C.width,C.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:C,flipY:!1},{texture:this._texture},{width:C.width,height:C.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store",stencilStoreOp:"store",stencilLoadOp:"clear"}};let v=Math.sin(new Date().getTime()/1e3)+1;this._device.queue.writeBuffer(this._uniformMaskBuffer,0,new Float32Array([this._depthTexture.width,this._depthTexture.height,v*150,0]));const w=B.beginRenderPass(c);w.setStencilReference(1),w.setPipeline(this._pipelineMask),w.setBindGroup(0,this._bindMaskGroup),w.draw(6),w.end();const U={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store",stencilStoreOp:"discard",stencilLoadOp:"load"}},S=B.beginRenderPass(U);S.setStencilReference(1),S.setPipeline(this._pipeline),S.setVertexBuffer(0,this._vertexBuffer),S.setIndexBuffer(this._indexBuffer,"uint32");{let z=A.identity();A.rotateY(z,new Date().getTime()/1e3,z);let V=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),N=A.perspective(Math.PI/3,1,.1,1e3),X=A.multiply(N,A.multiply(V,z));this._device.queue.writeBuffer(this._uniformBuffer,0,X),S.setBindGroup(0,this._bindGroup),S.setBindGroup(1,this._textureBindGroup),S.drawIndexed(36)}S.end(),this._device.queue.submit([B.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._uniformMaskBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class at extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_querySet",null);x(this,"_queryBuffer",null);x(this,"_resultBuffer",null);x(this,"shader",`

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
    `);x(this,"lastTick",performance.now());x(this,"average",0);x(this,"count",0);x(this,"increase",0)}async init(){var C;const B=await((C=navigator.gpu)==null?void 0:C.requestAdapter()),c=await(B==null?void 0:B.requestDevice({requiredFeatures:["timestamp-query"]}));if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]});const X=await(await fetch("../logo_njc.png")).blob(),F=await createImageBitmap(X,{colorSpaceConversion:"none"});this._texture=this._device.createTexture({format:"rgba8unorm",size:[F.width,F.height,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._device.queue.copyExternalImageToTexture({source:F,flipY:!1},{texture:this._texture},{width:F.width,height:F.height}),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]}),this._querySet=c.createQuerySet({type:"timestamp",count:2}),this._queryBuffer=this._device.createBuffer({size:2*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),this._resultBuffer=c.createBuffer({size:this._queryBuffer.size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})}draw(){const B=this._device.createCommandEncoder(),c={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"},timestampWrites:{querySet:this._querySet,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}},v=B.beginRenderPass(c);v.setPipeline(this._pipeline),v.setVertexBuffer(0,this._vertexBuffer),v.setIndexBuffer(this._indexBuffer,"uint32");{let w=A.identity();A.rotateY(w,new Date().getTime()/1e3,w);let U=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),S=A.perspective(Math.PI/3,1,.1,1e3),z=A.multiply(S,A.multiply(U,w));this._device.queue.writeBuffer(this._uniformBuffer,0,z),v.setBindGroup(0,this._bindGroup),v.setBindGroup(1,this._textureBindGroup),v.drawIndexed(36)}v.end(),B.resolveQuerySet(this._querySet,0,this._querySet.count,this._queryBuffer,0),this._resultBuffer.mapState=="unmapped"&&B.copyBufferToBuffer(this._queryBuffer,0,this._resultBuffer,0,this._resultBuffer.size),this._device.queue.submit([B.finish()]),this._resultBuffer.mapState=="unmapped"&&this._resultBuffer.mapAsync(GPUMapMode.READ,0,this._resultBuffer.size).then(()=>{const w=new BigUint64Array(this._resultBuffer.getMappedRange(0,this._resultBuffer.size)),U=Number(w[1]-w[0]);this.increase+=U,this.count++,performance.now()-this.lastTick>=1e3&&(this.average=this.increase/this.count,this.count=0,this.increase=0,this.lastTick=performance.now()),document.querySelector("p").innerHTML="Tempo di Rendering: "+Math.ceil(this.average/1e3)+" Microsecondi",this._resultBuffer.unmap()}),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}class ot extends ie{constructor(){super(...arguments);x(this,"_device",null);x(this,"_context",null);x(this,"_pipeline",null);x(this,"_vertexBuffer",null);x(this,"_indexBuffer",null);x(this,"_uniformBuffer",null);x(this,"_bindGroup",null);x(this,"_depthTexture",null);x(this,"_texture",null);x(this,"_sampler",null);x(this,"_textureBindGroup",null);x(this,"_context2D",null);x(this,"_offlineCanvas",null);x(this,"shader",`

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
    `)}async init(){var N;const B=await((N=navigator.gpu)==null?void 0:N.requestAdapter()),c=await(B==null?void 0:B.requestDevice());if(!c){alert("browser o dispositivo non compatibile");return}this._device=c;const v=document.querySelector("canvas");if(!v){alert("canvas non presente nella pagina");return}const w=v.getContext("webgpu");if(!w){alert("browser o dispositivo non compatibile");return}this._context=w;const U=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:U});const S=[-.5,-.5,.5,0,1,.5,-.5,.5,1,1,.5,.5,.5,1,0,-.5,.5,.5,0,0,-.5,-.5,-.5,1,1,-.5,.5,-.5,1,0,.5,.5,-.5,0,0,.5,-.5,-.5,0,1,-.5,.5,-.5,0,1,-.5,.5,.5,0,0,.5,.5,.5,1,0,.5,.5,-.5,1,1,-.5,-.5,-.5,1,1,.5,-.5,-.5,0,1,.5,-.5,.5,0,0,-.5,-.5,.5,1,0,.5,-.5,-.5,1,1,.5,.5,-.5,1,0,.5,.5,.5,0,0,.5,-.5,.5,0,1,-.5,-.5,-.5,0,1,-.5,-.5,.5,1,1,-.5,.5,.5,1,0,-.5,.5,-.5,0,0];this._vertexBuffer=c.createBuffer({size:S.length*4,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._vertexBuffer,0,new Float32Array(S));const z=[0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];this._indexBuffer=c.createBuffer({size:z.length*4,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),c.queue.writeBuffer(this._indexBuffer,0,new Uint32Array(z)),this._uniformBuffer=c.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this._depthTexture=c.createTexture({size:[v.width,v.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});const V=c.createShaderModule({code:this.shader});this._pipeline=c.createRenderPipeline({layout:"auto",vertex:{module:V,buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:V,targets:[{format:U}]},depthStencil:{depthWriteEnabled:!0,depthCompare:"less",format:"depth24plus"}}),this._bindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this._uniformBuffer}}]}),this._texture=this._device.createTexture({format:"rgba8unorm",size:[256,256,1],usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),this._offlineCanvas=document.createElement("canvas"),this._offlineCanvas.width=this._texture.width,this._offlineCanvas.height=this._texture.height,this._context2D=this._offlineCanvas.getContext("2d"),this._sampler=this._device.createSampler({minFilter:"linear",magFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),this._textureBindGroup=c.createBindGroup({layout:this._pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:this._sampler},{binding:1,resource:this._texture.createView()}]})}draw(){this._context2D.fillStyle="#0000FF",this._context2D.fillRect(0,0,this._offlineCanvas.width,this._offlineCanvas.height),this._context2D.font="32px Arial",this._context2D.fillStyle="white";const B=new Date;this._context2D.fillText("Time",32,64),this._context2D.fillText(`${B.getDate().toString().padStart(2,"0")}:${(B.getMonth()+1).toString().padStart(2,"0")}:${B.getFullYear().toString().padStart(2,"0")}`,32,96),this._context2D.fillText(`${B.getHours().toString().padStart(2,"0")}:${B.getMinutes().toString().padStart(2,"0")}:${B.getSeconds().toString().padStart(2,"0")}`,32,128);const c=this._device.createCommandEncoder();createImageBitmap(this._offlineCanvas).then(U=>{this._device.queue.copyExternalImageToTexture({source:U},{texture:this._texture},[this._offlineCanvas.width,this._offlineCanvas.height])});const v={colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}},w=c.beginRenderPass(v);w.setPipeline(this._pipeline),w.setVertexBuffer(0,this._vertexBuffer),w.setIndexBuffer(this._indexBuffer,"uint32");{let U=A.identity();A.rotateY(U,new Date().getTime()/2e3,U);let S=A.lookAt([0,1,-2],[0,0,0],[0,1,0]),z=A.perspective(Math.PI/3,1,.1,1e3),V=A.multiply(z,A.multiply(S,U));this._device.queue.writeBuffer(this._uniformBuffer,0,V),w.setBindGroup(0,this._bindGroup),w.setBindGroup(1,this._textureBindGroup),w.drawIndexed(36)}w.end(),this._device.queue.submit([c.finish()]),this.frameId=requestAnimationFrame(()=>this.draw())}async destroy(){cancelAnimationFrame(this.frameId),await this._device.queue.onSubmittedWorkDone(),this._vertexBuffer.destroy(),this._indexBuffer.destroy(),this._uniformBuffer.destroy(),this._depthTexture.destroy(),this._texture.destroy(),this._context.unconfigure()}}let K=null;const ur=document.querySelectorAll("ol li a"),st=Object.assign({"./tutorials/tutorial00.ts":lr,"./tutorials/tutorial01.ts":fr,"./tutorials/tutorial02.ts":pr,"./tutorials/tutorial03.ts":hr,"./tutorials/tutorial04.ts":vr,"./tutorials/tutorial05.ts":mr,"./tutorials/tutorial06.ts":gr,"./tutorials/tutorial07.ts":xr,"./tutorials/tutorial08.ts":_r,"./tutorials/tutorial09.ts":Br,"./tutorials/tutorial10.ts":wr,"./tutorials/tutorial11.ts":br,"./tutorials/tutorial12.ts":Tr,"./tutorials/tutorial13.ts":Pr,"./tutorials/tutorial14.ts":Gr,"./tutorials/tutorial15.ts":yr,"./tutorials/tutorial16.ts":Ur,"./tutorials/tutorial17.ts":Dr,"./tutorials/tutorial18.ts":Sr});ur.forEach(p=>{p.addEventListener("click",async G=>{G.preventDefault(),document.querySelector("h7").innerHTML=p.title,document.querySelector("p").innerHTML="",document.querySelector("canvas").onclick=()=>{};let B=p.getAttribute("data-tutorial");switch(K&&await K.destroy(),B){case"00":K=new zr;break;case"01":K=new Mr;break;case"02":K=new Or;break;case"03":K=new Ar;break;case"04":K=new Er;break;case"05":K=new Hr;break;case"06":K=new Wr;break;case"07":K=new Zr;break;case"08":K=new $r;break;case"09":K=new Qr;break;case"10":K=new Jr;break;case"11":K=new Kr;break;case"12":K=new et;break;case"13":K=new rt;break;case"14":K=new tt;break;case"15":K=new it;break;case"16":K=new nt;break;case"17":K=new at;break;case"18":K=new ot;break}document.querySelector("#codetxt").value=st["./tutorials/tutorial"+B+".ts"],K.init().then(()=>K.draw())})});ur[8].click();
