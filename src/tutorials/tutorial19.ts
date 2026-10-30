/**
 * Mipmap
 *
 * Quando una texture viene vista da lontano o di taglio, un singolo pixel dello schermo copre
 * molti texel della texture: senza precauzioni l'immagine "sfarfalla" (aliasing).
 * Le mipmap sono versioni della texture ridotte ogni volta a metà (512, 256, 128 ... 1 pixel):
 * la GPU sceglie automaticamente la dimensione più adatta alla distanza.
 *
 * Clicca sulla canvas per attivare/disattivare le mipmap e confrontare il risultato.
 *
 * NOTA: dal tutorial 03 l'inizializzazione di WebGPU è nella funzione initWebGpu() di utility/webgpuInit.ts
 */

import { baseRendering } from "../utility/baseRendering";
import { initWebGpu, createShader } from "../utility/webgpuInit";
import { Mat4, mat4 } from 'wgpu-matrix'
import { createPlane, createGpuMesh, GpuMesh, vertexBufferLayout } from "../utility/geometry";

export class Tutorial19 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline della scena
    private _pipeline: GPURenderPipeline = null!;

    //piano caricato sulla GPU
    private _mesh: GpuMesh = null!;

    //buffer che contiene i dati che vengono passati allo shader
    private _uniformBuffer: GPUBuffer = null!;

    //binding group del buffer
    private _bindGroup: GPUBindGroup = null!;

    //texture con tutti i suoi livelli di mipmap
    private _texture: GPUTexture = null!;

    //un sampler che usa le mipmap e uno che usa sempre e solo il livello 0 (la texture originale)
    private _samplerMipmap: GPUSampler = null!;
    private _samplerNoMipmap: GPUSampler = null!;

    //binding group con texture e sampler, uno per ogni sampler
    private _textureBindGroupMipmap: GPUBindGroup = null!;
    private _textureBindGroupNoMipmap: GPUBindGroup = null!;

    //true per usare le mipmap
    private mipmapOn: boolean = true;

    //lo shader della scena: disegna il piano con la texture scorrevole
    private shader: string = `

        struct Vertex {
            @location(0) position: vec3f,
            @location(1) normal: vec3f,
            @location(2) texcoord: vec2f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f,
            @location(0) texcoord: vec2f,
        };

        struct Uniforms
        {
            transform: mat4x4f,
            scroll: vec4f
        }

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;
        @group(1) @binding(0) var textureSampler: sampler;
        @group(1) @binding(1) var diffuseTexture: texture_2d<f32>;

        @vertex fn vs(v:Vertex) -> VertexOut
        {
            var vOut:VertexOut;
            vOut.position = uniforms.transform * vec4f(v.position, 1.0);
            //la texture scorre lungo il piano per rendere evidente lo sfarfallio
            vOut.texcoord = v.texcoord + vec2f(0.0, uniforms.scroll.x);
            return vOut;
        }

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            return textureSample(diffuseTexture, textureSampler, v.texcoord);
        }
    `;

    //shader che crea un livello di mipmap: disegna un triangolo grande quanto lo schermo
    //leggendo il livello precedente (più grande) e scrivendo il livello successivo (metà dimensione)
    private mipShader: string = `

        struct VertexOut {
            @builtin(position) position: vec4f,
            @location(0) texcoord: vec2f,
        };

        @vertex fn vs(@builtin(vertex_index) index: u32) -> VertexOut
        {
            //un unico triangolo che copre tutto lo schermo, non servono vertex buffer
            var positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
            let p = positions[index];

            var vOut:VertexOut;
            vOut.position = vec4f(p, 0.0, 1.0);
            vOut.texcoord = vec2f((p.x + 1.0) * 0.5, 1.0 - (p.y + 1.0) * 0.5);
            return vOut;
        }

        @group(0) @binding(0) var sourceSampler: sampler;
        @group(0) @binding(1) var sourceTexture: texture_2d<f32>;

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            //il filtro lineare fa la media dei pixel vicini: è la riduzione a metà dimensione
            return textureSample(sourceTexture, sourceSampler, v.texcoord);
        }
    `;

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, canvas, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

        //click per attivare/disattivare le mipmap
        const info = () => document.querySelector("p")!.innerHTML = this.mipmapOn ? "Mipmap Attive" : "Mipmap Non Attive";
        info();
        canvas.onclick = () => {
            this.mipmapOn = !this.mipmapOn;
            info();
        };

        //un piano di 20x20 su cui la texture si ripete 40 volte
        this._mesh = createGpuMesh(device, createPlane(20, 40));

        //uniform buffer: matrice (64 byte) + un vec4 con lo scorrimento (16 byte)
        this._uniformBuffer = device.createBuffer({
            size: 80,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        //crea la texture: una scacchiera, un'immagine con molti dettagli fini che mostra bene l'aliasing
        const size = 512;
        const mipLevelCount = Math.floor(Math.log2(size)) + 1;  //512 -> 10 livelli (512, 256, ... 1)
        this._texture = device.createTexture({
            format: 'rgba8unorm',
            size: [size, size],
            //mipLevelCount indica quanti livelli vengono allocati
            mipLevelCount,
            //RENDER_ATTACHMENT serve perché ogni livello viene disegnato (generato) da un render pass
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //disegna la scacchiera (caselle da 16 pixel) e la copia nel livello 0
        const pixels = new Uint8Array(size * size * 4);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const white = ((x >> 4) + (y >> 4)) % 2 == 0;
                const value = white ? 255 : 30;
                pixels.set([value, value, value, 255], (y * size + x) * 4);
            }
        }
        device.queue.writeTexture(
            { texture: this._texture },
            pixels,
            { bytesPerRow: size * 4 },
            [size, size]);

        //genera i livelli successivi
        await this.generateMipmaps(device, this._texture);

        //sampler con mipmap: mipmapFilter 'linear' sfuma anche tra due livelli adiacenti
        this._samplerMipmap = device.createSampler({
            minFilter: "linear",
            magFilter: "linear",
            mipmapFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "repeat"
        });

        //sampler senza mipmap: lodMaxClamp a 0 impedisce di usare livelli diversi dal primo
        this._samplerNoMipmap = device.createSampler({
            minFilter: "linear",
            magFilter: "linear",
            mipmapFilter: "nearest",
            lodMinClamp: 0,
            lodMaxClamp: 0,
            addressModeU: "repeat",
            addressModeV: "repeat"
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
        });

        //creazione bind group
        this._bindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._uniformBuffer } },
            ],
        });

        this._textureBindGroupMipmap = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this._samplerMipmap },
                { binding: 1, resource: this._texture.createView() }
            ],
        });

        this._textureBindGroupNoMipmap = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this._samplerNoMipmap },
                { binding: 1, resource: this._texture.createView() }
            ],
        });
    }

    /**
     * Genera i livelli di mipmap: ogni livello è il precedente ridotto a metà.
     * La GPU non lo fa da sola, quindi per ogni livello si esegue un render pass
     * che legge il livello precedente e scrive quello nuovo.
     */
    private async generateMipmaps(device: GPUDevice, texture: GPUTexture) {
        const module = await createShader(device, this.mipShader);

        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module },
            fragment: { module, targets: [{ format: texture.format }] },
        });

        const sampler = device.createSampler({ minFilter: "linear", magFilter: "linear" });

        const encoder = device.createCommandEncoder();

        for (let level = 1; level < texture.mipLevelCount; level++) {
            //la view seleziona un singolo livello della texture
            const source = texture.createView({ baseMipLevel: level - 1, mipLevelCount: 1 });
            const target = texture.createView({ baseMipLevel: level, mipLevelCount: 1 });

            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: source },
                ],
            });

            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: target,
                    loadOp: 'clear',
                    storeOp: 'store',
                }]
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
        }

        device.queue.submit([encoder.finish()]);
    }

    draw() {
        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0.5, 0.7, 1, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(this._pipeline);
        pass.setVertexBuffer(0, this._mesh.vertexBuffer);
        pass.setIndexBuffer(this._mesh.indexBuffer, 'uint32');

        //camera bassa che guarda il piano quasi di taglio: la texture lontana è molto rimpicciolita
        const view: Mat4 = mat4.lookAt([0, 0.6, 9], [0, 0.2, 0], [0, 1, 0]);
        const projection: Mat4 = mat4.perspective(Math.PI / 3, this._context.canvas.width / this._context.canvas.height, 0.1, 1000);
        const transform: Mat4 = mat4.multiply(projection, view);

        //scrive la matrice e lo scorrimento della texture nell'uniform buffer
        this._device.queue.writeBuffer(this._uniformBuffer, 0, transform);
        this._device.queue.writeBuffer(this._uniformBuffer, 64, new Float32Array([performance.now() / 4000.0, 0, 0, 0]));

        pass.setBindGroup(0, this._bindGroup);
        pass.setBindGroup(1, this.mipmapOn ? this._textureBindGroupMipmap : this._textureBindGroupNoMipmap);

        pass.drawIndexed(this._mesh.indexCount);

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

        this._mesh.destroy();
        this._uniformBuffer.destroy();
        this._texture.destroy();

        this._context.unconfigure();
    }
}
