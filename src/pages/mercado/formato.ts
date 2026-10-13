import type { MesAno } from '@/types/mercado'
import type { Serie } from '@/types/painel'

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export const mesAno = (m: MesAno) => `${MESES[m.mes - 1]}/${m.ano}`
export const mesLongo = (mes: number) => MESES_LONGOS[mes - 1]

export const reais = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dolares = (v: number | null | undefined) => {
  if (v == null) return '—'
  if (Math.abs(v) >= 1e6) return `US$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (Math.abs(v) >= 1e3) return `US$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return `US$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
}

export const toneladas = (kg: number) =>
  `${(kg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: kg >= 10_000_000 ? 0 : 1 })} t`

/** Série mensal no formato do gráfico dos sensores (um ponto no meio de cada mês). */
export function serieMensal(nome: string, pontos: (MesAno & { valor: number })[]): Serie {
  return {
    sensor: nome,
    lote: null,
    pontos: pontos.map((p) => ({
      instante: `${p.ano}-${String(p.mes).padStart(2, '0')}-15T12:00:00.000Z`,
      valor: p.valor,
    })),
  }
}

/** Variação percentual entre dois valores, arredondada. */
export const variacao = (atual: number, anterior: number) =>
  anterior ? Math.round(((atual - anterior) / anterior) * 1000) / 10 : null
