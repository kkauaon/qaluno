import RSAKeyPair, { encryptedString } from './RSA.js';

import CookieManager from '@react-native-cookies/cookies';
import { IAluno, IAula, IAvaliacao, IDiario, IHorarioIndividual, IMaterialDeAula, IMaterialDeAulaDownloadResponse } from './APITypes.ts';

export function Login(matricula: string, senha: string): Promise<IAluno> {

    return new Promise((res, rej) => {
        CookieManager.removeSessionCookies().then(() => {
            fetch("https://antigo.qacademico.ifce.edu.br/qacademico/lib/rsa/gerador_chaves_rsa.asp", {
                method: "GET"
            }).then(r => r.text()).then(r => {
                let datas = r.split('\r\n')

                // @ts-ignore: Object is possibly 'null'.
                let d1 = datas[1].trim().match(/([a-z0-9]+)/g)[0]
                // @ts-ignore: Object is possibly 'null'.
                let d2 = datas[3].trim().match(/([a-z0-9]+)/g)[0]
                
                console.log(d1,d2)
                const key  = new RSAKeyPair(d1, "", d2)

                const submit = encryptedString(key, "OK")
                const login = encryptedString(key, matricula)
                const senhae = encryptedString(key, senha)
                const tipo = encryptedString(key, "1")

                const data = new URLSearchParams()
                data.append("Submit", submit)
                data.append("LOGIN", login)
                data.append("SENHA", senhae)
                data.append("TIPO_USU", tipo)
                console.log(data.toString())
                fetch("https://antigo.qacademico.ifce.edu.br/qacademico/lib/validalogin.asp?"+data.toString(), {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    }
                }).then(r => r.text()).then(z => {
                    if (z.includes("Acesso negado")) rej("Acesso negado")
                    else
                        fetch('https://antigo.qacademico.ifce.edu.br/webapp/api/autenticacao/usuario-autenticado').then(r => r.json()).then(usuario => {   
                            if ((usuario as IAluno).idPessoa)    
                                res(usuario as IAluno)
                            else rej("Acesso negado")
                        }).catch(rej)
                }).catch(rej)
            }).catch(rej)
        }).catch(rej)
    })
    
}

export function Boletim(ano: string, semestre: string): Promise<IDiario[]> {
    return new Promise((res,rej)=> {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/boletim/disciplinas?anoLetivo=${ano}&periodoLetivo=${semestre}`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IDiario[])
            else
                res([])
        }).catch(rej)
    })
}

export function HorarioIndividual(ano: string, semestre: string): Promise<IHorarioIndividual> {
    return new Promise((res, rej) => {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/horario-individual/obter-horario?anoLet=${ano}&periodoLet=${semestre}`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IHorarioIndividual)
            else
                res({diaDaSemana: 1, hoje: "", horarios: []})
        }).catch(rej)
    })
}

export function Avaliacoes(diario: number): Promise<IAvaliacao[]> {
    return new Promise((res, rej) => {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/diarios/aluno/diarios/${diario}/avaliacoes`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IAvaliacao[])
            else
                res([])
        }).catch(rej)
    })
}

export function ListarAulas(diario: number): Promise<IAula[]> {
    return new Promise((res, rej) => {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/diarios/aluno/diarios/${diario}/aulas`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IAula[])
            else
                res([])
        }).catch(rej)
    })    
}

export function MaterialDeAula(diario: number): Promise<IMaterialDeAula[]> {
    return new Promise((res, rej) => {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/diarios/aluno/diarios/${diario}/materiais-de-aula`).then(r => r.json())
        .then(r => {
            if (r)
                res(r as IMaterialDeAula[])
            else
                res([])
        }).catch(rej)
    })
}

export function LinkMaterialDeAula(material: number): Promise<string> {
    return new Promise((res, rej) => {
        fetch(`https://antigo.qacademico.ifce.edu.br/webapp/api/materiais-de-aula/aluno/download?idMaterialAula=${material}`).then(r => r.json())
        .then(r => {
            if (r) {
                const download = r as IMaterialDeAulaDownloadResponse

                res(`https://antigo.qacademico.ifce.edu.br/webapp/download/${download.id}/${download.nome}`)
            }
            else
                rej("")
        }).catch(rej)
    })
}