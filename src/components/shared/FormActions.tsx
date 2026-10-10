import type { ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  submitLabel: string
  pendingLabel?: string
  pending?: boolean
  cancelLabel?: string
  onCancel?: () => void
  children?: ReactNode
}

/** Botões de rodapé dos formulários: enviar (com carregando) e cancelar. */
export function FormActions({
  submitLabel,
  pendingLabel = 'Salvando...',
  pending,
  cancelLabel = 'Cancelar',
  onCancel,
  children,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {pending ? pendingLabel : submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" size="lg" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      {children}
    </div>
  )
}
