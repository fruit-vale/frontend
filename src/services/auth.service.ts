import { api, ENDPOINTS } from '@/api'
import type { AuthUser, LoginPayload, LoginResponse } from '@/types/auth'

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>(ENDPOINTS.auth.login, payload),

  /** Revalida o token salvo e recarrega os dados do usuário. */
  me: (signal?: AbortSignal) => api.get<AuthUser>(ENDPOINTS.auth.me, { signal }),
}
