/**
 * Animazioni (Skeletal Animation)
 *
 * Per animare un personaggio non si spostano i singoli vertici: si anima uno SCHELETRO.
 *
 *  - Lo scheletro è una gerarchia di "ossa" (joint): ogni osso ha una trasformazione relativa al padre.
 *    Se si ruota la spalla, si muove di conseguenza tutto il braccio.
 *  - La SKIN lega ogni vertice alle ossa: ogni vertice indica quali 4 ossa lo influenzano (joints)
 *    e con quale peso (weights, la somma è 1). Così la pelle si piega in modo morbido sulle articolazioni.
 *  - Le ANIMAZIONI sono una serie di KEYFRAME: per ogni osso, la rotazione (o traslazione) in certi istanti.
 *    Tra un keyframe e l'altro i valori vengono interpolati.
 *
 * Ad ogni frame:
 *  1) si calcola la posa corrispondente al tempo corrente interpolando i keyframe
 *  2) si calcola la trasformazione globale di ogni osso, partendo dalla radice e scendendo lungo la gerarchia
 *  3) per ogni osso si calcola la "matrice del joint" = trasformazione globale * inverse bind matrix.
 *     La inverse bind matrix porta i vertici dallo spazio del modello a quello dell'osso nella posa originale;
 *     la trasformazione globale li riporta nello spazio del modello, ma nella posa animata
 *  4) le matrici dei joint vengono inviate alla GPU, e il vertex shader sposta ogni vertice
 *     mescolando le matrici delle sue 4 ossa in base ai pesi (skinning)
 *
 * Il modello (public/soldier.glb) è in formato glTF, che contiene scheletro, animazione e texture.
 * Il caricamento del file è in utility/gltf.ts (loadGltfScene).
 *
 * Con il mouse: trascina per ruotare la camera attorno al personaggio, usa la rotella per avvicinarti
 * o allontanarti, clicca per mettere in pausa/riprendere l'animazione.
 *
 * NOTA: dal tutorial 03 l'inizializzazione di WebGPU è nella funzione initWebGpu() di utility/webgpuInit.ts
 */

import { baseRendering } from "../utility/baseRendering";
import { initWebGpu, createShader } from "../utility/webgpuInit";
import { Mat4, mat4, quat, vec3 } from 'wgpu-matrix'
import { vertexBufferLayout } from "../utility/geometry";
import { loadGltfScene, GltfScene, GltfChannel } from "../utility/gltf";

//i dati sulla GPU di una parte del modello (una primitiva glTF)
interface GpuPrimitive {
    vertexBuffer: GPUBuffer;
    skinBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
    materialBindGroup: GPUBindGroup;
}

export class Tutorial23 extends baseRendering {
    //device, l'oggetto incaricato di creare e gestire le risorse
    private _device: GPUDevice = null!;

    //contesto di rendering associato al tag canvas
    private _context: GPUCanvasContext = null!;

    //render pipeline
    private _pipeline: GPURenderPipeline = null!;

    //il modello letto dal file glTF
    private _scene: GltfScene = null!;

    //parti del modello sulla GPU
    private _primitives: GpuPrimitive[] = [];

    //buffer che contiene i dati della scena (camera, luce)
    private _sceneBuffer: GPUBuffer = null!;

    //buffer che contiene le matrici di tutti i joint
    private _jointBuffer: GPUBuffer = null!;

    //bind group della scena e dei joint
    private _sceneBindGroup: GPUBindGroup = null!;

    //texture contenente lo ZBuffer
    private _depthTexture: GPUTexture = null!;

    //risorse da liberare alla chiusura
    private _textures: GPUTexture[] = [];
    private _buffers: GPUBuffer[] = [];

