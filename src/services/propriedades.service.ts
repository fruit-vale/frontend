import { api, ENDPOINTS } from '@/api'
import type {
  PropriedadeCompleta,
  PropriedadePayload,
} from '@/types/propriedade'

export const propriedadesService = {
  listar: (signal?: AbortSignal) =>
    api.get<PropriedadeCompleta[]>(ENDPOINTS.propriedades.base, { signal }),

  criar: (payload: PropriedadePayload) =>
    api.post<PropriedadeCompleta>(ENDPOINTS.propriedades.base, payload),

  atualizar: (id: number, payload: PropriedadePayload) =>
    api.patch<PropriedadeCompleta>(ENDPOINTS.propriedades.porId(id), payload),

  excluir: (id: number) => api.delete(ENDPOINTS.propriedades.porId(id)),
}
