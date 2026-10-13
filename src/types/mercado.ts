// GET /mercado/*: dados públicos da Conab (atacado e produtor) e do Comex Stat.

export type MesAno = { ano: number; mes: number }

export type CulturaMercado = {
  id: number
  nome: string
  variedade: string | null
  /** nomes da Conab para a fruta, ex.: "MANGA PALMER" */
  produtos_atacado: string[]
  tem_preco_produtor: boolean
  /** código NCM da fruta fresca (exportação); null = sem código próprio */
  ncm: string | null
}

export type Atacado = {
  produtos: string[]
  /** variedade filtrada; null = todas as da fruta */
  produto: string | null
  /** último mês com dados */
  referencia: MesAno | null
  serie: (MesAno & { preco_kg: number; quantidade_kg: number })[]
  /** último mês, da mais cara para a mais barata */
  ceasas: { ceasa: string; uf: string; preco_kg: number; quantidade_kg: number }[]
  origens: { municipio: string; uf: string; quantidade_kg: number; participacao: number }[]
  /** preço típico de cada mês do ano (todo o histórico) */
  sazonalidade: { mes: number; preco_kg: number }[]
}

export type Produtor = {
  referencia: MesAno | null
  serie: (MesAno & { preco_kg: number })[]
  por_uf: { uf: string; preco_kg: number }[]
}

export type Exportacao = {
  ncm: string | null
  referencia: MesAno | null
  serie: (MesAno & { valor_fob_usd: number; peso_kg: number; usd_kg: number | null })[]
  paises: { pais: string; valor_fob_usd: number; peso_kg: number; participacao: number }[]
  total_12_meses: { valor_fob_usd: number; peso_kg: number; usd_kg: number | null } | null
}

export type FonteMercado = 'atacado' | 'produtor' | 'exportacao'

export type StatusMercado = {
  importacoes: {
    fonte: FonteMercado
    iniciado_em: string
    concluido_em: string | null
    linhas: number | null
    erro: string | null
  }[]
  em_andamento: FonteMercado[]
}
