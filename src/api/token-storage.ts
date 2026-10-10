const TOKEN_KEY = 'fruitvale:token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * "Lembrar de mim" mantém o token no localStorage; sem ele, só na sessão da
 * aba. Passe `null` para limpar.
 */
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
