import { api, ENDPOINTS } from '@/api'
import type { Cultura, CulturaPayload } from '@/types/cultura'

export const culturasService = {
  listar: (signal?: AbortSignal) =>
    api.get<Cultura[]>(ENDPOINTS.culturas.base, { signal }),

  criar: (payload: CulturaPayload) =>
    api.post<Cultura>(ENDPOINTS.culturas.base, payload),

  atualizar: (id: number, payload: CulturaPayload) =>
    api.patch<Cultura>(ENDPOINTS.culturas.porId(id), payload),

  excluir: (id: number) => api.delete(ENDPOINTS.culturas.porId(id)),
}
