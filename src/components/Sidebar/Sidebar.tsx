import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import './Sidebar.css'

function IconInicio() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCultivos() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7.2" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="12.6"
        cy="7"
        r="2.4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="9.5"
        cy="13"
        r="2.7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 3c1 .6 1.7 1.3 1.6 2.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPlantacoes() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3.5"
        width="14"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 8.5h14M9.5 3.5V17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconSensores() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="1.8" fill="currentColor" />
      <path
        d="M6.5 6.5a5 5 0 0 0 0 7M13.5 6.5a5 5 0 0 1 0 7M4 4a8.5 8.5 0 0 0 0 12M16 4a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconAlertas() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 8a4 4 0 0 1 8 0c0 3 1 4 1.5 4.5H4.5C5 12 6 11 6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 15a1.8 1.8 0 0 0 3.4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPrevisao() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="6.3" cy="7" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.3 3.3v.9M3.3 7h-.9M4.1 4.8l-.6-.6M8.5 4.8l.6-.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M8.5 15h5.7a2.6 2.6 0 0 0 .6-5.1 3.6 3.6 0 0 0-6.9-1.1A3 3 0 0 0 5.5 15h.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPerfil() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 17c.7-3.2 3-5 6-5s5.3 1.8 6 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconConfiguracoes() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

type NavItem = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: <IconInicio />, end: true },
  { to: '/cultivos', label: 'Cultivos e Lotes', icon: <IconCultivos /> },
  { to: '/plantacoes', label: 'Plantações', icon: <IconPlantacoes /> },
  { to: '/sensores', label: 'Sensores', icon: <IconSensores /> },
  {
    to: '/leituras-alertas',
    label: 'Leituras e Alertas',
    icon: <IconAlertas />,
  },
  {
    to: '/previsao',
    label: 'Previsão de Colheita',
    icon: <IconPrevisao />,
  },
]

type SidebarProps = {
  hidden?: boolean
}

function Sidebar({ hidden = false }: SidebarProps) {
  return (
    <aside className={hidden ? 'sidebar sidebar--hidden' : 'sidebar'}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-name">Fruitvale</span>
        <span className="sidebar__brand-rule" aria-hidden="true" />
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <Link className="sidebar__link" to="/perfil">
          <IconPerfil />
          <span>Perfil</span>
        </Link>
        <Link className="sidebar__link" to="/configuracoes">
          <IconConfiguracoes />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
