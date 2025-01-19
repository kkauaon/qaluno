export interface IDiario {
    idDiario: number,
    sigla: string,
    descricao: string,
    cargaHoraria: number,
    descricaoPeriodoLetivo: string,
    periodoTurma: number,
    turma: string,
    professor: string|null,
    conceito: string|null,
    avaliacao: string,
    totalAulasDadas: number,
    totalFaltas: number,
    numeroFaltas: number|null,
    percentualFrequencia: string,
    creditos: number,
    situacaoDisciplina: string,
    cargasHorarias: {
        idDiario: number,
        idMatricula: number,
        aulasObrigatorias: number,
        aulasPlanejadas: number,
        aulasRealizadas: number,
        aulasPendentes: number,
        aulasFuturas: number,
        faltas: number,
        faltasAbonadas: number
    },
    etapas: IDiarioEtapa[],
    cor?: string // not used
}

export interface IDiarioEtapa {
    sigla: string,
    descricao: string,
    nota: string|null,
    tipoMedia: string,
    menorUnidade: number,
    tipoAprovacao: string|null
}


export interface IHorarioIndividual {
    diaDaSemana: number,
    hoje: string,
    horarios: IHorario[]
}

export interface IHorario {
    anoLet: number,
    periodoLet: number,
    horaInicio: string,
    horaFinal: string,
    diaSem: number,
    descDiaSem: string,
    idDisciplina: number,
    siglaDisciplina: string,
    descDisciplina: string,
    idProfessor: number,
    idPessoaProfessor: number,
    nomeProfessor: string,
    idSala: number,
    siglaSala: string,
    descSala: string,
    localizacaoSala: string,
    idPlanoEnsino: number,
    siglaTurma: string
}

export interface IAvaliacao {
    descricao: string,
    data: string|null,
    formula: string|null,
    id: number,
    idEtapa: string,
    nota: number|null,
    ordem: number,
    sigla: string,
    corNota: string,
    tipoAvaliacao: number,
    notaMaxima: number,
    possuiCorrecao: boolean,
    dtCorrecao: string|null,
    alertaFormula: string
}

export interface IAula {
    id: number,
    conteudo: string,
    data: string,
    horaInicio: string,
    horaTermino: string,
    numeroDeAulas: number,
    idEtapa: string,
    faltas: number,
    faltasAbonadas: number,
    processada: boolean,
    urlAulaGravada: boolean,
    videosAulaGravada: unknown[],
    statusIcone: number,
    sitAulaMinistrada: number,
    dtAulaMinistrada: string
}

export interface IMaterialDeAula {
    data: string,
    descricao: string,
    id: number,
    nomeArquivo: string,
    tipoMaterialAula: number,
    linkExterno: string|null
}

export interface IMaterialDeAulaRecente {
    id: number,
    idPauta: number,
    idPessoaProfessor: number,
    descricao: string,
    arquivo: string,
    nomeProfessor: string,
    linkExterno: string|null,
    tipoMaterialAula: number,
    dataMaterialAula: string
}

export interface IMaterialDeAulaDownloadResponse {
    id: number,
    nome: string
}

export interface IAluno {
    descCurso: string,
    idClassificado: number,
    idCurso: number,
    idEtapaPedidoMatricula: number,
    idMatricula: number,
    idPedidoMatricula: number,
    idPessoa: number,
    idProfessor: number,
    login: string,
    matricula: string,
    menorDeIdade: boolean,
    nivelEnsino: string,
    nomePessoa: string,
    redefinicaoSenhaObrigatoria: ESimNao,
    sexo: string,
    tipoUsuario: ETipoUsuario,
    webappPedidoMatriculaLiberado: boolean
}

export interface IVersionHistory {
    latest: number
}

export enum ESimNao {
    Sim = 1,
    Nao = 0
}

export enum ETipoUsuario {
    Aluno = 1,
    Professor = 2,
    Empresa = 3,
    TecnicoAdministrativo = 4,
    Egresso = 5,
    PaisDeAluno = 8
}