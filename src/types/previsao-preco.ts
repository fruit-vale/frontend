/** Previsão de preço do serviço de ML (XGBoost), repassada pela API em GET /previsao/preco. */

export type TendenciaPreco = 'alta' | 'queda' | 'estavel'

export type PontoPreco = { data: string; preco: number }

export type PrevisaoPonto = {
  horizonte_semanas: number
  /** AAAA-MM-DD */
  data: string
  preco: number
  /** faixa de 80% (erros do teste com dados passados) */
  minimo: number
  maximo: number
  variacao_pct: number
  /** erro médio no teste com dados passados, em R$/kg e em % */
  erro_medio: number | null
  erro_medio_pct: number | null
  /** quanto o modelo erra a menos que supor o preço parado */
  ganho_sobre_ingenuo_pct: number | null
}

export type SeriePreco = {
  id: string
  fruta: string
  variedade: string | null
  nome: string
  fonte: string
  unidade: string
  frequencia: 'semanal' | 'mensal'
  /** preenchido quando o último treino desta série falhou */
  erro: string | null
  treinado_em?: string
  ultimo?: PontoPreco
  tendencia?: TendenciaPreco
  variacao_media_pct?: number
  melhor_janela?: PontoPreco
  pior_janela?: PontoPreco
  recomendacao?: string
  /** false: no teste, o modelo não errou menos que supor o preço parado */
  confiavel?: boolean
  intervalo?: string
  previsoes: PrevisaoPonto[]
  historico?: PontoPreco[]
  modelo?: {
    algoritmo: string
    periodos_treino: number
    inicio_serie: string
    /** "80% treino / 20% teste, no tempo (teste walk-forward)" */
    divisao: string
    periodos_treino_inicial: number
    periodos_backtest: number
    /** AAAA-MM-DD: onde começam os 20% de teste */
    inicio_teste: string
    variaveis_externas: string[]
    importancia: Record<string, number>
  }
}

export type PrevisaoPrecoCultura = {
  cultura: { id: number; nome: string; variedade: string | null }
  series: SeriePreco[]
}

export type StatusPrevisaoPreco = {
  ok: boolean
  treinado_em: string | null
  treinando: boolean
  series: string[]
}
