import type { Poligono } from '@/lib/geo'
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
  /** área desenhada no mapa; os lotes precisam ficar dentro dela */
  geometria: Poligono | null
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

/** A área, a latitude e a longitude a API calcula do contorno. */
export type PropriedadePayload = {
  empresa_id?: number
  nome: string
  estado: string
  municipio: string
  status: StatusPropriedade
  geometria: Poligono
}
