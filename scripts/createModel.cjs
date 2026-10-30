/**
 * Genera public/model.glb, il modello usato dal tutorial 22 (glTF): un nodo toroidale (torus knot).
 * Il file è un glTF binario (.glb) con posizioni, normali, coordinate texture e indici.
 *
 * Uso: node scripts/createModel.cjs
 */
const fs = require('fs');

const SEGMENTS = 256;   //suddivisioni lungo la curva
const SIDES = 24;       //suddivisioni attorno al tubo
const TUBE_RADIUS = 0.18;

//curva del nodo (p=2, q=3), di dimensione circa 1
function curve(t) {
    const p = 2, q = 3;
    const r = 0.5 + 0.25 * Math.cos(q * t);
    return [r * Math.cos(p * t), 0.25 * Math.sin(q * t), r * Math.sin(p * t)];
}
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };

const positions = [], normals = [], uvs = [], indices = [];
const e = 0.001;

for (let i = 0; i <= SEGMENTS; i++) {
    const t = (i / SEGMENTS) * Math.PI * 2;
    const c = curve(t);
    const tangent = norm(sub(curve(t + e), curve(t - e)));
    //N punta verso il centro della curvatura, B è perpendicolare a entrambi
    const n = norm(curve(t + e).map((v, k) => v + curve(t - e)[k] - 2 * c[k]));
    const b = norm(cross(tangent, n));

    for (let j = 0; j <= SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2;
        const dir = [0, 1, 2].map(k => Math.cos(a) * n[k] + Math.sin(a) * b[k]);
        positions.push(...[0, 1, 2].map(k => c[k] + TUBE_RADIUS * dir[k]));
        normals.push(...dir);
        uvs.push(i / SEGMENTS * 6, j / SIDES);
    }
}

const row = SIDES + 1;
for (let i = 0; i < SEGMENTS; i++) {
    for (let j = 0; j < SIDES; j++) {
        const a = i * row + j, b = a + row;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
}

const posArray = new Float32Array(positions);
const normArray = new Float32Array(normals);
const uvArray = new Float32Array(uvs);
const idxArray = new Uint32Array(indices);

//un unico buffer binario con i 4 blocchi di dati uno dopo l'altro
const parts = [posArray, normArray, uvArray, idxArray].map(a => Buffer.from(a.buffer));
const bin = Buffer.concat(parts);
const offsets = []; let o = 0;
for (const p of parts) { offsets.push(o); o += p.length; }

const min = [0, 1, 2].map(k => Math.min(...positions.filter((_, i) => i % 3 === k)));
const max = [0, 1, 2].map(k => Math.max(...positions.filter((_, i) => i % 3 === k)));

const json = {
    asset: { version: "2.0", generator: "scripts/createModel.cjs" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, mode: 4 }] }],
    accessors: [
        { bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3", min, max },
        { bufferView: 1, componentType: 5126, count: normals.length / 3, type: "VEC3" },
        { bufferView: 2, componentType: 5126, count: uvs.length / 2, type: "VEC2" },
        { bufferView: 3, componentType: 5125, count: indices.length, type: "SCALAR" },
    ],
    bufferViews: parts.map((p, i) => ({ buffer: 0, byteOffset: offsets[i], byteLength: p.length, target: i === 3 ? 34963 : 34962 })),
    buffers: [{ byteLength: bin.length }],
};

//i chunk del glb devono essere multipli di 4 byte (il JSON viene completato con spazi)
let jsonBuf = Buffer.from(JSON.stringify(json));
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - jsonBuf.length % 4) % 4, 0x20)]);
const binBuf = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4, 0)]);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546C67, 0);    //"glTF"
header.writeUInt32LE(2, 4);             //versione
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);

const chunk = (type, data) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(data.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, data]);
};

fs.writeFileSync('public/model.glb', Buffer.concat([header, chunk(0x4E4F534A, jsonBuf), chunk(0x004E4942, binBuf)]));
console.log(`public/model.glb: ${positions.length / 3} vertici, ${indices.length / 3} triangoli`);
