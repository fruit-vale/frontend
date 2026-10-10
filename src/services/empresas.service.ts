import { api, ENDPOINTS } from '@/api'
import type { Empresa, EmpresaPayload } from '@/types/empresa'

export const empresasService = {
  listar: (signal?: AbortSignal) =>
    api.get<Empresa[]>(ENDPOINTS.empresas.base, { signal }),

  criar: (payload: EmpresaPayload) =>
    api.post<Empresa>(ENDPOINTS.empresas.base, payload),
}
