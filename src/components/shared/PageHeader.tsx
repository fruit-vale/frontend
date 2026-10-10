import type { ReactNode } from 'react'

type Props = {
  /** Linha pequena acima do título, ex.: "ADMINISTRAÇÃO". */
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Botões à direita (ex.: "+ Novo lote"). */
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

/** Cabeçalho de uma seção dentro da página. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-0.5">
        {eyebrow && (
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  )
}
