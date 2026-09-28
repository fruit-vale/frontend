import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import ErroPagina from '../components/ErroPagina/ErroPagina'
import Sidebar from '../components/Sidebar/Sidebar'
import './AppLayout.css'

function AppLayout() {
  const location = useLocation()
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="app-layout">
      <header className="app-header">
        <button
          type="button"
          className="app-header__menu"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileNavOpen}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5.5h14M3 10h14M3 14.5h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <span className="app-header__brand">Fruitvale</span>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="app-layout__backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        hidden={sidebarHidden}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <button
        type="button"
        className={
          sidebarHidden
            ? 'sidebar-toggle sidebar-toggle--collapsed'
            : 'sidebar-toggle'
        }
        onClick={() => setSidebarHidden((prev) => !prev)}
        aria-pressed={sidebarHidden}
        aria-label={sidebarHidden ? 'Mostrar menu' : 'Esconder menu'}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 3.5 6.2 8l3.8 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <main className="app-layout__content">
        <ErroPagina key={location.pathname}>
          <Outlet />
        </ErroPagina>
      </main>
    </div>
  )
}

export default AppLayout
