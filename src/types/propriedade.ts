import type { EmpresaResumo } from './auth'

export type StatusPropriedade = 'ATIVA' | 'INATIVA'

/** Formato resumido, usado nos formulários de lote. */
export type Propriedade = {
  id: number
  nome: string
  municipio: string
  estado: string
  empresa_id: number
  latitude: number | null
  longitude: number | null
}

/** Formato completo devolvido por GET /propriedades. */
export type PropriedadeCompleta = Propriedade & {
  area_total_ha: number | null
  status: StatusPropriedade
  empresa: EmpresaResumo
  produtor_responsavel: { id: number; nome: string } | null
  total_lotes: number
  total_sensores: number
}

export type PropriedadePayload = {
  empresa_id?: number
  nome: string
  estado: string
  municipio: string
  area_total_ha: number | null
  status: StatusPropriedade
  latitude: number | null
  longitude: number | null
}
