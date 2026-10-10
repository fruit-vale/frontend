import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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

/** Moldura das telas autenticadas: menu lateral + conteúdo da rota. */
export function AppLayout() {
  const { pathname } = useLocation()

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
