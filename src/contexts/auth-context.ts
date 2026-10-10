import { createContext } from 'react'
import type { AuthUser } from '@/types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  /** true enquanto o token salvo é revalidado na API */
  carregando: boolean
  login: (email: string, senha: string, lembrar: boolean) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
