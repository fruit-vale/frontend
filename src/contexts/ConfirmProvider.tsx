import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './confirm-context'

/** Substitui window.confirm por um diálogo da interface, via `useConfirm()`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((confirmado: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opcoes) => {
    // uma confirmação nova cancela a anterior que ainda estivesse aberta
    resolver.current?.(false)
    setOptions(opcoes)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function responder(confirmado: boolean) {
    resolver.current?.(confirmado)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={options !== null}
        onOpenChange={(aberto) => !aberto && responder(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription className="whitespace-pre-line">
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{options?.cancelLabel ?? 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              variant={options?.destructive ? 'destructive' : 'default'}
              onClick={() => responder(true)}
            >
              {options?.confirmLabel ?? 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}
