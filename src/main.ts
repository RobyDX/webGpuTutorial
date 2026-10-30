import { baseRendering } from "./utility/baseRendering";

//codice delle utility, mostrato in fondo al codice dei tutorial che le utilizzano
import initSource from "./utility/webgpuInit.ts?raw";
import geometrySource from "./utility/geometry.ts?raw";
import gltfSource from "./utility/gltf.ts?raw";

//per ogni utility: come riconoscere che un tutorial la usa, il nome del file ed il suo codice
const utilities = [
    { marker: "initWebGpu(", file: "utility/webgpuInit.ts", source: initSource },
    { marker: "utility/geometry", file: "utility/geometry.ts", source: geometrySource },
    { marker: "utility/gltf", file: "utility/gltf.ts", source: gltfSource },
];

//le classi di tutti i tutorial (tutorial00.ts -> Tutorial00, ...)
const modules = import.meta.glob<Record<string, new () => baseRendering>>(
    "./tutorials/tutorial*.ts", { eager: true });

//il codice sorgente dei tutorial, da mostrare nella textarea
const sources = import.meta.glob<string>(
    "./tutorials/tutorial*.ts", { query: "?raw", import: "default", eager: true });

//le tile della pagina, una per tutorial
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.tile[data-tutorial]"));

const prevButton = document.querySelector<HTMLButtonElement>("#prev")!;
const nextButton = document.querySelector<HTMLButtonElement>("#next")!;

let t: baseRendering | null = null;

//ricava la descrizione di un tutorial dal commento all'inizio del suo codice e la mostra sotto il pannello.
//Nel commento: le righe vuote separano i paragrafi, le righe che iniziano con "-" o con "1)" sono elenchi
//(le righe più rientrate continuano la voce precedente), i paragrafi che iniziano con "NOTA:" non vengono mostrati.
function showAbout(code: string) {
    const about = document.querySelector<HTMLElement>("#about")!;
    const container = document.querySelector<HTMLElement>("#about-text")!;
    container.replaceChildren();

    const header = code.match(/\/\*\*([\s\S]*?)\*\//);
    if (!header) {
        about.hidden = true;
        return;
    }

    //righe del commento senza gli asterischi; la prima riga non vuota è il titolo, già mostrato nel pannello
    const lines = header[1].split("\n").map(l => l.replace(/^\s*\* ?/, "").replace(/\s+$/, ""));
    const firstLine = lines.findIndex(l => l !== "");
    const blocks: string[][] = [[]];
    for (const line of lines.slice(firstLine + 1)) {
        if (line === "") {
            blocks.push([]);
        } else {
            blocks[blocks.length - 1].push(line);
        }
    }

    for (const block of blocks) {
        if (block.length === 0 || block[0].startsWith("NOTA:")) {
            continue;
        }

        let list: HTMLUListElement | null = null;
        let item: HTMLElement | null = null;
        let paragraph: HTMLElement | null = null;

        for (const line of block) {
            const bullet = line.trim().match(/^(-|\d+\))\s+(.*)$/);
            if (bullet) {
                //nuova voce di un elenco
                if (!list) {
                    list = document.createElement("ul");
                    container.appendChild(list);
                }
                const li = document.createElement("li");
                const marker = document.createElement("span");
                marker.className = "marker";
                marker.textContent = bullet[1] === "-" ? "•" : bullet[1];
                item = document.createElement("span");
                item.textContent = bullet[2];
                li.append(marker, item);
                list.appendChild(li);
                paragraph = null;
            } else if (item && /^\s/.test(line)) {
                //riga rientrata: continua la voce precedente
                item.textContent += " " + line.trim();
            } else {
                //testo normale: le righe consecutive formano un unico paragrafo
                if (!paragraph) {
                    paragraph = document.createElement("div");
                    container.appendChild(paragraph);
                    list = null;
                    item = null;
                }
                paragraph.textContent += (paragraph.textContent ? " " : "") + line.trim();
            }
        }
    }

    about.hidden = container.childElementCount === 0;
}

