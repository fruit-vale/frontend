import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  getToken,
  isCancelled,
  setToken,
  setUnauthorizedHandler,
} from '@/api'
import { authService } from '@/services'
import type { AuthUser } from '@/types/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [carregando, setCarregando] = useState(() => getToken() !== null)

  useEffect(() => {
    // a API recusou o token (expirado/revogado): encerra a sessão local
    setUnauthorizedHandler(() => {
      setToken(null)
      setUser(null)
    })

    const controller = new AbortController()
    if (getToken()) {
      authService
        .me(controller.signal)
        .then(setUser)
        .catch((error) => {
          if (!isCancelled(error)) setToken(null)
        })
        .finally(() => {
          if (!controller.signal.aborted) setCarregando(false)
        })
    }

    return () => {
      controller.abort()
      setUnauthorizedHandler(undefined)
    }
  }, [])

  const login = useCallback<AuthContextValue['login']>(
    async (email, senha, lembrar) => {
      try {
        const { access_token, usuario } = await authService.login({
          email: email.trim(),
          senha,
        })
        setToken(access_token, lembrar)
        setUser(usuario)
        return usuario
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          throw new ApiError(401, 'E-mail ou senha inválidos.')
        }
        throw error
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, carregando, login, logout }),
    [user, carregando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
