import { api, ENDPOINTS } from '@/api'
import type {
  NovoUsuarioPayload,
  Usuario,
  VinculoUsuarioPayload,
} from '@/types/usuario'

export const usuariosService = {
  listar: (signal?: AbortSignal) =>
    api.get<Usuario[]>(ENDPOINTS.usuarios.base, { signal }),

  criar: (payload: NovoUsuarioPayload) =>
    api.post<Usuario>(ENDPOINTS.usuarios.base, payload),

  atualizarVinculo: (id: number, payload: VinculoUsuarioPayload) =>
    api.patch<Usuario>(ENDPOINTS.usuarios.porId(id), payload),
}
