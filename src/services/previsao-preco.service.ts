import { api, ENDPOINTS } from '@/api'
import type { PrevisaoPrecoCultura, StatusPrevisaoPreco } from '@/types/previsao-preco'

export const previsaoPrecoService = {
  /** Séries de preço da fruta da cultura, com a previsão de 4 a 12 semanas. */
  daCultura: (culturaId: number, signal?: AbortSignal) =>
    api.get<PrevisaoPrecoCultura>(ENDPOINTS.previsaoPreco.base, {
      params: { cultura_id: culturaId },
      signal,
    }),

  /** Só o administrador: último treino e séries disponíveis. */
  status: (signal?: AbortSignal) =>
    api.get<StatusPrevisaoPreco>(ENDPOINTS.previsaoPreco.status, { signal }),

  /** Só o administrador: retreina agora (em segundo plano, ~2 min). */
  treinar: () =>
    api.post<{ iniciado: boolean; motivo?: string }>(ENDPOINTS.previsaoPreco.treinar, {}),
}
