import { useContext } from 'react'
import { ConfirmContext } from '@/contexts/confirm-context'

/** `if (!(await confirm({ title: '...' }))) return` */
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm deve ser usado dentro de um ConfirmProvider')
  }
  return context
}
