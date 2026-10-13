import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/shared/SelectField'
import { PERIODO_MAX_DIAS, diasEntre, hojeIso, somarDias } from '@/lib/periodo'
import type { PeriodoPainel } from '@/services/painel.service'

const DATAS = 'datas'

type Props = {
  value: PeriodoPainel
  onChange: (periodo: PeriodoPainel) => void
  /** atalhos em dias (a API aceita de 1 a 30) */
  atalhos?: number[]
  /** permite escolher datas (até 400 dias) */
  datas?: boolean
  id?: string
}

const rotulo = (d: number) => (d === 1 ? 'Últimas 24 horas' : `Últimos ${d} dias`)

/** Período das leituras: atalhos de dias ou duas datas. */
export function PeriodoFiltro({ value, onChange, atalhos = [7, 30], datas = true, id }: Props) {
  const escolhendo = typeof value !== 'number'
  const [desde, setDesde] = useState(escolhendo ? value.desde : somarDias(hojeIso(), -30))
  const [ate, setAte] = useState(escolhendo ? value.ate : hojeIso())
  const [erro, setErro] = useState('')

  function aplicar(novoDesde: string, novoAte: string) {
    setDesde(novoDesde)
    setAte(novoAte)
    if (!novoDesde || !novoAte) return
    if (novoAte < novoDesde) return setErro('A data final é antes da inicial.')
    if (diasEntre(novoDesde, novoAte) > PERIODO_MAX_DIAS - 1)
      return setErro(`Escolha no máximo ${PERIODO_MAX_DIAS} dias.`)
    setErro('')
    onChange({ desde: novoDesde, ate: novoAte })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SelectField
        id={id}
        aria-label="Período"
        value={escolhendo ? DATAS : String(value)}
        onValueChange={(v) => (v === DATAS ? aplicar(desde, ate) : onChange(Number(v)))}
        options={[
          ...atalhos.map((d) => ({ value: String(d), label: rotulo(d) })),
          ...(datas ? [{ value: DATAS, label: 'Escolher datas' }] : []),
        ]}
        className="w-44"
      />
      {escolhendo && (
        <>
          <Input
            type="date"
            aria-label="Data inicial"
            value={desde}
            max={ate || undefined}
            onChange={(e) => aplicar(e.target.value, ate)}
            className="h-9 w-40"
          />
          <span className="text-sm text-muted-foreground">a</span>
          <Input
            type="date"
            aria-label="Data final"
            value={ate}
            min={desde || undefined}
            max={hojeIso()}
            onChange={(e) => aplicar(desde, e.target.value)}
            className="h-9 w-40"
          />
          {erro && (
            <span className="text-sm text-destructive" role="alert">
              {erro}
            </span>
          )}
        </>
      )}
    </div>
  )
}
