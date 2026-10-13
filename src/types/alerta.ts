/** GET /alertas */

export type Alerta = {
  id: number
  mensagem: string
  data_hora: string | null
  lido: boolean
  sensor: string | null
  lote: { id: number; nome: string }
  propriedade: { id: number; nome: string }
}

export type AlertasPorLote = {
  lote: { id: number; nome: string }
  propriedade: { id: number; nome: string } | null
  total: number
  nao_lidos: number
}

export type RespostaAlertas = {
  /** total no filtro (a lista traz até `limite`) */
  total: number
  limite: number
  alertas: Alerta[]
  /** lotes que mais geram alertas primeiro */
  por_lote: AlertasPorLote[]
}

export type FiltroAlertas = {
  loteId?: number
  propriedadeId?: number
  /** "AAAA-MM-DD" */
  desde?: string
  ate?: string
  lido?: boolean
  limite?: number
}
