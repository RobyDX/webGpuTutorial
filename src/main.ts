import { baseRendering } from "./utility/baseRendering";
import { Tutorial00 } from "./tutorials/tutorial00";
import { Tutorial01 } from "./tutorials/tutorial01";
import { Tutorial02 } from "./tutorials/tutorial02";
import { Tutorial03 } from "./tutorials/tutorial03";
import { Tutorial04 } from "./tutorials/tutorial04";
import { Tutorial05 } from "./tutorials/tutorial05";
import { Tutorial06 } from "./tutorials/tutorial06";
import { Tutorial07 } from "./tutorials/tutorial07";
import { Tutorial08 } from "./tutorials/tutorial08";
import { Tutorial09 } from "./tutorials/tutorial09";
import { Tutorial10 } from "./tutorials/tutorial10";
import { Tutorial11 } from "./tutorials/tutorial11";
import { Tutorial12 } from "./tutorials/tutorial12";
import { Tutorial13 } from "./tutorials/tutorial13";
import { Tutorial14 } from "./tutorials/tutorial14";
import { Tutorial15 } from "./tutorials/tutorial15";
import { Tutorial16 } from "./tutorials/tutorial16";
import { Tutorial17 } from "./tutorials/tutorial17";
import { Tutorial18 } from "./tutorials/tutorial18";

let t: baseRendering = null!;

const links = document.querySelectorAll<HTMLAnchorElement>("ol li a");

const files = import.meta.glob(
    [
        "./tutorials/tutorial00.ts",
        "./tutorials/tutorial01.ts",
        "./tutorials/tutorial02.ts",
        "./tutorials/tutorial03.ts",
        "./tutorials/tutorial04.ts",
        "./tutorials/tutorial05.ts",
        "./tutorials/tutorial06.ts",
        "./tutorials/tutorial07.ts",
        "./tutorials/tutorial08.ts",
        "./tutorials/tutorial09.ts",
        "./tutorials/tutorial10.ts",
        "./tutorials/tutorial11.ts",
        "./tutorials/tutorial12.ts",
        "./tutorials/tutorial13.ts",
        "./tutorials/tutorial14.ts",
        "./tutorials/tutorial15.ts",
        "./tutorials/tutorial16.ts",
        "./tutorials/tutorial17.ts",
        "./tutorials/tutorial18.ts",
    ]
    , { as: "raw", eager: true });

links.forEach(link => {
    link.addEventListener("click", async (event) => {
        event.preventDefault();
        document.querySelector("h7")!.innerHTML = link.title;
        document.querySelector("p")!.innerHTML = "";
        document.querySelector("canvas")!.onclick = () => { };
        let n = link.getAttribute("data-tutorial");

        if (t) {
            await t.destroy();
        }

        switch (n) {
            case "00":
                t = new Tutorial00();
                break;
            case "01":
                t = new Tutorial01();
                break;
            case "02":
                t = new Tutorial02();
                break;
            case "03":
                t = new Tutorial03();
                break;
            case "04":
                t = new Tutorial04();
                break;
            case "05":
                t = new Tutorial05();
                break;
            case "06":
                t = new Tutorial06();
                break;
            case "07":
                t = new Tutorial07();
                break;
            case "08":
                t = new Tutorial08();
                break;
            case "09":
                t = new Tutorial09();
                break;
            case "10":
                t = new Tutorial10();
                break;
            case "11":
                t = new Tutorial11();
                break;
            case "12":
                t = new Tutorial12();
                break;
            case "13":
                t = new Tutorial13();
                break;
            case "14":
                t = new Tutorial14();
                break;
            case "15":
                t = new Tutorial15();
                break;
            case "16":
                t = new Tutorial16();
                break;
            case "17":
                t = new Tutorial17();
                break;
            case "18":
                t = new Tutorial18();
                break;
        }

        document.querySelector<HTMLTextAreaElement>("#codetxt")!.value = files["./tutorials/tutorial" + n + ".ts"];
        t.init().then(() => t.draw());
    });
});

links[8].click();

