import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage, isCancelled } from '@/api'

type Estado<T> = { key: string | null; data: T | undefined; error: string }

type Options = {
  /** Mude para refazer a busca (ex.: filtros). */
  key?: string | number
  /** false adia a busca (ex.: enquanto falta um parâmetro). */
  enabled?: boolean
  /** Prefixo da mensagem de erro, ex.: "Não foi possível carregar os lotes". */
  errorPrefix?: string
}

/**
 * Busca de dados com cancelamento: a requisição é abortada ao sair da tela
 * ou quando `key` muda, e respostas antigas nunca sobrescrevem as novas.
 */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  { key = 0, enabled = true, errorPrefix }: Options = {},
) {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [nonce, setNonce] = useState(0)
  const requestKey = `${key}:${nonce}`
  const [estado, setEstado] = useState<Estado<T>>({
    key: null,
    data: undefined,
    error: '',
  })

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    fetcherRef.current(controller.signal).then(
      (data) => setEstado({ key: requestKey, data, error: '' }),
      (error) => {
        if (isCancelled(error)) return
        const detalhe = getErrorMessage(error)
        setEstado({
          key: requestKey,
          data: undefined,
          error: errorPrefix ? `${errorPrefix}: ${detalhe}` : detalhe,
        })
      },
    )

    return () => controller.abort()
  }, [requestKey, enabled, errorPrefix])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  /** Atualiza o dado local depois de uma gravação, sem nova requisição. */
  const setData = useCallback(
    (atualizar: T | ((atual: T | undefined) => T)) =>
      setEstado((atual) => ({
        ...atual,
        data:
          typeof atualizar === 'function'
            ? (atualizar as (atual: T | undefined) => T)(atual.data)
            : atualizar,
      })),
    [],
  )

  return {
    data: estado.data,
    error: estado.error,
    loading: enabled && estado.key !== requestKey,
    reload,
    setData,
  }
}
