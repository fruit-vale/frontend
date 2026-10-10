import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage, isCancelled } from '@/api'
import { gravarCache, lerCache } from '@/lib/request-cache'

type Estado<T> = { key: string | null; data: T | undefined; error: string }

type Options = {
  /** Mude para refazer a busca (ex.: filtros). */
  key?: string | number
  /** false adia a busca (ex.: enquanto falta um parâmetro). */
  enabled?: boolean
  /** Prefixo da mensagem de erro, ex.: "Não foi possível carregar os lotes". */
  errorPrefix?: string
  /**
   * Guarda a resposta: ao voltar para a tela ela aparece na hora e é
   * atualizada em segundo plano, sem tela de carregamento.
   */
  cacheKey?: string
}

/**
 * Busca de dados com cancelamento: a requisição é abortada ao sair da tela
 * ou quando `key` muda, e respostas antigas nunca sobrescrevem as novas.
 */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  { key = 0, enabled = true, errorPrefix, cacheKey }: Options = {},
) {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [nonce, setNonce] = useState(0)
  const requestKey = `${key}:${nonce}`
  const chaveCache = cacheKey ? `${cacheKey}:${key}` : null
  const [estado, setEstado] = useState<Estado<T>>(() => {
    const guardado = chaveCache ? lerCache<T>(chaveCache) : undefined
    return guardado === undefined
      ? { key: null, data: undefined, error: '' }
      : { key: requestKey, data: guardado, error: '' }
  })

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (chaveCache) gravarCache(chaveCache, data)
        setEstado({ key: requestKey, data, error: '' })
      },
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
  }, [requestKey, enabled, errorPrefix, chaveCache])

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
