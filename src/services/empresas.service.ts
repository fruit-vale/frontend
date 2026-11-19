import { api, ENDPOINTS } from '@/api'
import type {
  ContratoEnvio,
  ContratoPublico,
  Empresa,
  EmpresaCriada,
  EmpresaPayload,
} from '@/types/empresa'

export const empresasService = {
  listar: (signal?: AbortSignal) =>
    api.get<Empresa[]>(ENDPOINTS.empresas.base, { signal }),

  /** Cadastra a empresa e já envia o contrato para o e-mail dela. */
  criar: (payload: EmpresaPayload) =>
    api.post<EmpresaCriada>(ENDPOINTS.empresas.base, payload),

  /** Edita os dados cadastrais; o contrato continua como está. */
  atualizar: (id: number, payload: EmpresaPayload) =>
    api.patch<Empresa>(ENDPOINTS.empresas.porId(id), payload),

  /** Apaga a empresa e tudo o que é dela (usuários, propriedades, lotes, sensores, leituras). */
  excluir: (id: number) => api.delete(ENDPOINTS.empresas.porId(id)),

  reenviarContrato: (id: number) =>
    api.post<ContratoEnvio>(ENDPOINTS.empresas.reenviarContrato(id)),
}

/** Telas públicas do contrato: quem acessa é o responsável, pelo link do e-mail. */
export const contratoService = {
  consultar: (token: string, signal?: AbortSignal) =>
    api.get<ContratoPublico>(ENDPOINTS.contrato.porToken(token), { signal }),

  aceitar: (token: string, nome: string) =>
    api.post<{ status: 'ACEITO'; aceito_em: string }>(
      ENDPOINTS.contrato.aceitar(token),
      { nome, aceito: true },
    ),
}
