import axios, { type AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { toApiError } from './errors'
import { getToken } from './token-storage'

/** Instância única para a API do FruitVale. */
export const http = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

/** Instância sem credenciais, para serviços públicos (IBGE, NASA). */
export const externalHttp = axios.create()

let onUnauthorized: (() => void) | undefined

/** O AuthProvider registra aqui o que fazer quando a API recusa o token. */
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler
}

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (resposta) => resposta,
  (error: unknown) => {
    const apiError = toApiError(error)
    // 401 sem token é só "senha errada" no login: não derruba a sessão
    if (apiError.status === 401 && getToken()) onUnauthorized?.()
    return Promise.reject(apiError)
  },
)

/** Helpers que já devolvem o corpo da resposta tipado. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    http.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.patch<T>(url, body, config).then((r) => r.data),
  delete: (url: string, config?: AxiosRequestConfig) =>
    // 204 No Content (ex.: excluir) não tem corpo
    http.delete(url, config).then(() => undefined),
}
