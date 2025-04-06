import { baseRendering } from "../utility/baseRendering";

/**
 * Render target
 * 
 * Rendering di una canvas con pulizia dello schermo
 */
export class Tutorial01 extends baseRendering {

    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //set di colori (valori da 0 ad 1 per componenti RGB)
    private color: number[][] = [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [1, 1, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0]];
    private numColor: number = 0;

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


        //evento per modificare il colore
        canvas.onclick = () => {
            this.numColor++;
            if (this.numColor > 6)
                this.numColor = 0;
        };
    }

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        //definisce le caratteristiche del render pass
        //view: dove andrà eseguito il rendering, in questo caso sulla view associata alla canvas
        //clearValue: valore con cui si effettuerà la pulizia della vista (il colore di sfondo)
        //loadOp: operazione da fare all'avvio (clear indica che verrà pulita)
        //storeOp: operazione da fare sulla view (store indica che le informazioni verranno scritte sulla view) 
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: this.color[this.numColor],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        // si inizia un render pass, una sequenza di operazioni
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        //termine del render pass, l'unica operazione è stata la pulizia della view
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