import { createContext } from 'react'

export type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** botão de confirmação em vermelho (exclusões e ações irreversíveis) */
  destructive?: boolean
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)
