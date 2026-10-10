import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="font-heading text-7xl font-semibold text-primary">404</span>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link to={ROUTES.home} className={buttonVariants({ size: 'lg' })}>
        Voltar ao início
      </Link>
    </main>
  )
}
