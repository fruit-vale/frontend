import { createContext } from 'react'
import type { Role } from './roles'

export type Empresa = {
  id: number
  razao_social: string
}

export type AuthUser = {
  id: number
  nome: string
  email: string
  role: Role
  empresa: Empresa | null
}

export type AuthContextValue = {
  user: AuthUser | null
  carregando: boolean
  login: (email: string, senha: string, lembrar: boolean) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
