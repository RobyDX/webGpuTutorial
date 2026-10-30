/**
 * Caricamento di modelli glTF (utility)
 *
 * glTF è il formato standard per scambiare modelli 3D ("il JPEG del 3D").
 * Esiste in due varianti:
 *  - .gltf: un file JSON che descrive il modello, con i dati binari in un file .bin separato (o incorporati)
 *  - .glb: un unico file binario che contiene sia il JSON che i dati
 *
 * Il JSON descrive i dati con tre livelli:
 *  buffers      -> blocchi di byte (il contenuto dei file .bin)
 *  bufferViews  -> porzioni di un buffer
 *  accessors    -> come leggere una bufferView (tipo di dato, quanti elementi, quanti componenti)
 *
 * Questo file offre due funzioni:
 *  - loadGltf(): legge solo la prima mesh (posizioni, normali, uv, indici). Usata nel tutorial sui modelli glTF.
 *  - loadGltfScene(): legge anche gerarchia dei nodi, materiali, texture, scheletro (skin) e animazioni.
 *    Usata nel tutorial sulle animazioni.
 *
 * Limiti: i nodi devono usare translation/rotation/scale (non una matrice), sono supportate solo
 * le animazioni con interpolazione lineare, e sono letti solo i materiali con colore base.
 */

import { Mesh } from "./geometry";

//tipi di dato dei componenti, come definiti dalla specifica glTF
//(array: tipo di array da usare, size: byte per componente, read: lettura di un singolo valore)
const COMPONENT_TYPES: { [type: number]: { array: any, size: number, read: (v: DataView, at: number) => number } } = {
    5120: { array: Int8Array, size: 1, read: (v, at) => v.getInt8(at) },
    5121: { array: Uint8Array, size: 1, read: (v, at) => v.getUint8(at) },
    5122: { array: Int16Array, size: 2, read: (v, at) => v.getInt16(at, true) },
    5123: { array: Uint16Array, size: 2, read: (v, at) => v.getUint16(at, true) },
    5125: { array: Uint32Array, size: 4, read: (v, at) => v.getUint32(at, true) },
    5126: { array: Float32Array, size: 4, read: (v, at) => v.getFloat32(at, true) },
};

//numero di componenti per ogni tipo di accessor
const TYPE_COMPONENTS: { [type: string]: number } = {
    SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16,
};

//contenuto di un file glTF già letto: il JSON e i blocchi binari
interface GltfFile {
    json: any;
    buffers: ArrayBuffer[];
    //cartella del file, per trovare le risorse esterne
    base: string;
}

/**
 * Scarica un file .glb o .gltf e ne separa il JSON dai dati binari.
 */
async function readFile(url: string): Promise<GltfFile> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`impossibile caricare il modello ${url}`);
    }

    const base = url.substring(0, url.lastIndexOf("/") + 1);
    let json: any;
    let buffers: ArrayBuffer[] = [];

    if (url.toLowerCase().endsWith(".glb")) {
        //file binario: 12 byte di intestazione, poi una serie di "chunk" (JSON e dati binari)
        const data = await response.arrayBuffer();
        const view = new DataView(data);

        if (view.getUint32(0, true) !== 0x46546C67) {   //"glTF"
            throw new Error("il file non è un glb valido");
        }

        let offset = 12;
        while (offset < data.byteLength) {
            const length = view.getUint32(offset, true);
            const type = view.getUint32(offset + 4, true);
            const chunk = data.slice(offset + 8, offset + 8 + length);

            if (type === 0x4E4F534A) {          //"JSON"
                json = JSON.parse(new TextDecoder().decode(chunk));
            } else if (type === 0x004E4942) {   //"BIN"
                buffers.push(chunk);
            }
            offset += 8 + length;
        }
    } else {
        //file di testo: i dati binari sono in file separati (o incorporati come data URI)
        json = await response.json();
        for (const b of json.buffers) {
            const bufferResponse = await fetch(b.uri.startsWith("data:") ? b.uri : base + b.uri);
            buffers.push(await bufferResponse.arrayBuffer());
        }
    }

    return { json, buffers, base };
}

//dati di un accessor già convertiti in un array tipizzato
interface AccessorData {
    data: any;
    components: number;
    count: number;
}

/**
 * Crea la funzione che legge un accessor e restituisce i suoi dati come array tipizzato.
 * I risultati vengono memorizzati: se più parti del modello usano lo stesso accessor viene letto una volta sola.
 */
