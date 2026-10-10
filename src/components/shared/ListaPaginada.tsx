import { useState, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/use-search'

type Props<T> = {
  itens: T[]
  /** textos considerados pela busca */
  campos: (item: T) => (string | null | undefined)[]
  rotuloBusca: string
  vazio: string
  renderItem: (item: T) => ReactNode
  /** itens por página (6 por padrão) */
  porPagina?: number
  /** classes da lista de itens, ex.: grade em colunas */
  listaClassName?: string
  /** filtros (selects) ao lado da busca */
  filtros?: ReactNode
}

/** Lista com barra de busca e paginação. */
export function ListaPaginada<T extends { id: number }>({
  itens,
  campos,
  rotuloBusca,
  vazio,
  renderItem,
  porPagina = 6,
  listaClassName = 'space-y-1',
  filtros,
}: Props<T>) {
  const { query, setQuery, filtrados } = useSearch(itens, campos)
  const [pagina, setPagina] = useState(1)

  const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const atual = Math.min(pagina, paginas)
  const visiveis = filtrados.slice((atual - 1) * porPagina, atual * porPagina)

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={rotuloBusca}
            placeholder={rotuloBusca}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPagina(1)
            }}
            className="h-9 pl-9"
          />
        </div>
        {filtros}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState>{query ? 'Nada encontrado para essa busca.' : vazio}</EmptyState>
      ) : (
        <div className={listaClassName}>
          {visiveis.map((item) => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
      )}

      {filtrados.length > porPagina && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-2">
          <small className="text-xs text-muted-foreground">
            {filtrados.length} resultados · página {atual} de {paginas}
          </small>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atual === 1}
              onClick={() => setPagina(atual - 1)}
            >
              <ChevronLeftIcon />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atual === paginas}
              onClick={() => setPagina(atual + 1)}
            >
              Próxima
              <ChevronRightIcon />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
