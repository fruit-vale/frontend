import { useMemo, useState } from 'react'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Busca de texto sem acento nem caixa sobre os campos que `campos` devolver. */
export function useSearch<T>(itens: T[], campos: (item: T) => (string | null | undefined)[]) {
  const [query, setQuery] = useState('')

  const filtrados = useMemo(() => {
    const termo = normalizar(query.trim())
    if (!termo) return itens
    return itens.filter((item) =>
      campos(item).some((c) => c && normalizar(c).includes(termo)),
    )
    // `campos` é recriado a cada render; só o conteúdo da busca importa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, query])

  return { query, setQuery, filtrados }
}
