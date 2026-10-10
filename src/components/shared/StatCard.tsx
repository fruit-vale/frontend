import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  loading?: boolean
}

export function StatCard({ label, value, hint, icon, loading }: Props) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        {icon && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground [&_svg]:size-5"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <span className="block text-xs text-muted-foreground">{label}</span>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-14" />
          ) : (
            <strong className="block text-2xl leading-tight font-semibold">
              {value}
            </strong>
          )}
          {hint && (
            <small className="block text-xs text-muted-foreground">{hint}</small>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
