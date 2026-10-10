import type { ReactNode } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  /** Nome do que está listado, ex.: "Empresas". */
  title: string
  /** Itens exibidos / total, para o contador do cabeçalho. */
  shown: number
  total: number
  search: string
  onSearchChange: (valor: string) => void
  searchPlaceholder?: string
  /** Selects de filtro, à direita da busca. */
  filters?: ReactNode
  children: ReactNode
}

/** Moldura das listagens: cabeçalho com contador, busca e filtros + tabela. */
export function DataCard({
  title,
  shown,
  total,
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  children,
}: Props) {
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="text-sm text-muted-foreground">
            {shown === total ? total : `${shown} de ${total}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
          {filters}
        </div>
      </div>
      {children}
    </div>
  )
}

/** Primeira coluna das listas: ícone/avatar em destaque + título e subtítulo. */
export function EntityCell({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground [&_svg]:size-5"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <strong className="block truncate text-sm font-semibold">{title}</strong>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}

/** Mensagem quando a busca/filtro não encontra nada. */
export function NoResults({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>
}
