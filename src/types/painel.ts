import type { TipoMedida } from './sensor'

export type StatusCultivo = 'normal' | 'atencao' | 'sem_dados' | 'sem_faixa'
export type IntervaloSerie = 'hour' | 'day'

/** GET /painel */
export type Painel = {
  resumo: {
    propriedades: number
    lotes_em_cultivo: number
    area_em_cultivo_ha: number
    sensores_total: number
    sensores_ativos: number
    leituras_24h: number
  }
  culturas: {
    cultura: { id: number; nome: string; variedade: string | null }
    lotes: number
    area_ha: number
    status: StatusCultivo
    motivo: string | null
  }[]
  proxima_colheita: {
    lote: { id: number; nome: string }
    propriedade: string
    cultura: { nome: string; variedade: string | null }
    previsao: string
    /** negativo = atrasada */
    dias: number
  } | null
  alertas: {
    nao_lidos: number
    recentes: {
      id: number
      mensagem: string
      data_hora: string | null
      lote: string
    }[]
  }
  tipos: { tipo: TipoMedida; unidade: string | null }[]
}

export type Serie = {
  sensor: string
  lote: string | null
  pontos: { instante: string; valor: number }[]
}

/** GET /painel/serie */
export type SerieResposta = {
  tipo: TipoMedida
  intervalo: IntervaloSerie
  unidade: string | null
  series: Serie[]
}

/** GET /painel/leituras */
export type RespostaLeituras = {
  limite: number
  /** há mais leituras no período do que as devolvidas */
  cortado?: boolean
  leituras: {
    sensor: string
    lote: string | null
    dado: string
    unidade: string | null
    data_hora: string
    valor: number
  }[]
}
