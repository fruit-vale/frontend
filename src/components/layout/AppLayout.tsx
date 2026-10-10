import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { AppSidebar } from './AppSidebar'

function PaginaCarregando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/** "Maria da Silva" → "MS": primeira e última inicial. */
const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/)
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

/** Moldura das telas autenticadas: menu lateral + conteúdo da rota. */
export function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-heading text-lg font-semibold text-primary md:hidden">
            Fruitvale
          </span>
          {user && (
            <Link
              to={ROUTES.perfil}
              className="ml-auto flex min-w-0 items-center gap-2 rounded-full py-1 pl-3 hover:bg-muted"
              aria-label="Abrir meu perfil"
            >
              <strong className="truncate text-sm font-semibold">
                Olá, {user.nome.split(' ')[0]}!
              </strong>
              <Avatar>
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {iniciais(user.nome)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {/* key: trocar de rota reinicia a página mesmo depois de um erro */}
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PaginaCarregando />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
