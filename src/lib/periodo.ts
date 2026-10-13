import { formatarData } from '@/lib/format'
import type { PeriodoPainel } from '@/services/painel.service'

const DIA_MS = 86_400_000
/** limite da API para datas escolhidas */
export const PERIODO_MAX_DIAS = 400

/** "AAAA-MM-DD" de hoje, no fuso do navegador. */
export const hojeIso = () => new Date().toLocaleDateString('sv-SE')

export const somarDias = (iso: string, dias: number) =>
  new Date(new Date(`${iso}T12:00:00`).getTime() + dias * DIA_MS).toLocaleDateString('sv-SE')

export const diasEntre = (de: string, ate: string) =>
  Math.round((new Date(`${ate}T12:00:00`).getTime() - new Date(`${de}T12:00:00`).getTime()) / DIA_MS)

/** O período como datas (ex.: para /alertas, que só aceita datas). */
export function periodoEmDatas(p: PeriodoPainel): { desde: string; ate: string } {
  if (typeof p !== 'number') return p
  const ate = hojeIso()
  return { desde: somarDias(ate, -p), ate }
}

/** "últimos 7 dias" ou "01/09/2026 a 30/09/2026". */
export const descreverPeriodo = (p: PeriodoPainel) =>
  typeof p === 'number'
    ? p === 1
      ? 'últimas 24 horas'
      : `últimos ${p} dias`
    : `${formatarData(p.desde)} a ${formatarData(p.ate)}`

/** Corta o início para caber no limite da API (ex.: uma safra muito longa). */
export function limitarPeriodo(desde: string, ate: string): { desde: string; ate: string; cortado: boolean } {
  if (diasEntre(desde, ate) <= PERIODO_MAX_DIAS - 1) return { desde, ate, cortado: false }
  return { desde: somarDias(ate, -(PERIODO_MAX_DIAS - 1)), ate, cortado: true }
}

export const chavePeriodo = (p: PeriodoPainel) => (typeof p === 'number' ? String(p) : `${p.desde}_${p.ate}`)
