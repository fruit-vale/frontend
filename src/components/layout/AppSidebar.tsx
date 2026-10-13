import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Collapsible } from '@base-ui/react/collapsible'
import {
  ChevronDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserRoundIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BRAND_ICON, NAV_SECTIONS } from '@/config/navigation'
import { ROUTES, ROUTE_ROLES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { ROLE_LABELS } from '@/types/auth'
import type { Theme } from '@/contexts/theme-context'

// seções do menu abertas ou fechadas (só neste navegador)
const CHAVE_SECOES = 'fruitvale:menu-secoes'

function lerSecoes(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SECOES) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function gravarSecoes(secoes: Record<string, boolean>) {
  try {
    localStorage.setItem(CHAVE_SECOES, JSON.stringify(secoes))
  } catch {
    // sem armazenamento: vale só nesta visita
  }
}

const TEMAS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Escuro', icon: MoonIcon },
  { value: 'system', label: 'Sistema', icon: MonitorIcon },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const [secoesAbertas, setSecoesAbertas] = useState(lerSecoes)

  const fecharNoCelular = () => isMobile && setOpenMobile(false)
  const ativo = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  const secoes = user
    ? NAV_SECTIONS.map((secao) => ({
        ...secao,
        items: secao.items.filter((i) => i.roles.includes(user.role)),
      })).filter((secao) => secao.items.length > 0)
    : []

  // o menu do administrador é longo: as seções começam fechadas, menos a da
  // tela atual; para os outros perfis, que veem poucos itens, tudo aberto
  const abertaPorPadrao = user?.role !== 'administrador'
  function alternarSecao(titulo: string, aberta: boolean) {
    const novas = { ...secoesAbertas, [titulo]: aberta }
    setSecoesAbertas(novas)
    gravarSecoes(novas)
  }

  function sair() {
    logout()
    fecharNoCelular()
    navigate(ROUTES.login)
  }

  const TemaAtual = TEMAS.find((t) => t.value === theme)?.icon ?? SunIcon

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <BRAND_ICON className="size-6 text-sidebar-primary" aria-hidden="true" />
          <span className="font-heading text-2xl font-semibold">Fruitvale</span>
        </div>
        <span className="h-0.5 w-9 rounded bg-sidebar-primary" aria-hidden="true" />
        {user && (
          <div className="mt-2 flex flex-col">
            <span className="truncate text-sm font-semibold">{user.nome}</span>
            <span className="text-xs text-sidebar-foreground/70">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {secoes.map((secao) => {
          const itens = (
            <SidebarMenu>
              {secao.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={ativo(item.to, item.end)}
                    tooltip={item.hint}
                    render={
                      <NavLink to={item.to} end={item.end} onClick={fecharNoCelular} />
                    }
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )
          // "Início" não tem título: fica sempre à mostra
          if (!secao.title)
            return <SidebarGroup key="principal">{itens}</SidebarGroup>

          const titulo = secao.title
          const temAtiva = secao.items.some((i) => ativo(i.to, i.end))
          const aberta = secoesAbertas[titulo] ?? (abertaPorPadrao || temAtiva)
          return (
            <SidebarGroup key={titulo} className="py-1">
              <Collapsible.Root
                open={aberta}
                onOpenChange={(abrir) => alternarSecao(titulo, abrir)}
              >
                <Collapsible.Trigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sidebar-foreground/70 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[0.7rem] font-medium tracking-widest uppercase">
                      {titulo}
                    </span>
                    {secao.adminHint && user?.role === 'administrador' && (
                      <small className="text-[0.65rem] opacity-80">{secao.adminHint}</small>
                    )}
                  </span>
                  {/* fechada com a tela atual dentro: um ponto mostra onde você está */}
                  {!aberta && temAtiva && (
                    <span className="flex items-center gap-1 text-[0.65rem]">
                      <span className="size-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
                      <span className="sr-only">contém a tela atual</span>
                    </span>
                  )}
                  <span className="text-[0.65rem] tabular-nums opacity-70" aria-hidden="true">
                    {secao.items.length}
                  </span>
                  <ChevronDownIcon
                    className={`size-4 shrink-0 transition-transform duration-200 ${aberta ? '' : '-rotate-90'}`}
                    aria-hidden="true"
                  />
                </Collapsible.Trigger>
                <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden pt-1 transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                  {itens}
                </Collapsible.Panel>
              </Collapsible.Root>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={ativo(ROUTES.perfil)}
              tooltip="Seus dados e senha"
              render={<NavLink to={ROUTES.perfil} onClick={fecharNoCelular} />}
            >
              <UserRoundIcon />
              <span>Perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && ROUTE_ROLES.configuracoes.includes(user.role) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={ativo(ROUTES.configuracoes)}
                tooltip="Preferências gerais da plataforma"
                render={
                  <NavLink to={ROUTES.configuracoes} onClick={fecharNoCelular} />
                }
              >
                <SettingsIcon />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton tooltip="Aparência do sistema" />}
              >
                <TemaAtual />
                <span>Aparência</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(valor) => setTheme(valor as Theme)}
                >
                  {TEMAS.map(({ value, label, icon: Icone }) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      <Icone />
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton onClick={sair} tooltip="Encerrar a sessão">
              <LogOutIcon />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
