import { api, ENDPOINTS } from '@/api'
import type { FiltroAlertas, RespostaAlertas } from '@/types/alerta'

export const alertasService = {
  /** Alertas no escopo do usuário (sem período: todo o histórico). */
  listar: (filtro: FiltroAlertas = {}, signal?: AbortSignal) =>
    api.get<RespostaAlertas>(ENDPOINTS.alertas, {
      params: {
        lote_id: filtro.loteId,
        propriedade_id: filtro.propriedadeId,
        desde: filtro.desde,
        ate: filtro.ate,
        lido: filtro.lido,
        limite: filtro.limite,
      },
      signal,
    }),
}
