import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ROUTES, ROUTE_ROLES, type RouteKey } from '@/config/routes'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

// Cada tela vira um pacote separado: o mapa (Leaflet) só baixa quando preciso.
const Home = lazy(() => import('@/pages/home/HomePage'))
const Perfil = lazy(() => import('@/pages/perfil/PerfilPage'))
const Empresas = lazy(() => import('@/pages/empresas/EmpresasPage'))
const Usuarios = lazy(() => import('@/pages/usuarios/UsuariosPage'))
const Propriedades = lazy(() => import('@/pages/propriedades/PropriedadesPage'))
const Culturas = lazy(() => import('@/pages/culturas/CulturasPage'))
const Cultivos = lazy(() => import('@/pages/cultivos/CultivosPage'))
const Sensores = lazy(() => import('@/pages/sensores/SensoresPage'))
const LeiturasAlertas = lazy(() => import('@/pages/leituras-alertas/LeiturasAlertasPage'))
const Previsao = lazy(() => import('@/pages/previsao/PrevisaoPage'))
const Mercado = lazy(() => import('@/pages/mercado/MercadoPage'))
const Configuracoes = lazy(() => import('@/pages/configuracoes/ConfiguracoesPage'))
const Login = lazy(() => import('@/pages/login/LoginPage'))
const NotFound = lazy(() => import('@/pages/NotFoundPage'))

type PaginaKey = Exclude<RouteKey, 'login' | 'home'>

/** Telas com controle de acesso; os papéis vêm de ROUTE_ROLES. */
const PAGINAS: { key: PaginaKey; element: React.ReactNode }[] = [
  { key: 'perfil', element: <Perfil /> },
  { key: 'empresas', element: <Empresas /> },
  { key: 'usuarios', element: <Usuarios /> },
  { key: 'propriedades', element: <Propriedades /> },
  { key: 'culturas', element: <Culturas /> },
  { key: 'cultivos', element: <Cultivos /> },
  { key: 'sensores', element: <Sensores /> },
  { key: 'leiturasAlertas', element: <LeiturasAlertas /> },
  { key: 'previsao', element: <Previsao /> },
  { key: 'mercado', element: <Mercado /> },
  { key: 'configuracoes', element: <Configuracoes /> },
]

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />

          {PAGINAS.map(({ key, element }) => (
            <Route key={key} element={<RoleRoute allowed={ROUTE_ROLES[key]} />}>
              <Route path={ROUTES[key]} element={element} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
