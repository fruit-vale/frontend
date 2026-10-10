import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copiarTexto } from '@/lib/download'

/** Botão que copia um texto e confirma por 1,5 s. */
export function CopyButton({
  valor,
  label = 'Copiar',
}: {
  valor: string
  label?: string
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    if (!(await copiarTexto(valor))) return // sem permissão: o valor segue visível
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copiar}>
      {copiado ? <CheckIcon /> : <CopyIcon />}
      {copiado ? 'Copiado!' : label}
    </Button>
  )
}

/** Linha "rótulo — valor — copiar", usada nas credenciais dos sensores. */
export function CopyRow({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{rotulo}</span>
      <code className="min-w-0 break-all font-mono text-sm">{valor}</code>
      <CopyButton valor={valor} />
    </div>
  )
}
