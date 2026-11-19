import { api, ENDPOINTS } from '@/api'
import type { PropriedadePublica } from '@/types/mapa-publico'

export const mapaPublicoService = {
  listar: (signal?: AbortSignal) =>
    api.get<PropriedadePublica[]>(ENDPOINTS.publico.propriedades, { signal }),
  /** Nomes das empresas com contrato aceito (faixa da landing). */
  listarEmpresas: (signal?: AbortSignal) =>
    api.get<string[]>(ENDPOINTS.publico.empresas, { signal }),
}
