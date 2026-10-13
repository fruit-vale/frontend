import { api, ENDPOINTS } from '@/api'
import type { Painel, RespostaLeituras, SerieResposta } from '@/types/painel'
import type { TipoMedida } from '@/types/sensor'

/** Recorte opcional do monitoramento por propriedade, lote e/ou sensor. */
export type FiltroPainel = { propriedadeId?: number; loteId?: number; sensorId?: number }

/** Últimos N dias (1 a 30) ou datas "AAAA-MM-DD" (até 400 dias). */
export type PeriodoPainel = number | { desde: string; ate: string }

const params = (tipo: TipoMedida, periodo: PeriodoPainel, filtro: FiltroPainel) => ({
  tipo,
  ...(typeof periodo === 'number' ? { dias: periodo } : periodo),
  propriedade_id: filtro.propriedadeId,
  lote_id: filtro.loteId,
  sensor_id: filtro.sensorId,
})

export const painelService = {
  obter: (signal?: AbortSignal) =>
    api.get<Painel>(ENDPOINTS.painel.base, { signal }),

  serie: (
    tipo: TipoMedida,
    periodo: PeriodoPainel,
    filtro: FiltroPainel = {},
    signal?: AbortSignal,
  ) =>
    api.get<SerieResposta>(ENDPOINTS.painel.serie, {
      params: params(tipo, periodo, filtro),
      signal,
    }),

  leituras: (
    tipo: TipoMedida,
    periodo: PeriodoPainel,
    filtro: FiltroPainel = {},
    signal?: AbortSignal,
  ) =>
    api.get<RespostaLeituras>(ENDPOINTS.painel.leituras, {
      params: params(tipo, periodo, filtro),
      signal,
    }),
}
