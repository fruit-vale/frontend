export type Empresa = {
  id: number
  razao_social: string
  cpf_cnpj: string
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  responsavel: string | null
  total_usuarios: number
}

/** Corpo de POST /empresas. */
export type EmpresaPayload = {
  razao_social: string
  cpf_cnpj: string
  responsavel: string
  email: string
  telefone: string
  estado: string
  cidade: string
}
