import { api, ENDPOINTS } from '@/api'
import type {
  ColheitaPayload,
  Lote,
  LotePayload,
  NovaSafraPayload,
  Safra,
  SafraPatchPayload,
} from '@/types/lote'

export const lotesService = {
  listar: (signal?: AbortSignal) =>
    api.get<Lote[]>(ENDPOINTS.lotes.base, { signal }),

  buscar: (id: number) => api.get<Lote>(ENDPOINTS.lotes.porId(id)),

  criar: (payload: LotePayload) => api.post<Lote>(ENDPOINTS.lotes.base, payload),

  atualizar: (id: number, payload: LotePayload) =>
    api.patch<Lote>(ENDPOINTS.lotes.porId(id), payload),

  excluir: (id: number) => api.delete(ENDPOINTS.lotes.porId(id)),

  // ── safras (histórico de cultivo do lote) ──────────────────────────────

  listarSafras: (loteId: number, signal?: AbortSignal) =>
    api.get<Safra[]>(ENDPOINTS.lotes.safras(loteId), { signal }),

  /** Também desativa os sensores do lote e os tira dele (as leituras ficam). */
  registrarColheita: (loteId: number, payload: ColheitaPayload) =>
    api.post<Safra & { sensores_desativados: string[] }>(
      ENDPOINTS.lotes.colheita(loteId),
      payload,
    ),

  iniciarSafra: (loteId: number, payload: NovaSafraPayload) =>
    api.post<Safra>(ENDPOINTS.lotes.safras(loteId), payload),

  atualizarSafra: (loteId: number, safraId: number, payload: SafraPatchPayload) =>
    api.patch<Safra>(ENDPOINTS.lotes.safraPorId(loteId, safraId), payload),

  excluirSafra: (loteId: number, safraId: number) =>
    api.delete(ENDPOINTS.lotes.safraPorId(loteId, safraId)),
}
