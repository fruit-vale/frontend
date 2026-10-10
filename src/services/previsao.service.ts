import { api, ENDPOINTS } from '@/api'
import type { PrevisaoLote } from '@/types/previsao'

export const previsaoService = {
  /** Lotes em cultivo do usuário, com a previsão pela temperatura dos sensores. */
  listar: (signal?: AbortSignal) => api.get<PrevisaoLote[]>(ENDPOINTS.previsao, { signal }),
}
