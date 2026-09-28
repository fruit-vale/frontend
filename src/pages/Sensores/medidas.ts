// Regras dos dados que um sensor envia (mesmas da API em src/sensores/medidas.ts)

import { UNIDADE_PADRAO, type Medida, type TipoMedida } from './tipos'

/** Linha em edição: id só existe para dados já salvos. */
export type MedidaRascunho = {
  id?: number
  nome: string
  tipo: TipoMedida
  unidade: string
  chave: string
  /** chave alterada à mão: deixa de acompanhar o nome */
  chaveManual: boolean
}

export const MEDIDAS_MAX = 20

/** Mesma regra da API: "Temperatura do ar" → "temperatura_do_ar". */
export function gerarChave(nome: string) {
  const chave = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return !chave || /^[a-z]/.test(chave) ? chave : `m_${chave}`.slice(0, 40)
}

export const novaMedida = (tipo: TipoMedida = 'OUTRO', nome = ''): MedidaRascunho => ({
  nome,
  tipo,
  unidade: UNIDADE_PADRAO[tipo],
  chave: gerarChave(nome),
  chaveManual: false,
})

export const paraRascunho = (m: Medida): MedidaRascunho => ({
  id: m.id,
  nome: m.nome,
  tipo: m.tipo,
  unidade: m.unidade ?? '',
  chave: m.chave,
  chaveManual: true,
})

/** Corpo enviado à API (POST /sensores e PATCH /sensores/:id/medidas). */
export const paraApi = (lista: MedidaRascunho[]) =>
  lista.map(({ id, nome, tipo, unidade, chave }) => ({
    ...(id !== undefined && { id }),
    nome: nome.trim(),
    tipo,
    unidade: unidade.trim() || null,
    chave: chave.trim(),
  }))

/** Mensagem de erro local, antes de enviar (a API valida de novo). */
export function validarMedidas(lista: MedidaRascunho[]) {
  if (lista.length === 0) return 'Adicione pelo menos um dado que o sensor envia.'
  for (const [i, m] of lista.entries()) {
    if (!m.nome.trim()) return `Dado ${i + 1}: informe o nome.`
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(m.chave))
      return `Dado ${i + 1}: a chave deve ter só letras minúsculas, números e _, começando por letra.`
    if (m.chave === 'data_hora') return `Dado ${i + 1}: a chave "data_hora" é reservada.`
  }
  const repetida = lista.find((m, i) => lista.findIndex((o) => o.chave === m.chave) !== i)
  if (repetida) return `A chave "${repetida.chave}" aparece mais de uma vez.`
  return null
}
