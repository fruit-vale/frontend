import { api, ENDPOINTS } from '@/api'
import type {
  Credenciais,
  MedidaPayload,
  NovoSensorPayload,
  Sensor,
  SensorCriado,
  StatusSensor,
} from '@/types/sensor'

export const sensoresService = {
  listar: (signal?: AbortSignal) =>
    api.get<Sensor[]>(ENDPOINTS.sensores.base, { signal }),

  /** A senha só vem nesta resposta; o broker guarda apenas o hash. */
  criar: (payload: NovoSensorPayload) =>
    api.post<SensorCriado>(ENDPOINTS.sensores.base, payload),

  alterarStatus: (id: number, status: StatusSensor) =>
    api.patch<Sensor>(ENDPOINTS.sensores.porId(id), { status }),

  atualizarMedidas: (id: number, medidas: MedidaPayload[]) =>
    api.patch<Sensor>(ENDPOINTS.sensores.medidas(id), { medidas }),

  /** Leva o sensor para outro lote da mesma empresa. */
  moverParaLote: (id: number, loteId: number) =>
    api.patch<Sensor>(ENDPOINTS.sensores.lote(id), { lote_id: loteId }),

  gerarSenha: (id: number) =>
    api.post<Credenciais>(ENDPOINTS.sensores.senha(id)),

  excluir: (id: number) => api.delete(ENDPOINTS.sensores.porId(id)),
}