    //dati per il calcolo della posa
    private _order: number[] = [];                  //nodi ordinati in modo che il padre preceda sempre i figli
    private _parent: number[] = [];                 //indice del padre di ogni nodo (-1 per le radici)
    private _translation: Float32Array[] = [];      //trasformazione locale corrente di ogni nodo
    private _rotation: Float32Array[] = [];
    private _scale: Float32Array[] = [];
    private _globals: Mat4[] = [];                  //trasformazione globale di ogni nodo
    private _jointMatrices: Float32Array = null!;   //matrici dei joint da inviare alla GPU

    //stato dell'animazione
    private _playing: boolean = true;
    private _animationTime: number = 0;
    private _lastTime: number = 0;

    //camera che ruota attorno al personaggio: angoli (in radianti) e distanza
    private _yaw: number = 0.6;
    private _pitch: number = 0.15;
    private _distance: number = 3.3;

    //rimuove gli eventi del mouse, da chiamare in destroy (la canvas è condivisa con gli altri tutorial)
    private _removeEvents: () => void = () => { };

    //lo shader viene creato in init: la dimensione dell'array dei joint dipende dal modello
    private shader(jointCount: number): string {
        return `

        struct Vertex {
            @location(0) position: vec3f,
            @location(1) normal: vec3f,
            @location(2) texcoord: vec2f,
            //i 4 joint che influenzano il vertice, con il relativo peso
            @location(3) joints: vec4<u32>,
            @location(4) weights: vec4f,
        };

        struct VertexOut {
            @builtin(position) position: vec4f,
            @location(0) worldPosition: vec3f,
            @location(1) normal: vec3f,
            @location(2) texcoord: vec2f,
        };

        struct Scene
        {
            viewProjection: mat4x4f,
            world: mat4x4f,
            cameraPosition: vec4f,
            lightPosition: vec4f
        }

        //le matrici di tutti i joint, calcolate dal codice ad ogni frame
        struct Skeleton
        {
            joints: array<mat4x4f, ${jointCount}>
        }

        //colore e soglia di trasparenza del materiale
        struct Material
        {
            color: vec4f,
            alphaCutoff: vec4f
        }

        @group(0) @binding(0) var<uniform> scene: Scene;
        @group(0) @binding(1) var<uniform> skeleton: Skeleton;

        @group(1) @binding(0) var textureSampler: sampler;
        @group(1) @binding(1) var baseTexture: texture_2d<f32>;
        @group(1) @binding(2) var<uniform> material: Material;

        @vertex fn vs(v:Vertex) -> VertexOut
        {
            //SKINNING: la matrice del vertice è la media pesata delle matrici delle sue 4 ossa
            let skinMatrix =
                skeleton.joints[v.joints.x] * v.weights.x +
                skeleton.joints[v.joints.y] * v.weights.y +
                skeleton.joints[v.joints.z] * v.weights.z +
                skeleton.joints[v.joints.w] * v.weights.w;

            //posizione e normale nella posa animata, poi trasformazione del modello (scala, rotazione)
            let worldPosition = scene.world * skinMatrix * vec4f(v.position, 1.0);

            var vOut:VertexOut;
            vOut.position = scene.viewProjection * worldPosition;
            vOut.worldPosition = worldPosition.xyz;
            vOut.normal = (scene.world * skinMatrix * vec4f(v.normal, 0.0)).xyz;
            vOut.texcoord = v.texcoord;
            return vOut;
        }

        @fragment fn fs(v:VertexOut) -> @location(0) vec4f {
            let texel = textureSample(baseTexture, textureSampler, v.texcoord);

            //parti trasparenti (es. capelli, bordi): i pixel sotto la soglia vengono scartati
            if (texel.a * material.color.a < material.alphaCutoff.x) {
                discard;
            }

            let albedo = texel.rgb * material.color.rgb;

            let toLight = normalize(scene.lightPosition.xyz - v.worldPosition);
            let toCamera = normalize(scene.cameraPosition.xyz - v.worldPosition);

            //il modello è visibile da entrambi i lati: se la superficie guarda dalla parte opposta alla camera si inverte la normale
            var normal = normalize(v.normal);
            if (dot(normal, toCamera) < 0.0) {
                normal = -normal;
            }

            //illuminazione come nel tutorial sull'illuminazione
            let ambient = 0.3;
            let diffuse = max(dot(normal, toLight), 0.0);
            var specular = pow(max(dot(normal, normalize(toLight + toCamera)), 0.0), 32.0);
            if (diffuse <= 0.0) {
                specular = 0.0;
            }

            return vec4f(albedo * (ambient + diffuse) + vec3f(1.0) * specular * 0.15, 1.0);
        }
    `;
    }

