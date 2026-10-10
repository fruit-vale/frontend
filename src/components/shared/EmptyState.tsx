import type { ReactNode } from 'react'
import { AlertCircleIcon, InboxIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

/** Quadro tracejado para listas vazias. */
export function EmptyState({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      <InboxIcon className="size-5 opacity-60" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

/** Mensagem de erro (carregamento ou ação). Não renderiza nada sem mensagem. */
export function ErrorMessage({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  if (!message) return null
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircleIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

/** Texto de apoio abaixo de campos e blocos. */
export function Hint({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)}>
      {children}
    </p>
  )
}
