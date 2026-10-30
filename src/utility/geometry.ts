/**
 * Geometrie di base (utility)
 *
 * Dai tutorial sull'illuminazione in poi i modelli servono con le normali, quindi invece di
 * scrivere a mano i vertici di ogni forma vengono generati da queste funzioni.
 *
 * Ogni vertice è composto da 8 numeri float (32 byte):
 *   posizione (x, y, z) - normale (x, y, z) - coordinate texture (u, v)
 */

export interface Mesh {
    //vertici, 8 float ciascuno: posizione, normale, uv
    vertices: Float32Array;

    //indici dei triangoli
    indices: Uint32Array;
}

//dimensione in byte di un vertice (8 float da 4 byte)
export const VERTEX_STRIDE = 32;

//descrizione del vertex buffer, da inserire nella pipeline (vertex.buffers)
export const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: VERTEX_STRIDE,
    attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },  //posizione
        { shaderLocation: 1, offset: 12, format: 'float32x3' }, //normale
        { shaderLocation: 2, offset: 24, format: 'float32x2' }, //coordinate texture
    ]
};

/**
 * Cubo di lato 1 centrato nell'origine.
 * Ogni faccia ha 4 vertici propri, perché ogni faccia ha una normale diversa.
 */
export function createCube(): Mesh {
    //per ogni faccia: normale e due assi (u e v) che ne descrivono il piano
    const faces = [
        { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
        { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
        { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
        { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
        { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
        { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    ];

    //i 4 angoli di una faccia, espressi come coefficienti degli assi u e v
    const corners = [[-1, -1, 0, 1], [1, -1, 1, 1], [1, 1, 1, 0], [-1, 1, 0, 0]];

    const vertices: number[] = [];
    const indices: number[] = [];

    faces.forEach((f, i) => {
        for (const [a, b, tu, tv] of corners) {
            vertices.push(
                //posizione = centro della faccia + spostamento lungo u e v
                (f.n[0] + f.u[0] * a + f.v[0] * b) * 0.5,
                (f.n[1] + f.u[1] * a + f.v[1] * b) * 0.5,
                (f.n[2] + f.u[2] * a + f.v[2] * b) * 0.5,
                ...f.n,
                tu, tv);
        }
        const o = i * 4;
        indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });

    return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}

/**
 * Sfera di raggio dato centrata nell'origine.
 * La normale di un punto della sfera coincide con la sua posizione normalizzata.
 */
export function createSphere(radius = 0.5, segments = 32): Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y <= segments; y++) {
        const theta = (y / segments) * Math.PI;         //da 0 (polo nord) a PI (polo sud)
        for (let x = 0; x <= segments; x++) {
            const phi = (x / segments) * Math.PI * 2;   //giro completo attorno all'asse Y
            const nx = Math.sin(theta) * Math.cos(phi);
            const ny = Math.cos(theta);
            const nz = Math.sin(theta) * Math.sin(phi);
            vertices.push(nx * radius, ny * radius, nz * radius, nx, ny, nz, x / segments, y / segments);
        }
    }

    //ogni "casella" della griglia diventa 2 triangoli
    const row = segments + 1;
    for (let y = 0; y < segments; y++) {
        for (let x = 0; x < segments; x++) {
            const a = y * row + x;
            const b = a + row;
            indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
    }

    return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}

/**
 * Piano orizzontale (normale verso l'alto) di lato dato, centrato nell'origine.
 * uvRepeat indica quante volte la texture viene ripetuta sul piano.
 */
export function createPlane(size = 10, uvRepeat = 1): Mesh {
    const h = size / 2;
    const vertices = new Float32Array([
        -h, 0, -h, 0, 1, 0, 0, 0,
        h, 0, -h, 0, 1, 0, uvRepeat, 0,
        h, 0, h, 0, 1, 0, uvRepeat, uvRepeat,
        -h, 0, h, 0, 1, 0, 0, uvRepeat,
    ]);
    return { vertices, indices: new Uint32Array([0, 2, 1, 0, 3, 2]) };
}

/**
 * Mesh già caricata sulla GPU: vertex buffer, index buffer e numero di indici.
 */
export interface GpuMesh {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
    destroy(): void;
}

/**
 * Copia i vertici e gli indici di una mesh in due buffer GPU (come visto nei tutorial 03 e 04).
 */
export function createGpuMesh(device: GPUDevice, mesh: Mesh): GpuMesh {
    const vertexBuffer = device.createBuffer({
        size: mesh.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, mesh.vertices);

    const indexBuffer = device.createBuffer({
        size: mesh.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, mesh.indices);

    return {
        vertexBuffer,
        indexBuffer,
        indexCount: mesh.indices.length,
        destroy() {
            vertexBuffer.destroy();
            indexBuffer.destroy();
        }
    };
}
