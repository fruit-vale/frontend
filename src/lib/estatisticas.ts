import type { Cultura } from '@/types/cultura'
import type { Serie } from '@/types/painel'
import type { TipoMedida } from '@/types/sensor'

export type Resumo = {
  media: number
  min: number
  max: number
  /** quantos pontos (médias por hora ou por dia) entraram na conta */
  pontos: number
}

/** Média, mínimo e máximo de uma lista de valores; null se vazia. */
export function resumir(valores: number[]): Resumo | null {
  if (!valores.length) return null
  let soma = 0
  let min = Infinity
  let max = -Infinity
  for (const v of valores) {
    soma += v
    if (v < min) min = v
    if (v > max) max = v
  }
  return { media: soma / valores.length, min, max, pontos: valores.length }
}

export const valoresDasSeries = (series: Serie[]) => series.flatMap((s) => s.pontos.map((p) => p.valor))

/**
 * Junta as séries de vários sensores numa só, pela média de cada instante
 * (ex.: um lote com dois sensores de temperatura vira uma linha).
 */
export function mediaPorInstante(series: Serie[], nome: string): Serie {
  const somas = new Map<string, { soma: number; n: number }>()
  for (const s of series)
    for (const p of s.pontos) {
      const atual = somas.get(p.instante) ?? { soma: 0, n: 0 }
      atual.soma += p.valor
      atual.n += 1
      somas.set(p.instante, atual)
    }
  return {
    sensor: nome,
    lote: null,
    pontos: [...somas.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([instante, { soma, n }]) => ({ instante, valor: Math.round((soma / n) * 100) / 100 })),
  }
}

/** Faixa ideal da cultura para o dado, se ele tem uma (temperatura e umidade do ar). */
export function faixaDaCultura(
  cultura: Pick<
    Cultura,
    'temp_recomendada_min' | 'temp_recomendada_max' | 'umidade_recomendada_min' | 'umidade_recomendada_max'
  > | undefined,
  tipo: TipoMedida,
): { min: number | null; max: number | null } | null {
  if (!cultura) return null
  const faixa =
    tipo === 'TEMPERATURA'
      ? { min: cultura.temp_recomendada_min, max: cultura.temp_recomendada_max }
      : tipo === 'UMIDADE'
        ? { min: cultura.umidade_recomendada_min, max: cultura.umidade_recomendada_max }
        : null
  return faixa && (faixa.min !== null || faixa.max !== null) ? faixa : null
}

export type ForaDaFaixa = {
  abaixo: number
  acima: number
  total: number
  /** 0 a 100 */
  percentual: number
}

/** Quantos pontos ficaram abaixo ou acima da faixa (cada ponto é uma hora ou um dia). */
export function contarForaDaFaixa(
  valores: number[],
  faixa: { min: number | null; max: number | null },
): ForaDaFaixa | null {
  if (!valores.length) return null
  let abaixo = 0
  let acima = 0
  for (const v of valores) {
    if (faixa.min !== null && v < faixa.min) abaixo++
    else if (faixa.max !== null && v > faixa.max) acima++
  }
  return {
    abaixo,
    acima,
    total: valores.length,
    percentual: Math.round(((abaixo + acima) / valores.length) * 1000) / 10,
  }
}
