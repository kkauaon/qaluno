import CookieManager from '@react-native-cookies/cookies';
import { IAluno, IAula, IAvaliacao, IDiario, IHorarioIndividual, IMaterialDeAula, IMaterialDeAulaDownloadResponse, IMaterialDeAulaRecente } from './APITypes.ts';
import { DEFAULT_SEMESTRE, QACADEMICO_BASE_URL } from '../helpers/Util.ts';
import MMKV from "../api/Database.ts";

const ANO = DEFAULT_SEMESTRE.split(".")[0]
const PER = DEFAULT_SEMESTRE.split(".")[1]

export function Login(matricula: string = "", senha: string = ""): Promise<IAluno> {

    return new Promise((res, rej) => {
        CookieManager.removeSessionCookies().then(() => {
            fetch(`${QACADEMICO_BASE_URL}/webapp/api/autenticacao/signin`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    login: matricula,
                    password: senha,
                    tipoUsuario: 1
                })
            }).then(r => r.json()).then((z) => {
                if (!z[""])
                    fetch(`${QACADEMICO_BASE_URL}/webapp/api/autenticacao/usuario-autenticado`).then(r => r.json()).then(usuario => {   
                        if ((usuario as IAluno).idPessoa)    
                            res(usuario as IAluno)
                        else rej("Acesso negado.")
                    }).catch(() => rej("Falha ao obter usuário."))
                else rej(z[""][0])
            }).catch(() => rej("Falha no login."))
        }).catch(() => rej("Falha."))
    })
    
}

export function Boletim(ano: string = ANO, semestre: string = PER): Promise<IDiario[]> {
    return new Promise((res,rej)=> {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/boletim/disciplinas?anoLetivo=${ano}&periodoLetivo=${semestre}`).then(r => r.json())
        .then(r => {
            MMKV.set(`verificacoes.${ano}.${semestre}.presencas`, new Date().toLocaleString())

            if (r)
                res(r as IDiario[])
            else
                res([])
        }).catch(rej)
    })
}

export function HorarioIndividual(ano: string = ANO, semestre: string = PER): Promise<IHorarioIndividual> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/horario-individual/obter-horario?anoLet=${ano}&periodoLet=${semestre}`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IHorarioIndividual)
            else
                res({diaDaSemana: 1, hoje: "", horarios: []})
        }).catch(rej)
    })
}

export function Avaliacoes(diario: number = 0): Promise<IAvaliacao[]> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/diarios/aluno/diarios/${diario}/avaliacoes`).then(r => r.json())
        .then(r => {
            MMKV.set(`verificacoes.notas`, new Date().toLocaleString())

            if (r)
                res(r as IAvaliacao[])
            else
                res([])
        }).catch(rej)
    })
}

export function ListarAulas(diario: number = 0): Promise<IAula[]> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/diarios/aluno/diarios/${diario}/aulas`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IAula[])
            else
                res([])
        }).catch(rej)
    })    
}

export function MaterialDeAula(diario: number = 0): Promise<IMaterialDeAula[]> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/diarios/aluno/diarios/${diario}/materiais-de-aula`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IMaterialDeAula[])
            else
                res([])
        }).catch(rej)
    })
}

export function MateriaisDeAulaRecentes(pagina: number = 0): Promise<IMaterialDeAulaRecente[]> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/dashboard/aluno/materiais-de-aula?pagina=${pagina}`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IMaterialDeAulaRecente[])
            else
                res([])
        }).catch(rej)
    })
}

export function LinkMaterialDeAula(material: number = 0): Promise<string> {
    return new Promise((res, rej) => {
        fetch(`${QACADEMICO_BASE_URL}/webapp/api/materiais-de-aula/aluno/download?idMaterialAula=${material}`).then(r => r.json())
        .then(r => {
            if (r) {
                const download = r as IMaterialDeAulaDownloadResponse

                res(`${QACADEMICO_BASE_URL}/webapp/download/${download.id}/${download.nome}`)
            }
            else
                rej("Nenhuma resposta obtida do sistema.")
        }).catch(rej)
    })
}