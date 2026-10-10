import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SIZES = {
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-6xl',
} as const

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /** md: formulários curtos · lg: formulários com listas · xl: mapas */
  size?: keyof typeof SIZES
  children: ReactNode
}

/**
 * Diálogo padrão da aplicação (substitui o antigo <Modal>): título fixo e
 * corpo com rolagem própria, para formulários e mapas longos.
 */
export function AppDialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent
        className={cn(
          'flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-hidden p-0',
          SIZES[size],
        )}
      >
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle className="font-heading text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
