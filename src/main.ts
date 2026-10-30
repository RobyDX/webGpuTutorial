import { baseRendering } from "./utility/baseRendering";

//codice delle utility, mostrato in fondo al codice dei tutorial che le utilizzano
import initSource from "./utility/webgpuInit.ts?raw";
import geometrySource from "./utility/geometry.ts?raw";
import gltfSource from "./utility/gltf.ts?raw";

//per ogni utility: come riconoscere che un tutorial la usa, il nome del file ed il suo codice
const utilities = [
    { marker: "initWebGpu(", file: "utility/webgpuInit.ts", source: initSource },
    { marker: "utility/geometry", file: "utility/geometry.ts", source: geometrySource },
    { marker: "loadGltf(", file: "utility/gltf.ts", source: gltfSource },
];

//le classi di tutti i tutorial (tutorial00.ts -> Tutorial00, ...)
const modules = import.meta.glob<Record<string, new () => baseRendering>>(
    "./tutorials/tutorial*.ts", { eager: true });

//il codice sorgente dei tutorial, da mostrare nella textarea
const sources = import.meta.glob<string>(
    "./tutorials/tutorial*.ts", { query: "?raw", import: "default", eager: true });

const links = document.querySelectorAll<HTMLAnchorElement>("ol li a");

let t: baseRendering | null = null;

//carica un tutorial: ferma quello precedente, mostra il codice, esegue init e avvia il rendering
async function load(link: HTMLAnchorElement) {
    const n = link.getAttribute("data-tutorial")!;

    document.querySelector("#tutorial-title")!.innerHTML = link.title;
    document.querySelector("p")!.innerHTML = "";
    document.querySelector("canvas")!.onclick = () => { };

    if (t) {
        const previous = t;
        t = null;
        await previous.destroy();
    }

    const path = `./tutorials/tutorial${n}.ts`;
    let code = sources[path];
    for (const u of utilities) {
        if (code.includes(u.marker)) {
            code += "\n\n// ------------------------------------------------------------\n" +
                `// ${u.file} (codice usato sopra)\n` +
                "// ------------------------------------------------------------\n\n" + u.source;
        }
    }
    document.querySelector<HTMLTextAreaElement>("#codetxt")!.value = code;

    const tutorial = new modules[path][`Tutorial${n}`]();
    try {
        await tutorial.init();
        t = tutorial;
        tutorial.draw();
    } catch (e) {
        //init non riuscita (browser non compatibile, risorsa mancante...): niente rendering
        console.error(e);
        alert(e instanceof Error ? e.message : String(e));
    }
}

//i click vengono eseguiti uno alla volta, così un tutorial non parte mentre il precedente è ancora in chiusura
let queue: Promise<void> = Promise.resolve();

links.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        queue = queue.then(() => load(link));
    });
});

//tutorial mostrato all'avvio: quello indicato nell'indirizzo (es. #21), altrimenti il tutorial 08
const start = location.hash.replace("#", "");
(document.querySelector<HTMLAnchorElement>(`ol li a[data-tutorial="${start}"]`)
    ?? document.querySelector<HTMLAnchorElement>('ol li a[data-tutorial="08"]'))!.click();
