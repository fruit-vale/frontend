import type { EmpresaResumo, Role } from './auth'

export type Usuario = {
  id: number
  nome: string
  email: string
  cpf: string
  telefone: string | null
  role: Role | null
  empresa: EmpresaResumo | null
}

export type VinculoUsuarioPayload = {
  role: Role
  empresa_id: number | null
}

/** Corpo de POST /usuarios. */
export type NovoUsuarioPayload = VinculoUsuarioPayload & {
  nome: string
  email: string
  cpf: string
  telefone: string
  senha: string
}
