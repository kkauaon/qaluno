import { MateriaisDeAulaRecentes } from "../api/API";
import { IMaterialDeAula, IMaterialDeAulaRecente } from "../api/APITypes";
import MMKV from "../api/Database";

// refactor to randomColor();
export function randomHexColor(): string {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 90 + Math.floor(Math.random() * 10)
    const luminosity = 70 + Math.floor(Math.random() * 10)
    return `hsl(${hue}, ${saturation}%, ${luminosity}%)`
};

export function escalarNota(nota: number, escalaOriginalMax: number, escalaDesejadaMax: number): number {
    const notaNaEscalaOriginal = Math.min(Math.max(nota, 1), escalaOriginalMax);
  
    const notaNaEscalaDesejada = (notaNaEscalaOriginal / escalaOriginalMax) * escalaDesejadaMax;
  
    return notaNaEscalaDesejada;
}

export function compararDatas(a: string, b: string): number {
    var dataA = new Date(a);
    var dataB = new Date(b);

    if (dataA < dataB) {
        return -1;
    } else if (dataA > dataB) {
        return 1;
    } else {
        return 0;
    }
}

export const corNota = (num: number): string => {
    if (num > 7.9) {
        return "#a1fb8d"
    } else if (num < 8 && num > 5.9) {
        return "#feec8a"
    } else if (num < 6) {
        return "#ff8989"
    } else {
        return "#16c946"
    }
}

export const corNotaTexto = (num: number): string => {

    if (num > 7.9) {
        return "#0e4502"
    } else if (num < 8 && num > 5.9) {
        return "#463c00"
    } else if (num < 6) {
        return "#470000"
    } else {
        return "#16c94615"
    }
}

export const verificarMaterialNovo = (): IMaterialDeAulaRecente[] => {
    const materiaisNovos: IMaterialDeAulaRecente[] = [];

    MateriaisDeAulaRecentes().then(materiais => {
        materiais.forEach(m => {
            const registrados = JSON.parse(MMKV.getString(`materiais.${m.idPauta}`)||"[]") as IMaterialDeAula[]

            if (!registrados.some(m2 => m2.id == m.id)) {
                materiaisNovos.push(m);

                registrados.push(convertMaterialDeAulaRecenteToMaterialDeAula(m))
                MMKV.set(`materiais.${m.idPauta}`, JSON.stringify(registrados));
            }
        })
    }).catch(err => {
        return materiaisNovos;
    })

    return materiaisNovos;
}

export const convertMaterialDeAulaRecenteToMaterialDeAula = (m: IMaterialDeAulaRecente): IMaterialDeAula => {
    return {
        data: m.dataMaterialAula,
        descricao: m.descricao,
        id: m.id,
        linkExterno: m.linkExterno,
        nomeArquivo: m.arquivo,
        tipoMaterialAula: m.tipoMaterialAula
    }
}

export const normalizeName = (name: string): string => {
    let wordsCapitalize = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
    let wordsNotCapitalize = ["a", "de", "e", "da", "do"]

    let words = name.split(" ")
    // @ts-ignore ???
    words = words.map(w => wordsCapitalize.some(wf => wf == w.toLowerCase()) ? w : wordsNotCapitalize.some(wf2 => wf2 == w.toLowerCase()) ? wordsNotCapitalize.find(wf3 => wf3 == w.toLowerCase()) : w.toLowerCase().charAt(0).toUpperCase() + w.toLowerCase().slice(1))
    
    return words.join(" ")
}

export const DEFAULT_SEMESTRE = "2026.1"
export const QACADEMICO_BASE_URL = 'https://antigo.qacademico.ifce.edu.br'
export const APP_VERSION = 7;