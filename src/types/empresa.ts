export type ContratoStatus = 'PENDENTE' | 'ACEITO'

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
  /** Enquanto PENDENTE, os usuários da empresa não conseguem entrar. */
  contrato_status: ContratoStatus
  contrato_enviado_em: string | null
  contrato_aceito_em: string | null
}

/** Resultado do envio do contrato por e-mail. */
export type ContratoEnvio = {
  enviado: boolean
  email: string
  expira_em: string
}

/** Resposta de POST /empresas: a empresa e o envio do contrato. */
export type EmpresaCriada = Empresa & { contrato_envio: ContratoEnvio }

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

export type Clausula = {
  titulo: string
  paragrafos?: string[]
  itens?: string[]
}

/** Dados da tela pública de aceite (GET /contrato/:token). */
export type ContratoPublico = {
  status: ContratoStatus
  aceito_em: string | null
  aceito_por: string | null
  expira_em: string | null
  versao: string
  contratada: { nome: string; cnpj: string | null }
  contratante: {
    razao_social: string
    cpf_cnpj: string
    responsavel: string | null
    email: string | null
    telefone: string | null
    cidade: string | null
    estado: string | null
  }
  clausulas: Clausula[]
}
