import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  /** id do controle, para ligar o rótulo ao campo */
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}

/** Rótulo + controle + dica/erro, no espaçamento padrão dos formulários. */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: Props) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {children}
      {error ? (
        <small className="text-xs text-destructive">{error}</small>
      ) : hint ? (
        <small className="text-xs text-muted-foreground">{hint}</small>
      ) : null}
    </div>
  )
}

/** Grade responsiva de campos. */
export function FormGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