function createAccessorReader(file: GltfFile) {
    const { json, buffers } = file;
    const cache = new Map<number, AccessorData>();

    return (index: number): AccessorData => {
        const cached = cache.get(index);
        if (cached) {
            return cached;
        }

        const accessor = json.accessors[index];
        const bufferView = json.bufferViews[accessor.bufferView];
        const component = COMPONENT_TYPES[accessor.componentType];
        const components = TYPE_COMPONENTS[accessor.type];

        const buffer = buffers[bufferView.buffer ?? 0];
        const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

        //byteStride indica la distanza tra due elementi consecutivi, se i dati sono interlacciati con altri
        const stride = bufferView.byteStride ?? components * component.size;

        let data: any;
        if (stride === components * component.size) {
            //dati contigui: si può leggere direttamente
            data = new component.array(buffer.slice(byteOffset, byteOffset + accessor.count * stride));
        } else {
            //dati interlacciati: si copia un elemento alla volta
            data = new component.array(accessor.count * components);
            const view = new DataView(buffer);
            for (let i = 0; i < accessor.count; i++) {
                for (let c = 0; c < components; c++) {
                    data[i * components + c] = component.read(view, byteOffset + i * stride + c * component.size);
                }
            }
        }

        //i dati "normalized" sono interi che rappresentano valori tra 0 e 1 (o -1 e 1): si convertono in float
        if (accessor.normalized && component.array !== Float32Array) {
            const max = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535, 5125: 4294967295 }[accessor.componentType as number]!;
            data = Float32Array.from(data as ArrayLike<number>, (v: number) => Math.max(v / max, -1));
        }

        const result = { data, components, count: accessor.count };
        cache.set(index, result);
        return result;
    };
}

//compone i vertici nel formato usato dai tutorial: posizione, normale, uv (8 float)
function composeVertices(read: (i: number) => AccessorData, attributes: any): Float32Array {
    const positions = read(attributes.POSITION);
    const normals = attributes.NORMAL !== undefined ? read(attributes.NORMAL) : null;
    const uvs = attributes.TEXCOORD_0 !== undefined ? read(attributes.TEXCOORD_0) : null;

    const vertices = new Float32Array(positions.count * 8);
    for (let i = 0; i < positions.count; i++) {
        for (let c = 0; c < 3; c++) {
            vertices[i * 8 + c] = positions.data[i * 3 + c];
            vertices[i * 8 + 3 + c] = normals ? normals.data[i * 3 + c] : 0;
        }
        vertices[i * 8 + 6] = uvs ? uvs.data[i * 2] : 0;
        vertices[i * 8 + 7] = uvs ? uvs.data[i * 2 + 1] : 0;
    }
    return vertices;
}

//legge gli indici di una primitiva (a 8, 16 o 32 bit) convertendoli sempre a 32 bit
function readIndices(read: (i: number) => AccessorData, primitive: any, vertexCount: number): Uint32Array {
    if (primitive.indices !== undefined) {
        return Uint32Array.from(read(primitive.indices).data);
    }
    //mesh senza indici: i vertici sono già in ordine
    return Uint32Array.from({ length: vertexCount }, (_, i) => i);
}

/**
 * Scarica un file .glb o .gltf e ne estrae la prima mesh.
 */
export async function loadGltf(url: string): Promise<Mesh> {
    const file = await readFile(url);
    const read = createAccessorReader(file);

    const primitive = file.json.meshes?.[0]?.primitives?.[0];
    if (!primitive || primitive.attributes.POSITION === undefined) {
        throw new Error("il modello non contiene una mesh con posizioni");
    }

    const vertices = composeVertices(read, primitive.attributes);
    return { vertices, indices: readIndices(read, primitive, vertices.length / 8) };
}

/* ------------------------------------------------------------------------------------------------
 * Scena completa: nodi, materiali, scheletro e animazioni
 * ------------------------------------------------------------------------------------------------ */

//un nodo della gerarchia: ogni nodo ha una trasformazione (traslazione, rotazione, scala) relativa al padre
export interface GltfNode {
    name: string;
    children: number[];
    translation: number[];
    rotation: number[];     //quaternione (x, y, z, w)
    scale: number[];
}

//una parte della mesh che usa un solo materiale
export interface GltfPrimitive {
    //posizione, normale, uv (8 float per vertice)
    vertices: Float32Array;
    indices: Uint32Array;
    //per ogni vertice: gli indici dei 4 joint (ossa) che lo influenzano
    joints: Uint16Array | null;
    //per ogni vertice: quanto ciascuno dei 4 joint lo influenza (la somma è 1)
    weights: Float32Array | null;
    //indice del materiale in GltfScene.materials
    material: number;
}

export interface GltfMaterial {
    //colore base (RGBA) da moltiplicare per la texture
    baseColor: number[];
    //indice dell'immagine in GltfScene.images, null se il materiale non ha texture
    image: number | null;
    //se presente i pixel con alpha inferiore vengono scartati (alphaMode MASK)
    alphaCutoff: number | null;
}

//un canale di animazione: i valori che una proprietà di un nodo assume nel tempo
export interface GltfChannel {
    node: number;
    path: "translation" | "rotation" | "scale";
    //istanti dei keyframe, in secondi
    times: Float32Array;
    //valori ai keyframe: 3 float per translation/scale, 4 per rotation
    values: Float32Array;
}

export interface GltfAnimation {
    name: string;
    //durata in secondi
    duration: number;
    channels: GltfChannel[];
}

//lo scheletro: l'elenco dei nodi che fanno da "ossa" e come ricondurre i vertici a ciascuno di essi
export interface GltfSkin {
    //indici dei nodi che sono joint, nello stesso ordine usato da GltfPrimitive.joints
    joints: number[];
    //per ogni joint, 16 float: la matrice che porta i vertici nello spazio locale dell'osso nella posa originale
    inverseBindMatrices: Float32Array;
}

