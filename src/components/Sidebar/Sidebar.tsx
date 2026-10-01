import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ROLE_LABELS, type Role } from '../../auth/roles'
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

function IconPropriedades() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 16.5h15M4 16.5V9l4-3 4 3v7.5M12 11h4.5v5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 16.5v-3.5h2v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function IconCulturas() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17V9M10 9c0-3 2-5.5 5.5-5.5 0 3.5-2.5 5.5-5.5 5.5ZM10 12c0-2.5-1.7-4.5-4.8-4.5 0 3 2 4.5 4.8 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconUsuarios() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7" cy="6.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.6 16c.6-2.9 2.4-4.4 4.4-4.4s3.8 1.5 4.4 4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="14" cy="7" r="1.9" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12.7 11.9c1.6.1 3 1.5 3.5 4.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconEmpresas() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 17V5.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V17M11.5 9h4a1 1 0 0 1 1 1v7M2.5 17h15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.3 7.5h1.4M6.3 10.5h1.4M6.3 13.5h1.4M13.5 12h.5M13.5 14.5h.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMercado() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 16V8.5M8 16V5M13 16v-7M17 16V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2.5 16.5h15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconSair() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M8 3.5H5a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 5 16.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 13.5 16.5 10l-4-3.5M16.5 10H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type NavItem = {
  to: string
  label: string
  /** dica ao passar o mouse: o que se faz na tela */
  dica: string
  icon: ReactNode
  end?: boolean
  roles: Role[]
}

type NavSecao = {
  titulo: string | null
  /** subtítulo da seção, só para o administrador */
  dicaAdmin?: string
  itens: NavItem[]
}

const ALL_ROLES: Role[] = ['administrador', 'produtor', 'analista']

// Os cadastros seguem a ordem em que precisam ser feitos (a mesma do guia
// "Primeiros passos" da tela inicial): cada um depende do anterior.
const navSecoes: NavSecao[] = [
  {
    titulo: null,
    itens: [
      {
        to: '/',
        label: 'Início',
        dica: 'Resumo da operação, gráfico dos sensores e alertas recentes',
        icon: <IconInicio />,
        end: true,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    titulo: 'Cadastros',
    dicaAdmin: 'na ordem de configuração',
    itens: [
      {
        to: '/empresas',
        label: 'Empresas',
        dica: 'Os clientes da plataforma: tudo pertence a uma empresa',
        icon: <IconEmpresas />,
        roles: ['administrador'],
      },
      {
        to: '/usuarios',
        label: 'Usuários',
        dica: 'Contas de acesso: produtores de cada empresa e analistas',
        icon: <IconUsuarios />,
        roles: ['administrador'],
      },
      {
        to: '/propriedades',
        label: 'Propriedades',
        dica: 'Fazendas e sítios das empresas, com a localização no mapa',
        icon: <IconPropriedades />,
        roles: ['administrador'],
      },
      {
        to: '/culturas',
        label: 'Culturas',
        dica: 'O que é plantado e a faixa ideal usada nos alertas',
        icon: <IconCulturas />,
        roles: ['administrador', 'produtor'],
      },
      {
        to: '/cultivos',
        label: 'Cultivos e Lotes',
        dica: 'Áreas plantadas no mapa e o histórico de safras de cada uma',
        icon: <IconCultivos />,
        roles: ['administrador', 'produtor'],
      },
      {
        to: '/sensores',
        label: 'Sensores',
        dica: 'Dispositivos dos lotes: credenciais e dados que enviam',
        icon: <IconSensores />,
        roles: ['administrador', 'produtor'],
      },
    ],
  },
  {
    titulo: 'Acompanhamento',
    itens: [
      {
        to: '/leituras-alertas',
        label: 'Leituras e Alertas',
        dica: 'Leituras recebidas dos sensores e alertas fora da faixa ideal',
        icon: <IconAlertas />,
        roles: ALL_ROLES,
      },
      {
        to: '/previsao',
        label: 'Previsão de Colheita',
        dica: 'Estimativa de quando cada lote fica pronto para colher',
        icon: <IconPrevisao />,
        roles: ALL_ROLES,
      },
      {
        to: '/mercado',
        label: 'Mercado e Exportação',
        dica: 'Preços e dados de exportação das frutas',
        icon: <IconMercado />,
        roles: ['administrador', 'analista'],
      },
    ],
  },
]

type SidebarProps = {
  hidden?: boolean
  mobileOpen?: boolean
  onNavigate?: () => void
}

function Sidebar({ hidden = false, mobileOpen = false, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const secoesVisiveis = user
    ? navSecoes
        .map((secao) => ({ ...secao, itens: secao.itens.filter((item) => item.roles.includes(user.role)) }))
        .filter((secao) => secao.itens.length > 0)
    : []

  function handleLogout() {
    logout()
    onNavigate?.()
    navigate('/login')
  }

  const asideClassName = [
    'sidebar',
    hidden ? 'sidebar--hidden' : '',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={asideClassName}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-name">Fruitvale</span>
        <span className="sidebar__brand-rule" aria-hidden="true" />
      </div>

      {user && (
        <div className="sidebar__user">
          <span className="sidebar__user-name">{user.nome}</span>
          <span className="sidebar__user-role">{ROLE_LABELS[user.role]}</span>
        </div>
      )}

      <nav className="sidebar__nav">
        {secoesVisiveis.map((secao) => (
          <div key={secao.titulo ?? 'principal'} className="sidebar__secao">
            {secao.titulo && (
              <div className="sidebar__secao-titulo">
                <span>{secao.titulo}</span>
                {secao.dicaAdmin && user?.role === 'administrador' && (
                  <small>{secao.dicaAdmin}</small>
                )}
              </div>
            )}
            {secao.itens.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.dica}
                onClick={onNavigate}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <Link className="sidebar__link" to="/perfil" title="Seus dados e senha" onClick={onNavigate}>
          <IconPerfil />
          <span>Perfil</span>
        </Link>
        {user?.role === 'administrador' && (
          <Link
            className="sidebar__link"
            to="/configuracoes"
            title="Preferências gerais da plataforma"
            onClick={onNavigate}
          >
            <IconConfiguracoes />
            <span>Configurações</span>
          </Link>
        )}
        <button type="button" className="sidebar__link sidebar__logout" onClick={handleLogout}>
          <IconSair />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
