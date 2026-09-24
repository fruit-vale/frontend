export const API_URL =
  import.meta.env.VITE_API_URL ?? 'https://api.fruitvale.com.br'

const TOKEN_KEY = 'fruitvale:token'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// "Lembrar de mim" mantém o token no localStorage; sem ele, só na sessão da aba.
export function setToken(token: string | null, lembrar = true) {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (token) {
      ;(lembrar ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
    }
  } catch {
    // armazenamento indisponível (ex.: navegação privada) — segue só em memória
  }
}

let onUnauthorized: (() => void) | undefined

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler
}

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const resposta = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as {
      message?: string | string[]
    } | null
    const mensagem = Array.isArray(corpo?.message)
      ? corpo.message.join(' ')
      : (corpo?.message ?? `HTTP ${resposta.status}`)

    if (resposta.status === 401 && token) onUnauthorized?.()
    throw new ApiError(resposta.status, mensagem)
  }

  return (await resposta.json()) as T
}
