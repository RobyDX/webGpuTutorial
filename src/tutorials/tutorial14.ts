/**
 * Compute Shader
 * 
 * Utilizzo della scheda video per l'esecuzione di calcoli
 */

import { baseRendering } from "../utility/baseRendering";

export class Tutorial14 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //compute pipeline
    private _pipeline: GPUComputePipeline = null!;

    private _bindGroup: GPUBindGroup = null!;

    //buffer di input
    private _inputBuffer: GPUBuffer = null!;

    //buffer di output
    private _outputBuffer: GPUBuffer = null!;

    //buffer per il mapping
    private _readBuffer: GPUBuffer = null!;

    //dimensione del buffer
    private size: number = 1024;

    private jsTime: number = 0;
    private webGpuTime: number = 0;

    //lo shader esegue un compute per la risoluzione di un'equazione di secondo grado
    private shader: string = `
      
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

        //crea il compute shader
        const module = this._device.createShaderModule({ code: this.shader });

        //crea la pipeline per il compute shader
        this._pipeline = this._device.createComputePipeline({
            layout: 'auto',
            compute: { module: module }
        });



        //buffer con valori da 0 a 9 per simulare l'input della formula di taylor
        this._inputBuffer = this._device.createBuffer({
            size: this.size * this.size * 4,
            usage: GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });

        //crea una serie di valori per la risoluzione della formula
        const factors: number[] = [];
        for (let index = 0; index < this.size; index++) {
            factors.push(Math.floor(Math.random() * 10));
        }

        //carico sul buffer
        new Float32Array(this._inputBuffer.getMappedRange()).set(factors);
        this._inputBuffer.unmap();


        //output buffer contenente i risultati
        this._outputBuffer = this._device.createBuffer({
            size: this.size * this.size * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        //buffer per leggere il risultato
        this._readBuffer = this._device.createBuffer({
            size: this.size * this.size * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });

        //binding
        this._bindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._inputBuffer } },
                { binding: 1, resource: { buffer: this._outputBuffer } },
            ],
        });

        //test javascript

        this.jsTime = performance.now();

        const resultTest: number[] = [];

        for (var w = 0; w < this.size * this.size; w++) {

            var x = factors[w];
            //esecuzione della formula di taylor per sin(x)

            var result = 0;
            let sign = -1;
            for (let index = 1; index < 30; index += 2) {
                let fact = 1;
                let n = index;

                while (n > 1) {
                    fact *= n;
                    n--;
                }
                sign *= -1;

                result += (Math.pow(x, index) / fact) * sign;
            }

            resultTest.push(result);
        }

        this.jsTime = performance.now() - this.jsTime;

        document.querySelector("p")!.innerHTML =
            `
        <p>Tempo di Esecuzione da Javascript ${this.jsTime.toFixed(2)} ms</p>
        <p>Risultato prima funzione: ${resultTest[0].toFixed(2)} </p>`;

        await this.runCompute(this.size);
    }

    draw() {

    }

    async runCompute(size: number) {
        // si crea un command encoder che eseguirà le operazioni

        this.webGpuTime = performance.now();

        const encoder = this._device.createCommandEncoder();


        // si inizia un compute pass
        const pass = encoder.beginComputePass();

        //imposta la pipeline da eseguire
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._bindGroup);

        //esegue il compute shader eseguendo un numero di workgroup per ogni lato
        pass.dispatchWorkgroups(size / 16, size / 16, 1);

        //termine del compute pass
        pass.end();

        //copia l'output buffer su un buffer di lettura
        //gli storage buffer non possono essere letti direttamente
        encoder.copyBufferToBuffer(this._outputBuffer, 0, this._readBuffer, 0, this._outputBuffer.size);

        //submit dell'encoder, viene effettivamente lanciata la sequenza dei comandi registrati
        this._device.queue.submit([encoder.finish()]);


        //legge i risultati
        let x1: number = 0;
        await this._readBuffer.mapAsync(GPUMapMode.READ);
        var data = new Float32Array(this._readBuffer.getMappedRange());
        x1 = data[0];
        this._readBuffer.unmap();

        //calcola il tempo di esecuzione
        this.webGpuTime = (performance.now() - this.webGpuTime);


        document.querySelector("p")!.innerHTML +=
            `
          <p>Tempo di Esecuzione da WebGPU ${(this.webGpuTime).toFixed(2)} ms</p>
          <p>Risultato prima funzione: ${x1.toFixed(2)} </p>
          <p>La GPU è più veloce di ${(this.jsTime / this.webGpuTime).toFixed(2)} volte</p>
          `;

    }

    destroy(): void {
        //elimina immediatamente tutte le risorse per non lasciarle in memoria

        this._inputBuffer.destroy();
        this._outputBuffer.destroy();
        this._readBuffer.destroy();

        this._context.unconfigure();

    }
}