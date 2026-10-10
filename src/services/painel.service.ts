import { api, ENDPOINTS } from '@/api'
import type { Painel, RespostaLeituras, SerieResposta } from '@/types/painel'
import type { TipoMedida } from '@/types/sensor'

/** Recorte opcional do monitoramento por propriedade e/ou lote. */
export type FiltroPainel = { propriedadeId?: number; loteId?: number }

const params = (tipo: TipoMedida, dias: number, filtro: FiltroPainel) => ({
  tipo,
  dias,
  propriedade_id: filtro.propriedadeId,
  lote_id: filtro.loteId,
})

export const painelService = {
  obter: (signal?: AbortSignal) =>
    api.get<Painel>(ENDPOINTS.painel.base, { signal }),

  serie: (
    tipo: TipoMedida,
    dias: number,
    filtro: FiltroPainel = {},
    signal?: AbortSignal,
  ) =>
    api.get<SerieResposta>(ENDPOINTS.painel.serie, {
      params: params(tipo, dias, filtro),
      signal,
    }),

  leituras: (
    tipo: TipoMedida,
    dias: number,
    filtro: FiltroPainel = {},
    signal?: AbortSignal,
  ) =>
    api.get<RespostaLeituras>(ENDPOINTS.painel.leituras, {
      params: params(tipo, dias, filtro),
      signal,
    }),
}
