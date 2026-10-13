import { api, ENDPOINTS } from '@/api'
import type {
  Atacado,
  CulturaMercado,
  Exportacao,
  FonteMercado,
  Produtor,
  StatusMercado,
} from '@/types/mercado'

export const mercadoService = {
  culturas: (signal?: AbortSignal) =>
    api.get<CulturaMercado[]>(ENDPOINTS.mercado.culturas, { signal }),

  atacado: (culturaId: number, meses: number, produto: string | null, signal?: AbortSignal) =>
    api.get<Atacado>(ENDPOINTS.mercado.atacado, {
      params: { cultura_id: culturaId, meses, produto: produto ?? undefined },
      signal,
    }),

  produtor: (culturaId: number, meses: number, signal?: AbortSignal) =>
    api.get<Produtor>(ENDPOINTS.mercado.produtor, {
      params: { cultura_id: culturaId, meses },
      signal,
    }),

  exportacao: (culturaId: number, meses: number, signal?: AbortSignal) =>
    api.get<Exportacao>(ENDPOINTS.mercado.exportacao, {
      params: { cultura_id: culturaId, meses },
      signal,
    }),

  status: (signal?: AbortSignal) => api.get<StatusMercado>(ENDPOINTS.mercado.status, { signal }),

  /** Só o administrador: importa as fontes agora (em segundo plano). */
  atualizar: (fontes?: FonteMercado[]) =>
    api.post<{ iniciadas: FonteMercado[]; em_andamento: FonteMercado[] }>(
      ENDPOINTS.mercado.atualizar,
      fontes ? { fontes } : {},
    ),
}
