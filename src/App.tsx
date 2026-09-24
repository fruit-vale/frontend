import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Login from './pages/Login/Login'
import Cultivos from './pages/Cultivos/Cultivos'
import Sensores from './pages/Sensores/Sensores'
import LeiturasAlertas from './pages/LeiturasAlertas/LeiturasAlertas'
import Previsao from './pages/Previsao/Previsao'
import Usuarios from './pages/Usuarios/Usuarios'
import Empresas from './pages/Empresas/Empresas'
import Configuracoes from './pages/Configuracoes/Configuracoes'
import Mercado from './pages/Mercado/Mercado'
import Perfil from './pages/Perfil/Perfil'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'

function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="perfil" element={<Perfil />} />

          <Route
            element={<RoleRoute allowed={['administrador', 'produtor']} />}
          >
            <Route path="cultivos" element={<Cultivos />} />
            <Route path="sensores" element={<Sensores />} />
          </Route>

          <Route
            element={
              <RoleRoute allowed={['administrador', 'produtor', 'analista']} />
            }
          >
            <Route path="leituras-alertas" element={<LeiturasAlertas />} />
            <Route path="previsao" element={<Previsao />} />
          </Route>

          <Route element={<RoleRoute allowed={['administrador', 'analista']} />}>
            <Route path="mercado" element={<Mercado />} />
          </Route>

          <Route element={<RoleRoute allowed={['administrador']} />}>
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