    async init() {
        //inizializzazione di device, canvas e contesto (gli stessi passi del tutorial 00, vedi utility/webgpuInit.ts)
        const { device, canvas, context, format: presentationFormat } = await initWebGpu();
        this._device = device;
        this._context = context;

        //carica il modello: nodi, mesh, materiali, texture, scheletro ed animazioni
        const scene = await loadGltfScene(import.meta.env.BASE_URL + "soldier.glb");
        this._scene = scene;

        if (!scene.skin || scene.animations.length == 0) {
            throw new Error("il modello non contiene uno scheletro con animazioni");
        }
        const animation = scene.animations[0];
        const jointCount = scene.skin.joints.length;

        document.querySelector("p")!.innerHTML =
            `Animazione "${animation.name}": ${animation.duration.toFixed(2)} secondi, ${jointCount} ossa.<br>Trascina per ruotare, rotella per lo zoom, clicca per mettere in pausa.`;
        this.initMouse(canvas);

        this.initSkeleton();

        //uniform buffer della scena: 2 matrici (128 byte) + camera e luce (2 x 16 byte)
        this._sceneBuffer = this.createBuffer(160, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

        //uniform buffer con una matrice (64 byte) per ogni joint
        this._jointBuffer = this.createBuffer(jointCount * 64, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

        //creazione di una texture da utilizzare per lo ZBuffer
        this._depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        //crea lo shader
        const module = await createShader(device, this.shader(jointCount));

        //crea la pipeline. Ci sono due vertex buffer:
        //il primo (posizione, normale, uv) come nei tutorial precedenti, il secondo con i joint ed i pesi dello skinning
        this._pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module,
                buffers: [
                    vertexBufferLayout,
                    {
                        arrayStride: 24,
                        attributes: [
                            { shaderLocation: 3, offset: 0, format: 'uint16x4' },   //4 indici di joint, 2 byte ciascuno
                            { shaderLocation: 4, offset: 8, format: 'float32x4' },  //4 pesi
                        ]
                    }
                ]
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

        this._sceneBindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this._sceneBuffer } },
                { binding: 1, resource: { buffer: this._jointBuffer } },
            ],
        });

        this.initPrimitives();

        this._lastTime = performance.now() / 1000.0;
    }

    //controllo della camera con il mouse
    private initMouse(canvas: HTMLCanvasElement) {
        let dragging = false;
        let moved = 0;      //distanza percorsa dal puntatore: serve a distinguere un clic da un trascinamento

        const down = (e: PointerEvent) => {
            dragging = true;
            moved = 0;
            canvas.setPointerCapture(e.pointerId);
        };
        const move = (e: PointerEvent) => {
            if (!dragging) return;
            moved += Math.abs(e.movementX) + Math.abs(e.movementY);

            //spostamento orizzontale = rotazione attorno al personaggio, verticale = inclinazione (limitata per non capovolgere la camera)
            this._yaw -= e.movementX * 0.01;
            this._pitch = Math.min(Math.max(this._pitch + e.movementY * 0.01, -0.5), 1.2);
        };
        const up = () => {
            //se il puntatore si è mosso poco è stato un clic: pausa/riprendi
            if (dragging && moved < 4) {
                this._playing = !this._playing;
            }
            dragging = false;
        };
        const wheel = (e: WheelEvent) => {
            e.preventDefault();
            this._distance = Math.min(Math.max(this._distance * (1 + e.deltaY * 0.001), 1.2), 8);
        };

        canvas.addEventListener("pointerdown", down);
        canvas.addEventListener("pointermove", move);
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("wheel", wheel, { passive: false });

        //impedisce al browser di usare il trascinamento su touch screen per scorrere la pagina
        canvas.style.touchAction = "none";

        this._removeEvents = () => {
            canvas.removeEventListener("pointerdown", down);
            canvas.removeEventListener("pointermove", move);
            canvas.removeEventListener("pointerup", up);
            canvas.removeEventListener("wheel", wheel);
            canvas.style.touchAction = "";
        };
    }

    //crea un buffer e lo registra per essere liberato in destroy
    private createBuffer(size: number, usage: GPUBufferUsageFlags): GPUBuffer {
        const buffer = this._device.createBuffer({ size, usage });
        this._buffers.push(buffer);
        return buffer;
    }

    //prepara i dati per il calcolo della posa
    private initSkeleton() {
        const nodes = this._scene.nodes;

        //padre di ogni nodo
        this._parent = nodes.map(() => -1);
        nodes.forEach((n, i) => n.children.forEach(c => this._parent[c] = i));

        //visita della gerarchia dalla radice: così quando si calcola un nodo il padre è già stato calcolato
        const visit = (i: number) => {
            this._order.push(i);
            nodes[i].children.forEach(visit);
        };
        this._scene.roots.forEach(visit);

        this._translation = nodes.map(n => Float32Array.from(n.translation));
        this._rotation = nodes.map(n => Float32Array.from(n.rotation));
        this._scale = nodes.map(n => Float32Array.from(n.scale));
        this._globals = nodes.map(() => mat4.identity());
        this._jointMatrices = new Float32Array(this._scene.skin!.joints.length * 16);
    }

    //crea i buffer, le texture ed i bind group per ogni parte del modello
    private initPrimitives() {
        const device = this._device;
        const scene = this._scene;

        //un sampler per tutte le texture
        const sampler = device.createSampler({
            minFilter: "linear",
            magFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "repeat"
        });

        //texture bianca da usare per i materiali senza immagine
        const whiteTexture = device.createTexture({
            format: 'rgba8unorm',
            size: [1, 1],
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        device.queue.writeTexture({ texture: whiteTexture }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4 }, [1, 1]);
        this._textures.push(whiteTexture);

        //una texture per ogni immagine del file
        const textures = scene.images.map(source => {
            const texture = device.createTexture({
                format: 'rgba8unorm',
                size: [source.width, source.height],
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture({ source }, { texture }, [source.width, source.height]);
            this._textures.push(texture);
            return texture;
        });

        //un bind group per ogni materiale: sampler, texture e colore
        const materialBindGroups = scene.materials.map(m => {
            //il colore del glTF è in spazio lineare mentre le texture (e la canvas) sono in spazio sRGB: lo si converte con una potenza
            const color = [...m.baseColor.slice(0, 3).map(c => Math.pow(c, 1 / 2.2)), m.baseColor[3]];

            //alphaCutoff negativo = nessun pixel viene scartato
            const buffer = this.createBuffer(32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
            device.queue.writeBuffer(buffer, 0, new Float32Array([...color, m.alphaCutoff ?? -1, 0, 0, 0]));

            return device.createBindGroup({
                layout: this._pipeline.getBindGroupLayout(1),
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: (m.image !== null ? textures[m.image] : whiteTexture).createView() },
                    { binding: 2, resource: { buffer } },
                ],
            });
        });

        //le parti del modello condividono gli stessi vertici: i buffer dei vertici vengono creati una volta sola
        const vertexBuffers = new Map<Float32Array, { vertexBuffer: GPUBuffer, skinBuffer: GPUBuffer }>();

        for (const p of scene.primitives) {
            if (!p.joints || !p.weights) {
                throw new Error("il modello non contiene i dati di skinning");
            }

            let buffers = vertexBuffers.get(p.vertices);
            if (!buffers) {
                const vertexBuffer = this.createBuffer(p.vertices.byteLength, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
                device.queue.writeBuffer(vertexBuffer, 0, p.vertices);

                //secondo vertex buffer: per ogni vertice 4 joint da 2 byte (8 byte) seguiti da 4 pesi float (16 byte)
                const count = p.vertices.length / 8;
                const skinData = new ArrayBuffer(count * 24);
                const skinJoints = new Uint16Array(skinData);
                const skinWeights = new Float32Array(skinData);
                for (let i = 0; i < count; i++) {
                    for (let k = 0; k < 4; k++) {
                        skinJoints[i * 12 + k] = p.joints[i * 4 + k];
                        skinWeights[i * 6 + 2 + k] = p.weights[i * 4 + k];
                    }
                }
                const skinBuffer = this.createBuffer(skinData.byteLength, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
                device.queue.writeBuffer(skinBuffer, 0, skinData);

                buffers = { vertexBuffer, skinBuffer };
                vertexBuffers.set(p.vertices, buffers);
            }

            const indexBuffer = this.createBuffer(p.indices.byteLength, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
            device.queue.writeBuffer(indexBuffer, 0, p.indices);

            this._primitives.push({
                ...buffers,
                indexBuffer,
                indexCount: p.indices.length,
                materialBindGroup: materialBindGroups[p.material],
            });
        }
    }

    //calcola il valore di un canale di animazione al tempo indicato, interpolando i due keyframe vicini
    private sample(channel: GltfChannel, time: number, out: Float32Array) {
        const { times, values } = channel;
        const size = channel.path === "rotation" ? 4 : 3;

        //individua i due keyframe che racchiudono il tempo: times[k] <= time < times[k + 1]
        let k = 0;
        while (k < times.length - 2 && times[k + 1] <= time) {
            k++;
        }

        if (times.length == 1) {
            out.set(values.subarray(0, size));
            return;
        }

        //quanto siamo avanti tra i due keyframe (0 = primo, 1 = secondo)
        const t = Math.min(Math.max((time - times[k]) / (times[k + 1] - times[k]), 0), 1);

        const a = values.subarray(k * size, (k + 1) * size);
        const b = values.subarray((k + 1) * size, (k + 2) * size);

        if (channel.path === "rotation") {
            //le rotazioni sono quaternioni: si interpolano con slerp, che mantiene la velocità angolare costante
            quat.slerp(a, b, t, out);
        } else {
            //traslazione e scala: interpolazione lineare
            for (let c = 0; c < size; c++) {
                out[c] = a[c] + (b[c] - a[c]) * t;
            }
        }
    }

    //calcola la posa al tempo indicato e scrive le matrici dei joint nel buffer
    private updatePose(time: number) {
        const scene = this._scene;
        const animation = scene.animations[0];

        //1) interpola i keyframe: aggiorna la trasformazione locale dei nodi animati
        for (const channel of animation.channels) {
            const target = channel.path === "translation" ? this._translation
                : channel.path === "rotation" ? this._rotation
                    : this._scale;
            this.sample(channel, time, target[channel.node]);
        }

        //2) trasformazione globale di ogni nodo = trasformazione globale del padre * trasformazione locale
        for (const i of this._order) {
            const local = mat4.translation(this._translation[i]);
            mat4.multiply(local, mat4.fromQuat(this._rotation[i]), local);
            mat4.scale(local, this._scale[i], local);

            const parent = this._parent[i];
            this._globals[i] = parent < 0 ? local : mat4.multiply(this._globals[parent], local);
        }

        //3) matrice di ogni joint = trasformazione globale dell'osso * inverse bind matrix
        const skin = scene.skin!;
        skin.joints.forEach((node, k) => {
            const inverseBind = skin.inverseBindMatrices.subarray(k * 16, (k + 1) * 16);
            mat4.multiply(this._globals[node], inverseBind, this._jointMatrices.subarray(k * 16, (k + 1) * 16));
        });

        //4) invia le matrici alla GPU
        this._device.queue.writeBuffer(this._jointBuffer, 0, this._jointMatrices);
    }

    draw() {
        //avanza il tempo dell'animazione (se non è in pausa) e la ripete all'infinito
        const now = performance.now() / 1000.0;
        if (this._playing) {
            this._animationTime += now - this._lastTime;
        }
        this._lastTime = now;

        const animation = this._scene.animations[0];
        this.updatePose(this._animationTime % animation.duration);

        //il modello è alto circa 230 unità: lo si riduce
        const world: Mat4 = mat4.scaling([0.01, 0.01, 0.01]);

        //la camera gira attorno al punto al centro del personaggio (coordinate sferiche: due angoli e una distanza)
        const target = vec3.fromValues(0, 1.05, 0);
        const cameraPosition = vec3.fromValues(
            target[0] + Math.sin(this._yaw) * Math.cos(this._pitch) * this._distance,
            target[1] + Math.sin(this._pitch) * this._distance,
            target[2] + Math.cos(this._yaw) * Math.cos(this._pitch) * this._distance);
        const view: Mat4 = mat4.lookAt(cameraPosition, target, [0, 1, 0]);
        const projection: Mat4 = mat4.perspective(Math.PI / 3, this._context.canvas.width / this._context.canvas.height, 0.1, 100);
        const viewProjection: Mat4 = mat4.multiply(projection, view);

        //la luce si muove con la camera (un po' a destra e in alto), così il personaggio è sempre illuminato davanti
        const lightPosition = vec3.fromValues(
            cameraPosition[0] + Math.cos(this._yaw) * 2,
            cameraPosition[1] + 2,
            cameraPosition[2] - Math.sin(this._yaw) * 2);

        this._device.queue.writeBuffer(this._sceneBuffer, 0, viewProjection);
        this._device.queue.writeBuffer(this._sceneBuffer, 64, world);
        this._device.queue.writeBuffer(this._sceneBuffer, 128, new Float32Array([...cameraPosition, 1]));
        this._device.queue.writeBuffer(this._sceneBuffer, 144, new Float32Array([...lightPosition, 1]));

        // si crea un command encoder che eseguirà le operazioni
        const encoder = this._device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this._context.getCurrentTexture().createView(),
                    clearValue: [0.2, 0.25, 0.35, 1],
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

        //ogni parte del modello ha il proprio materiale (texture)
        for (const p of this._primitives) {
            pass.setVertexBuffer(0, p.vertexBuffer);
            pass.setVertexBuffer(1, p.skinBuffer);
            pass.setIndexBuffer(p.indexBuffer, 'uint32');
            pass.setBindGroup(1, p.materialBindGroup);
            pass.drawIndexed(p.indexCount);
        }

        pass.end();

        //submit dell'encoder, viene inviata la sequenza dei comandi registrati
        this._device.queue.submit([encoder.finish()]);

        //richiedi un nuovo frame
        this.frameId = requestAnimationFrame(() => this.draw());
    }

    async destroy(): Promise<void> {
        //interrompi il rendering
        cancelAnimationFrame(this.frameId);

        //rimuove gli eventi del mouse
        this._removeEvents();

        //elimina immediatamente tutte le risorse per non lasciarle in memoria
        await this._device.queue.onSubmittedWorkDone();

        this._buffers.forEach(b => b.destroy());
        this._textures.forEach(t => t.destroy());
        this._depthTexture.destroy();

        this._context.unconfigure();
    }
}
