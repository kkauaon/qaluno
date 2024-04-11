export function randomHexColor(): string {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 50 + Math.floor(Math.random() * 40)
    const luminosity = 25 + Math.floor(Math.random() * 40)
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
        return "green"
    } else if (num < 8 && num > 5.9) {
        return "gold"
    } else if (num < 6) {
        return "red"
    } else {
        return "blue"
    }
}

export const corNotaTexto = (num: number): string => {

    if (num > 7.9) {
        return "white"
    } else if (num < 8 && num > 5.9) {
        return "black"
    } else if (num < 6) {
        return "white"
    } else {
        return "blue"
    }
}

export const DEFAULT_SEMESTRE = "2024.1"
export const QACADEMICO_BASE_URL = 'https://novo.qacademico.ifce.edu.br'
export const APP_VERSION = 3;