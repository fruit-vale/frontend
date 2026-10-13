import type { Cultura } from '@/types/cultura'
import type { Lote } from '@/types/lote'
import type { Painel } from '@/types/painel'
import type { TipoMedida } from '@/types/sensor'

/** O que todas as abas de Análises usam, carregado uma vez pela página. */
export type DadosAnalise = {
  /** lotes do escopo do usuário */
  lotes: Lote[]
  /** faixas ideais por id da cultura */
  culturas: Map<number, Cultura>
  /** dados que algum sensor mede, com a unidade */
  tipos: Painel['tipos']
}

export const unidadeDo = (dados: DadosAnalise, tipo: TipoMedida) =>
  dados.tipos.find((t) => t.tipo === tipo)?.unidade ?? null

export const fmt = (v: number | null | undefined, unidade?: string | null) =>
  v === null || v === undefined
    ? '—'
    : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unidade ? ` ${unidade}` : ''}`
