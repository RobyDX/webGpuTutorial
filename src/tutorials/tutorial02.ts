/**
 * Shaders
 * 
 * Rendering di un triangolo tramite Shader
 */
import { baseRendering } from "../utility/baseRendering";

export class Tutorial02 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //lo shader renderizza un triangolo rosso
    //i vertici del triangolo sono contenuti nello shader
    private shader: string = `
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

        //crea lo shader
        const module = this._device.createShaderModule({ code: this.shader });

        //crea la pipeline
        this._pipeline = this._device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module,
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

        //renderizza 3 vertici
        pass.draw(3);

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

        this._context.unconfigure();
    }
}