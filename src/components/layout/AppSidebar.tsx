import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
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
  SidebarGroupLabel,
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

  const fecharNoCelular = () => isMobile && setOpenMobile(false)
  const ativo = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  const secoes = user
    ? NAV_SECTIONS.map((secao) => ({
        ...secao,
        items: secao.items.filter((i) => i.roles.includes(user.role)),
      })).filter((secao) => secao.items.length > 0)
    : []

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
        {secoes.map((secao) => (
          <SidebarGroup key={secao.title ?? 'principal'}>
            {secao.title && (
              <SidebarGroupLabel className="flex-col items-start justify-center gap-0 py-1 text-[0.7rem] tracking-widest uppercase">
                <span>{secao.title}</span>
                {secao.adminHint && user?.role === 'administrador' && (
                  <small className="text-[0.65rem] tracking-normal normal-case opacity-80">
                    {secao.adminHint}
                  </small>
                )}
              </SidebarGroupLabel>
            )}
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
          </SidebarGroup>
        ))}
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