export interface GltfScene {
    nodes: GltfNode[];
    //nodi radice della scena
    roots: number[];
    primitives: GltfPrimitive[];
    materials: GltfMaterial[];
    images: ImageBitmap[];
    skin: GltfSkin | null;
    animations: GltfAnimation[];
}

/**
 * Scarica un file .glb o .gltf e ne estrae la scena completa.
 */
export async function loadGltfScene(url: string): Promise<GltfScene> {
    const file = await readFile(url);
    const { json } = file;
    const read = createAccessorReader(file);

    //nodi
    const nodes: GltfNode[] = (json.nodes ?? []).map((n: any) => {
        if (n.matrix) {
            throw new Error("i nodi con matrice non sono supportati: usare translation, rotation e scale");
        }
        return {
            name: n.name ?? "",
            children: n.children ?? [],
            translation: n.translation ?? [0, 0, 0],
            rotation: n.rotation ?? [0, 0, 0, 1],
            scale: n.scale ?? [1, 1, 1],
        };
    });
    const roots: number[] = json.scenes?.[json.scene ?? 0]?.nodes ?? [];

    //primitive della prima mesh (le parti con triangoli, ognuna con il proprio materiale)
    //i vertici condivisi tra più primitive vengono composti una volta sola
    const primitives: GltfPrimitive[] = [];
    const verticesCache = new Map<string, Float32Array>();
    for (const p of json.meshes?.[0]?.primitives ?? []) {
        if ((p.mode ?? 4) !== 4 || p.attributes.POSITION === undefined) {
            continue;   //solo triangoli
        }

        const key = `${p.attributes.POSITION}/${p.attributes.NORMAL}/${p.attributes.TEXCOORD_0}`;
        let vertices = verticesCache.get(key);
        if (!vertices) {
            vertices = composeVertices(read, p.attributes);
            verticesCache.set(key, vertices);
        }

        primitives.push({
            vertices,
            indices: readIndices(read, p, vertices.length / 8),
            //i joint possono essere a 8 o 16 bit: si usano sempre 16 bit
            joints: p.attributes.JOINTS_0 !== undefined ? Uint16Array.from(read(p.attributes.JOINTS_0).data) : null,
            weights: p.attributes.WEIGHTS_0 !== undefined ? Float32Array.from(read(p.attributes.WEIGHTS_0).data) : null,
            material: p.material ?? 0,
        });
    }
    if (primitives.length === 0) {
        throw new Error("il modello non contiene una mesh con triangoli");
    }

    //materiali: colore base e indice dell'immagine della texture
    const materials: GltfMaterial[] = (json.materials ?? [{}]).map((m: any) => {
        const pbr = m.pbrMetallicRoughness ?? {};
        const textureIndex = pbr.baseColorTexture?.index;
        return {
            baseColor: pbr.baseColorFactor ?? [1, 1, 1, 1],
            image: textureIndex !== undefined ? json.textures[textureIndex].source : null,
            alphaCutoff: m.alphaMode === "MASK" ? (m.alphaCutoff ?? 0.5) : null,
        };
    });

    //immagini: sono incorporate nel file (bufferView) oppure file separati (uri)
    const images: ImageBitmap[] = [];
    for (const img of json.images ?? []) {
        let blob: Blob;
        if (img.bufferView !== undefined) {
            const view = json.bufferViews[img.bufferView];
            const offset = view.byteOffset ?? 0;
            blob = new Blob([file.buffers[view.buffer ?? 0].slice(offset, offset + view.byteLength)], { type: img.mimeType });
        } else {
            const response = await fetch(img.uri.startsWith("data:") ? img.uri : file.base + img.uri);
            blob = await response.blob();
        }
        images.push(await createImageBitmap(blob, { colorSpaceConversion: 'none' }));
    }

    //scheletro
    let skin: GltfSkin | null = null;
    if (json.skins?.length) {
        const s = json.skins[0];
        skin = {
            joints: s.joints,
            inverseBindMatrices: Float32Array.from(read(s.inverseBindMatrices).data),
        };
    }

    //animazioni
    const animations: GltfAnimation[] = (json.animations ?? []).map((a: any, i: number) => {
        const channels: GltfChannel[] = [];
        let duration = 0;

        for (const c of a.channels) {
            const sampler = a.samplers[c.sampler];
            if ((sampler.interpolation ?? "LINEAR") !== "LINEAR") {
                throw new Error("sono supportate solo le animazioni con interpolazione lineare");
            }
            if (!["translation", "rotation", "scale"].includes(c.target.path)) {
                continue;   //altre proprietà (es. morph target) non sono supportate
            }

            const times = Float32Array.from(read(sampler.input).data);
            duration = Math.max(duration, times[times.length - 1]);
            channels.push({
                node: c.target.node,
                path: c.target.path,
                times,
                values: Float32Array.from(read(sampler.output).data),
            });
        }

        return { name: a.name ?? `animazione ${i}`, duration, channels };
    });

    return { nodes, roots, primitives, materials, images, skin, animations };
}
