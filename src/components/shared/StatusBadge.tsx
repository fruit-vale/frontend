import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary'

const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-secondary text-secondary-foreground',
}

/** Estado sempre com texto (e, quando houver, ícone): nunca só a cor. */
export function StatusBadge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return <Badge className={cn(TONES[tone], className)}>{children}</Badge>
}
