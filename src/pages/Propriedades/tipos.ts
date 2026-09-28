// formato devolvido pela API em /propriedades

export type StatusPropriedade = 'ATIVA' | 'INATIVA'

export type PropriedadeCompleta = {
  id: number
  nome: string
  municipio: string
  estado: string
  latitude: number | null
  longitude: number | null
  area_total_ha: number | null
  status: StatusPropriedade
  empresa_id: number
  empresa: { id: number; razao_social: string }
  produtor_responsavel: { id: number; nome: string } | null
  total_lotes: number
  total_sensores: number
}