//carica un tutorial: ferma quello precedente, mostra il codice, esegue init e avvia il rendering
async function load(link: HTMLAnchorElement) {
    const n = link.getAttribute("data-tutorial")!;

    //pannello con numero, titolo e descrizione del tutorial
    document.querySelector("#tutorial-number")!.textContent = `Tutorial ${link.dataset.number}`;
    document.querySelector("#canvas-caption")!.textContent = `${link.dataset.number} · ${link.querySelector(".tile-name")!.textContent}`;
    document.querySelector("#tutorial-title")!.textContent = link.querySelector(".tile-name")!.textContent;
    document.querySelector("#tutorial-description")!.textContent = link.dataset.description ?? "";

    //il pannello assume il colore della categoria del tutorial
    document.querySelector<HTMLElement>(".panel")!.style.setProperty("--accent", getComputedStyle(link).getPropertyValue("--accent"));

    //evidenzia la tile selezionata e aggiorna i pulsanti avanti/indietro
    links.forEach(l => {
        l.classList.toggle("active", l === link);
        l.toggleAttribute("aria-current", l === link);
    });
    const index = links.indexOf(link);
    prevButton.disabled = index <= 0;
    nextButton.disabled = index >= links.length - 1;

    //il primo paragrafo della pagina (#info) è quello in cui i tutorial scrivono i propri messaggi
    document.querySelector("p")!.innerHTML = "";
    document.querySelector("canvas")!.onclick = () => { };

    if (t) {
        const previous = t;
        t = null;
        await previous.destroy();
    }

    const path = `./tutorials/tutorial${n}.ts`;
    let code = sources[path];
    showAbout(code);
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

//seleziona un tutorial: aggiorna l'indirizzo (così si può condividere il link) e lo carica
function select(link: HTMLAnchorElement, scroll: boolean) {
    history.replaceState(null, "", "#" + link.dataset.tutorial);
    if (scroll) {
        //riporta in alto, dove si trova la canvas
        document.querySelector("#viewer")!.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    queue = queue.then(() => load(link));
}

links.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        select(link, true);
    });
});

//pulsanti per passare al tutorial precedente o successivo
const current = () => links.findIndex(l => l.classList.contains("active"));
prevButton.addEventListener("click", () => select(links[current() - 1], false));
nextButton.addEventListener("click", () => select(links[current() + 1], false));

//se l'indirizzo cambia a mano (o con i pulsanti del browser) si carica il tutorial indicato
window.addEventListener("hashchange", () => {
    const link = links.find(l => l.dataset.tutorial === location.hash.replace("#", ""));
    if (link && !link.classList.contains("active")) {
        select(link, false);
    }
});

//pulsante sulla canvas: nasconde il pannello e la descrizione per dare più spazio alla canvas.
//La scelta viene ricordata dal browser (se localStorage non è disponibile semplicemente non viene salvata)
const viewer = document.querySelector<HTMLElement>("#viewer")!;
const toggleButton = document.querySelector<HTMLButtonElement>("#toggle-side")!;

function setFocus(on: boolean, save: boolean) {
    viewer.classList.toggle("focus", on);
    toggleButton.setAttribute("aria-pressed", String(on));
    toggleButton.textContent = on ? "⤡ Mostra pannello" : "⤢ Nascondi pannello";
    if (save) {
        try {
            localStorage.setItem("viewerFocus", on ? "1" : "0");
        } catch { }
    }
}

toggleButton.addEventListener("click", () => {
    setFocus(!viewer.classList.contains("focus"), true);
    //la canvas cambia dimensione: la si riporta in vista
    viewer.scrollIntoView({ block: "start" });
});

try {
    setFocus(localStorage.getItem("viewerFocus") === "1", false);
} catch {
    setFocus(false, false);
}

//pulsante fisso: porta al codice del tutorial, e quando si è nel codice riporta in alto alla canvas
const jumpButton = document.querySelector<HTMLButtonElement>("#jump")!;
const codeSection = document.querySelector<HTMLDetailsElement>("#code")!;
const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

//si considera "nel codice" quando l'inizio della sezione del codice è nella metà alta della finestra
const inCode = () => codeSection.getBoundingClientRect().top < window.innerHeight * 0.5;

function updateJumpButton() {
    jumpButton.innerHTML = inCode() ? "&uarr; Torna al tutorial" : "&darr; Vai al codice";
}

jumpButton.addEventListener("click", () => {
    if (inCode()) {
        document.querySelector("#viewer")!.scrollIntoView({ behavior: smooth, block: "start" });
    } else {
        codeSection.open = true;
        codeSection.scrollIntoView({ behavior: smooth, block: "start" });
    }
});

window.addEventListener("scroll", updateJumpButton, { passive: true });
window.addEventListener("resize", updateJumpButton);
updateJumpButton();

//tutorial mostrato all'avvio: quello indicato nell'indirizzo (es. #21), altrimenti il tutorial 08
const start = location.hash.replace("#", "");
select(links.find(l => l.dataset.tutorial === start) ?? links.find(l => l.dataset.tutorial === "08")!, false);
