In questo repository potete trovare un set di tutorial relativo a WebGPU, la nuova API per la realizzazione di applicazioni grafiche ad alte prestazioni all'interno del browser, descritti nella sezione WebGPU del mio blog
https://www.notjustcode.org

Demo al link
https://webgpu.notjustcode.org/

Requisiti
- Node.js 20 o superiore
- Un browser con supporto WebGPU (Chrome/Edge, Firefox e Safari nelle versioni recenti). Il supporto dipende anche da sistema operativo e scheda video: se la pagina segnala che il browser non è compatibile, verificate su https://caniuse.com/webgpu
- Il tutorial 18 (Query Set, tutorial17.ts) richiede la funzionalità "timestamp-query", non disponibile su tutti i dispositivi

Guida
Scaricate il repository
Lanciate il comando npm i per installare i repository
Eseguite il comando npm run dev per avviare i tutorial.
Per generare la versione pubblicabile: npm run build

Struttura
- src/tutorials/tutorialNN.ts: un file per ogni tutorial. Il numero del file parte da 00, quindi "1) Inizializza Web GPU" è tutorial00.ts
- src/utility/geometry.ts e gltf.ts: generazione di forme con le normali e caricamento di modelli glTF (file tutorial20.ts, tutorial21.ts e tutorial22.ts)
- public/soldier.glb: personaggio con scheletro e animazione, usato da tutorial23.ts (caricato da utility/gltf.ts)
- scripts/createModel.cjs: genera il modello public/model.glb usato da tutorial22.ts
- src/utility/webgpuInit.ts: dal tutorial 03 l'inizializzazione di WebGPU (già vista per esteso nei tutorial 00, 01 e 02) è raccolta in un'unica funzione
- Il sito viene pubblicato su GitHub Pages dal workflow .github/workflows/deploy.yml


 1) Inizializza Web GPU
 2) Render Target
 3) Shaders
 4) Vertex Buffer
 5) Index Buffer
 6) Uniform Buffer
 7) Depth Buffer
 8) Matrici di Trasformazione
 9) Texture
10) Render Bundle
11) Geometry Instancing
12) MSAA
13) Render to Texture
14) Utilizzo di Video
15) Compute Shader
16) Sobel Filter
17) Stencil Buffer
18) Query Set
19) Testo su una Texture
20) Mipmap
21) Illuminazione
22) Shadow Map
23) Modelli glTF
24) Animazioni

Buona lettura
