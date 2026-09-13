import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { mockUsers } from './mockUsers'
import { AuthError } from './AuthError'
import { AuthContext } from './authContextInstance'
import type { AuthContextValue, AuthUser } from './authContextInstance'

export type { AuthUser } from './authContextInstance'

const STORAGE_KEY = 'fruitvale:auth-user'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login(email, senha) {
        const found = mockUsers.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() &&
            candidate.senha === senha,
        )

        if (!found) {
          throw new AuthError('E-mail ou senha inválidos.')
        }

        const authUser: AuthUser = {
          id: found.id,
          nome: found.nome,
          email: found.email,
          role: found.role,
        }

        setUser(authUser)
        return authUser
      },
      logout() {
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
