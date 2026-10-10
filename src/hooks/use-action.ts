import { useCallback, useState } from 'react'
import { getErrorMessage } from '@/api'

/**
 * Executa uma gravação (POST/PATCH/DELETE) controlando `pending` e `error`.
 * `run` devolve o resultado, ou `undefined` se falhou (o erro fica em `error`).
 */
export function useAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(
    async <T,>(action: () => Promise<T>, fallback = 'Erro ao salvar.') => {
      setError('')
      setPending(true)
      try {
        return await action()
      } catch (e) {
        setError(getErrorMessage(e, fallback))
        return undefined
      } finally {
        setPending(false)
      }
    },
    [],
  )

  return { run, pending, error, setError, clearError: () => setError('') }
}
