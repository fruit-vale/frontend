import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'
import type { Role } from '@/types/auth'

/** Só deixa passar os papéis permitidos; os demais voltam ao início. */
export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth()

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
