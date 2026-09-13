import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import './AppLayout.css'

function AppLayout() {
  const [sidebarHidden, setSidebarHidden] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar hidden={sidebarHidden} />

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
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
