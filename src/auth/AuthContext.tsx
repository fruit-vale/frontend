import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  apiFetch,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from '../lib/api'
import { AuthError } from './AuthError'
import { AuthContext } from './authContextInstance'
import type { AuthContextValue, AuthUser } from './authContextInstance'

export type { AuthUser } from './authContextInstance'

type LoginResponse = {
  access_token: string
  usuario: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [carregando, setCarregando] = useState(() => getToken() !== null)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setUser(null)
    })

    // Revalida o token salvo e recarrega os dados do usuário
    if (getToken()) {
      apiFetch<AuthUser>('/auth/me')
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setCarregando(false))
    }

    return () => setUnauthorizedHandler(undefined)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      carregando,
      async login(email, senha, lembrar) {
        try {
          const { access_token, usuario } = await apiFetch<LoginResponse>(
            '/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ email: email.trim(), senha }),
            },
          )
          setToken(access_token, lembrar)
          setUser(usuario)
          return usuario
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            throw new AuthError('E-mail ou senha inválidos.')
          }
          throw error
        }
      },
      logout() {
        setToken(null)
        setUser(null)
      },
    }),
    [user, carregando],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
