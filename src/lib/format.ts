/** Formatadores pt-BR compartilhados pelas telas. */

/** "2026-10-09" → "09/10/2026" (meio-dia evita o deslocamento de fuso). */
export const formatarData = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '—'

export const formatarNumero = (valor: number, casas = 2) =>
  valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })

export const formatarHectares = (valor: number | null | undefined) =>
  valor == null ? '—' : `${formatarNumero(valor)} ha`

export const formatarDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

export const formatarMetros = (m: number) =>
  m >= 1000
    ? `${formatarNumero(m / 1000)} km`
    : `${Math.round(m).toLocaleString('pt-BR')} m`

export const plural = (n: number, singular: string, plural_: string) =>
  n === 1 ? singular : plural_

/** Texto → número, aceitando vírgula decimal; vazio vira null. */
export function numeroOuNull(texto: string) {
  const limpo = texto.replace(',', '.').trim()
  return limpo === '' ? null : Number(limpo)
}

/** Ordena por texto no padrão pt-BR. */
export const porTexto =
  <T>(chave: (item: T) => string) =>
  (a: T, b: T) =>
    chave(a).localeCompare(chave(b), 'pt-BR')

/** Substitui (ou acrescenta) um item pelo id, mantendo a lista imutável. */
export function substituirPorId<T extends { id: number }>(lista: T[], item: T) {
  return lista.some((i) => i.id === item.id)
    ? lista.map((i) => (i.id === item.id ? item : i))
    : [...lista, item]
}
