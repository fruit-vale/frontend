import { createContext } from 'react'
import type { Role } from './roles'

export type AuthUser = {
  id: string
  nome: string
  email: string
  role: Role
}

export type AuthContextValue = {
  user: AuthUser | null
  login: (email: string, senha: string) => AuthUser
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
