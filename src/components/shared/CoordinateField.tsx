import { useState } from 'react'
import type { ClipboardEvent } from 'react'
import { Hint } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'

type Props = {
  lat: number | null
  lng: number | null
  /** Chamado com null no campo vazio ou inválido. */
  onChange: (lat: number | null, lng: number | null) => void
  rotuloLat?: string
  rotuloLng?: string
  /** Mostra a dica de colar (desligue quando há vários campos seguidos). */
  dica?: boolean
  idPrefix?: string
}

const LIMITES = { lat: 90, lng: 180 } as const
type Eixo = keyof typeof LIMITES

/** Aceita ponto ou vírgula decimal ("-8.81" ou "-8,81"). */
function lerNumero(texto: string, eixo: Eixo): number | null {
  const limpo = texto.trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null
  const valor = Number(limpo)
  return Math.abs(valor) <= LIMITES[eixo] ? valor : null
}

// "lat, lng" como o Google Maps copia; também "lat; lng" ou "lat lng"
const PAR = /^\s*(-?\d+(?:[.,]\d+)?)\s*(?:;|,\s|\s)\s*(-?\d+(?:[.,]\d+)?)\s*$/

const formatar = (valor: number | null) =>
  valor === null ? '' : String(Number(valor.toFixed(6)))

/**
 * Latitude e longitude digitadas (ou coladas juntas). Enquanto o usuário
 * digita, mostra o rascunho; fora do foco, mostra o valor atual (que também
 * muda ao clicar/arrastar no mapa).
 */
export function CoordinateField({
  lat,
  lng,
  onChange,
  rotuloLat = 'Latitude',
  rotuloLng = 'Longitude',
  dica = true,
  idPrefix = 'coord',
}: Props) {
  const [rascunho, setRascunho] = useState<{ eixo: Eixo; texto: string } | null>(null)

  const texto = (eixo: Eixo) =>
    rascunho?.eixo === eixo ? rascunho.texto : formatar(eixo === 'lat' ? lat : lng)
  const invalido = (eixo: Eixo) =>
    rascunho?.eixo === eixo &&
    rascunho.texto.trim() !== '' &&
    lerNumero(rascunho.texto, eixo) === null

  function digitar(eixo: Eixo, valor: string) {
    setRascunho({ eixo, texto: valor })
    const numero = lerNumero(valor, eixo)
    if (eixo === 'lat') onChange(numero, lng)
    else onChange(lat, numero)
  }

  function colar(event: ClipboardEvent<HTMLInputElement>) {
    const par = PAR.exec(event.clipboardData.getData('text'))
    if (!par) return
    const [la, ln] = [lerNumero(par[1], 'lat'), lerNumero(par[2], 'lng')]
    if (la === null || ln === null) return
    event.preventDefault()
    setRascunho(null)
    onChange(la, ln)
  }

  const campo = (eixo: Eixo, rotulo: string, exemplo: string) => (
    <FormField
      label={rotulo}
      htmlFor={`${idPrefix}-${eixo}`}
      error={
        invalido(eixo) ? `Número entre -${LIMITES[eixo]} e ${LIMITES[eixo]}` : undefined
      }
    >
      <Input
        id={`${idPrefix}-${eixo}`}
        inputMode="decimal"
        autoComplete="off"
        placeholder={exemplo}
        value={texto(eixo)}
        aria-invalid={invalido(eixo)}
        onFocus={() => setRascunho({ eixo, texto: texto(eixo) })}
        onBlur={() => setRascunho(null)}
        onChange={(event) => digitar(eixo, event.target.value)}
        onPaste={colar}
      />
    </FormField>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {campo('lat', rotuloLat, 'ex.: -8.8137')}
        {campo('lng', rotuloLng, 'ex.: -36.9541')}
      </div>
      {dica && (
        <Hint>
          Dica: cole as duas juntas, como o Google Maps copia (ex.: -8.8137,
          -36.9541). No Sul e no Oeste os valores são negativos.
        </Hint>
      )}
    </div>
  )
}
