export type CulturaResumo = {
  id: number
  nome: string
  variedade: string | null
  ciclo_medio_dias: number | null
  /** null = cultura da plataforma */
  empresa: { id: number } | null
}

export type Cultura = Omit<CulturaResumo, 'empresa'> & {
  temp_recomendada_min: number | null
  temp_recomendada_max: number | null
  umidade_recomendada_min: number | null
  umidade_recomendada_max: number | null
  descricao: string | null
  /** abaixo dela a planta não se desenvolve (°C) */
  temp_base_graus_dia: number | null
  /** graus-dia somados do plantio à colheita */
  graus_dia_ciclo: number | null
  /** null = cultura da plataforma, visível a todas as empresas */
  empresa: { id: number; razao_social: string } | null
  total_lotes: number
}

export type CulturaPayload = {
  nome: string
  variedade: string
  descricao: string
  empresa_id?: number | null
  temp_recomendada_min: number | null
  temp_recomendada_max: number | null
  umidade_recomendada_min: number | null
  umidade_recomendada_max: number | null
  ciclo_medio_dias: number | null
  temp_base_graus_dia: number | null
  graus_dia_ciclo: number | null
}

export const nomeCultura = (c: { nome: string; variedade: string | null }) =>
  c.variedade ? `${c.nome} — ${c.variedade}` : c.nome
