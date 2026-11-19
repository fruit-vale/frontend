import { lazy, Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'

const Landing = lazy(() => import('@/pages/landing/LandingPage'))

/**
 * Exige usuário autenticado; guarda a rota de origem para voltar após o login.
 * Visitante sem login na raiz (/) vê a landing page em vez de ir direto ao login.
 */
export function ProtectedRoute() {
  const { user, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return null

  if (!user && location.pathname === ROUTES.home) {
    return (
      <Suspense fallback={null}>
        <Landing />
      </Suspense>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
