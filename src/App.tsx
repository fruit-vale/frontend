import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Login from './pages/Login/Login'
import Cultivos from './pages/Cultivos/Cultivos'
import Plantacoes from './pages/Plantacoes/Plantacoes'
import Sensores from './pages/Sensores/Sensores'
import LeiturasAlertas from './pages/LeiturasAlertas/LeiturasAlertas'
import Previsao from './pages/Previsao/Previsao'

function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="cultivos" element={<Cultivos />} />
        <Route path="plantacoes" element={<Plantacoes />} />
        <Route path="sensores" element={<Sensores />} />
        <Route
          path="leituras-alertas"
          element={<LeiturasAlertas />}
        />
        <Route
          path="previsao"
          element={<Previsao />}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App