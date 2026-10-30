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
 * Questo caricatore è volutamente minimale: legge la prima mesh del file (posizioni, normali, coordinate
 * texture e indici) e ignora materiali, animazioni e trasformazioni dei nodi.
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
    SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4,
};

/**
 * Scarica un file .glb o .gltf e ne estrae la prima mesh.
 */
export async function loadGltf(url: string): Promise<Mesh> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`impossibile caricare il modello ${url}`);
    }

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
        const base = url.substring(0, url.lastIndexOf("/") + 1);
        for (const b of json.buffers) {
            const bufferResponse = await fetch(b.uri.startsWith("data:") ? b.uri : base + b.uri);
            buffers.push(await bufferResponse.arrayBuffer());
        }
    }

    //legge un accessor e restituisce i suoi dati come array di numeri già convertiti
    const readAccessor = (index: number): { data: ArrayLike<number>, components: number, count: number } => {
        const accessor = json.accessors[index];
        const bufferView = json.bufferViews[accessor.bufferView];
        const component = COMPONENT_TYPES[accessor.componentType];
        const components = TYPE_COMPONENTS[accessor.type];

        const buffer = buffers[bufferView.buffer ?? 0];
        const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

        //byteStride indica la distanza tra due elementi consecutivi, se i dati sono interlacciati con altri
        const stride = bufferView.byteStride ?? components * component.size;

        if (stride === components * component.size) {
            //dati contigui: si può leggere direttamente
            return {
                data: new component.array(buffer.slice(byteOffset, byteOffset + accessor.count * stride)),
                components,
                count: accessor.count
            };
        }

        //dati interlacciati: si copia un elemento alla volta
        const result = new component.array(accessor.count * components);
        const view = new DataView(buffer);
        for (let i = 0; i < accessor.count; i++) {
            for (let c = 0; c < components; c++) {
                result[i * components + c] = component.read(view, byteOffset + i * stride + c * component.size);
            }
        }
        return { data: result, components, count: accessor.count };
    };

    const primitive = json.meshes?.[0]?.primitives?.[0];
    if (!primitive || primitive.attributes.POSITION === undefined) {
        throw new Error("il modello non contiene una mesh con posizioni");
    }

    const positions = readAccessor(primitive.attributes.POSITION);
    const normals = primitive.attributes.NORMAL !== undefined ? readAccessor(primitive.attributes.NORMAL) : null;
    const uvs = primitive.attributes.TEXCOORD_0 !== undefined ? readAccessor(primitive.attributes.TEXCOORD_0) : null;

    //composizione dei vertici nel formato usato dai tutorial: posizione, normale, uv (8 float)
    const vertices = new Float32Array(positions.count * 8);
    for (let i = 0; i < positions.count; i++) {
        for (let c = 0; c < 3; c++) {
            vertices[i * 8 + c] = positions.data[i * 3 + c];
            vertices[i * 8 + 3 + c] = normals ? normals.data[i * 3 + c] : 0;
        }
        vertices[i * 8 + 6] = uvs ? uvs.data[i * 2] : 0;
        vertices[i * 8 + 7] = uvs ? uvs.data[i * 2 + 1] : 0;
    }

    //gli indici possono essere a 8, 16 o 32 bit: li convertiamo sempre a 32 bit
    let indices: Uint32Array;
    if (primitive.indices !== undefined) {
        indices = Uint32Array.from(readAccessor(primitive.indices).data);
    } else {
        //mesh senza indici: i vertici sono già in ordine
        indices = Uint32Array.from({ length: positions.count }, (_, i) => i);
    }

    return { vertices, indices };
}
