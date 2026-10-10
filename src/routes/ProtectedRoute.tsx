import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'

/** Exige usuário autenticado; guarda a rota de origem para voltar após o login. */
export function ProtectedRoute() {
  const { user, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return null

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
