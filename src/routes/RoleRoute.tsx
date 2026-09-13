import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '../auth/roles'
import { useAuth } from '../auth/useAuth'

type RoleRouteProps = {
  allowed: Role[]
}

function RoleRoute({ allowed }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleRoute
