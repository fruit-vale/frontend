import type { Poligono } from '../../lib/geo'

// formatos devolvidos pela API em /lotes, /propriedades e /culturas

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

export type Propriedade = {
  id: number
  nome: string
  municipio: string
  estado: string
  empresa_id: number
  latitude: number | null
  longitude: number | null
}

export type CulturaResumo = {
  id: number
  nome: string
  variedade: string | null
  ciclo_medio_dias: number | null
  /** null = cultura da plataforma */
  empresa: { id: number } | null
}

export const nomeCultura = (c: { nome: string; variedade: string | null }) =>
  c.variedade ? `${c.nome} — ${c.variedade}` : c.nome
