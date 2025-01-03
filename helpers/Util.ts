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

export const DEFAULT_SEMESTRE = "2024.2"
export const QACADEMICO_BASE_URL = 'https://novo.qacademico.ifce.edu.br'
export const APP_VERSION = 5;