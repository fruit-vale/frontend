import type { Poligono } from '@/lib/geo'

export type SituacaoLote = 'EM_PREPARO' | 'EM_CULTIVO' | 'COLHIDO'

export const SITUACAO_LABELS: Record<SituacaoLote, string> = {
  EM_PREPARO: 'Em preparo',
  EM_CULTIVO: 'Em cultivo',
  COLHIDO: 'Colhido',
}

export type Lote = {
  id: number
  nome_identificacao: string
  area_ha: number | null
  data_plantio: string | null
  previsao_colheita: string | null
  situacao: SituacaoLote
  geometria: Poligono | null
  propriedade: {
    id: number
    nome: string
    latitude: number | null
    longitude: number | null
  }
  empresa: { id: number; razao_social: string }
  cultura: { id: number; nome: string; variedade: string | null }
  total_sensores: number
  total_alertas: number
  /** safra em andamento (null quando o lote está colhido) */
  safra_atual_id: number | null
  total_safras: number
}

export type LotePayload = {
  nome_identificacao: string
  propriedade_id: number
  cultura_id: number
  data_plantio: string | null
  previsao_colheita: string | null
  situacao: SituacaoLote
  geometria: Poligono | null
  area_ha: number | null
}

/** Uma safra do histórico de cultivo do lote. */
export type Safra = {
  id: number
  cultura: { id: number; nome: string; variedade: string | null }
  data_plantio: string | null
  previsao_colheita: string | null
  data_colheita: string | null
  em_andamento: boolean
  duracao_dias: number | null
  producao: number | null
  unidade_producao: string | null
  /** produção por hectare, pela área atual do lote */
  produtividade: number | null
  observacoes: string | null
}

export type ColheitaPayload = {
  data_colheita: string
  producao: number | null
  unidade_producao: string
  observacoes: string | null
}

export type NovaSafraPayload = {
  cultura_id: number
  data_plantio: string | null
  previsao_colheita: string | null
  situacao: 'EM_PREPARO' | 'EM_CULTIVO'
  observacoes: string | null
}

export type SafraPatchPayload = {
  cultura_id: number
  data_plantio: string | null
  previsao_colheita: string | null
  data_colheita: string | null
  producao: number | null
  unidade_producao: string
  observacoes: string | null
}
