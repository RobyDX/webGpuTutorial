/**
 * Inizializzazione WebGPU (utility)
 *
 * Nei primi tutorial (00, 01 e 02) l'inizializzazione viene scritta per esteso,
 * passo per passo, per capire cosa succede.
 * Dal tutorial 03 in poi gli stessi identici passi sono raccolti in questa funzione,
 * così ogni tutorial può concentrarsi solo sull'argomento nuovo.
 */

export interface WebGpuContext {
    //device, l'oggetto incaricato di creare e gestire le risorse
    device: GPUDevice;

    //canvas della pagina su cui avviene il rendering
    canvas: HTMLCanvasElement;

    //contesto di rendering associato alla canvas
    context: GPUCanvasContext;

    //formato dei pixel della canvas
    format: GPUTextureFormat;
}

/**
 * Esegue i passi visti nel tutorial 00:
 * 1) richiede adapter e device
 * 2) individua la canvas e ne ottiene il contesto webgpu
 * 3) configura il contesto con il formato preferito dal sistema
 *
 * @param requiredFeatures funzionalità opzionali richieste al device (es. 'timestamp-query').
 *        Se l'adapter non le supporta viene generato un errore comprensibile.
 * @throws Error con un messaggio da mostrare all'utente se qualcosa non è disponibile
 */
export async function initWebGpu(requiredFeatures: GPUFeatureName[] = []): Promise<WebGpuContext> {
    //ottengo l'adapter, che rappresenta la scheda video
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error("browser o dispositivo non compatibile con WebGPU");
    }

    //le funzionalità opzionali non sono disponibili ovunque, vanno verificate prima di richiederle
    for (const feature of requiredFeatures) {
        if (!adapter.features.has(feature)) {
            throw new Error(`il dispositivo non supporta la funzionalità WebGPU "${feature}"`);
        }
    }

    //ottengo il device associato alla scheda video
    const device = await adapter.requestDevice({ requiredFeatures });

    //segnala in console la perdita del device (driver resettato, scheda rimossa...)
    device.lost.then(info => console.error(`WebGPU device perso: ${info.reason} ${info.message}`));

    //segnala in console gli errori di validazione, altrimenti WebGPU fallirebbe in silenzio
    device.addEventListener("uncapturederror", event =>
        console.error("Errore WebGPU:", (event as GPUUncapturedErrorEvent).error.message));

    //individua la canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error("canvas non presente nella pagina");
    }

    //riceve il context associato alla canvas
    const context = canvas.getContext('webgpu');
    if (!context) {
        throw new Error("impossibile ottenere il contesto webgpu dalla canvas");
    }

    //configura il device associandolo alla canvas usata per il rendering
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    return { device, canvas, context, format };
}

/**
 * Crea uno shader controllando gli errori di compilazione.
 *
 * createShaderModule non lancia eccezioni se il codice WGSL è sbagliato: la pipeline che lo usa
 * risulterebbe semplicemente non valida e la canvas resterebbe vuota.
 * getCompilationInfo() restituisce invece i messaggi del compilatore, con riga e colonna dell'errore.
 *
 * @throws Error con l'elenco degli errori dello shader
 */
export async function createShader(device: GPUDevice, code: string): Promise<GPUShaderModule> {
    const module = device.createShaderModule({ code });

    const info = await module.getCompilationInfo();
    const errors: string[] = [];

    for (const m of info.messages) {
        const text = `riga ${m.lineNum}, colonna ${m.linePos}: ${m.message}`;
        if (m.type === "error") {
            errors.push(text);
        } else {
            console.warn(`Shader - ${m.type} ${text}`);
        }
    }

    if (errors.length > 0) {
        throw new Error("errore nello shader\n" + errors.join("\n"));
    }

    return module;
}
