import axios from 'axios'

/** Erro de negócio ou de rede, já com a mensagem pronta para o usuário. */
export class ApiError extends Error {
  readonly status: number | null

  constructor(status: number | null, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type CorpoErro = { message?: string | string[] } | null

/** Converte qualquer falha do axios em ApiError (mensagem da API quando houver). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(
        null,
        error.code === 'ERR_CANCELED'
          ? 'Requisição cancelada.'
          : 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      )
    }
    const { status, data } = error.response
    const corpo = (typeof data === 'object' ? data : null) as CorpoErro
    const mensagem = Array.isArray(corpo?.message)
      ? corpo.message.join(' ')
      : (corpo?.message ?? `HTTP ${status}`)
    return new ApiError(status, mensagem)
  }

  return new ApiError(
    null,
    error instanceof Error ? error.message : 'Erro inesperado.',
  )
}

/** Mensagem segura para exibir, com texto padrão se não for um Error. */
export function getErrorMessage(error: unknown, padrao = 'Erro inesperado.') {
  return error instanceof Error && error.message ? error.message : padrao
}

/** Requisição abortada de propósito (troca de tela, novo filtro): não é falha. */
export function isCancelled(error: unknown) {
  return axios.isCancel(error) || (error instanceof ApiError && error.message === 'Requisição cancelada.')
}
