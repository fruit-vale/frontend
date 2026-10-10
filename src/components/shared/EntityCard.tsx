import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  icon: ReactNode
  title: string
  subtitle?: ReactNode
  /** selo de estado no canto superior direito */
  badge?: ReactNode
  children?: ReactNode
  /** botões do rodapé (editar, excluir...) */
  actions?: ReactNode
}

/** Cartão padrão das listagens: cabeçalho, conteúdo livre e rodapé de ações. */
export function EntityCard({ icon, title, subtitle, badge, children, actions }: Props) {
  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground [&_svg]:size-5"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate">{title}</strong>
            {subtitle && (
              <small className="block truncate text-xs text-muted-foreground">{subtitle}</small>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {children}
        {actions && (
          <div className="mt-auto flex flex-wrap justify-end gap-1 border-t pt-3">{actions}</div>
        )}
      </CardContent>
    </Card>
  )
}

/** Pares rótulo/valor em grade, para o corpo do cartão. */
export function Dados({ itens }: { itens: [rotulo: string, valor: ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{rotulo}</dt>
          <dd className="truncate font-medium">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}
