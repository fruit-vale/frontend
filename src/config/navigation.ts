import {
  BellRingIcon,
  BuildingIcon,
  CloudSunIcon,
  HomeIcon,
  LandPlotIcon,
  LeafIcon,
  RadioTowerIcon,
  SproutIcon,
  TrendingUpIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES, ROUTE_ROLES, type RouteKey } from './routes'
import type { Role } from '@/types/auth'

export type NavItem = {
  key: Exclude<RouteKey, 'login'>
  to: string
  label: string
  /** dica ao passar o mouse: o que se faz na tela */
  hint: string
  icon: LucideIcon
  /** só "/" precisa de match exato para não ficar sempre ativo */
  end?: boolean
  roles: Role[]
}

export type NavSection = {
  title: string | null
  /** subtítulo da seção, só para o administrador */
  adminHint?: string
  items: NavItem[]
}

const item = (
  key: NavItem['key'],
  label: string,
  hint: string,
  icon: LucideIcon,
  end?: boolean,
): NavItem => ({
  key,
  to: ROUTES[key],
  label,
  hint,
  icon,
  end,
  roles: ROUTE_ROLES[key],
})

// Os cadastros seguem a ordem em que precisam ser feitos (a mesma do guia
// "Primeiros passos" da tela inicial): cada um depende do anterior.
export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      item(
        'home',
        'Início',
        'Resumo da operação, gráfico dos sensores e alertas recentes',
        HomeIcon,
        true,
      ),
    ],
  },
  {
    title: 'Cadastros',
    adminHint: 'na ordem de configuração',
    items: [
      item('empresas', 'Empresas', 'Os clientes da plataforma: tudo pertence a uma empresa', BuildingIcon),
      item('usuarios', 'Usuários', 'Contas de acesso: produtores de cada empresa e analistas', UsersIcon),
      item('propriedades', 'Propriedades', 'Fazendas e sítios das empresas, com a localização no mapa', WarehouseIcon),
      item('culturas', 'Culturas', 'O que é plantado e a faixa ideal usada nos alertas', SproutIcon),
      item('cultivos', 'Cultivos e Lotes', 'Áreas plantadas no mapa e o histórico de safras de cada uma', LandPlotIcon),
      item('sensores', 'Sensores', 'Dispositivos dos lotes: credenciais e dados que enviam', RadioTowerIcon),
    ],
  },
  {
    title: 'Acompanhamento',
    items: [
      item('leiturasAlertas', 'Leituras e Alertas', 'Leituras recebidas dos sensores e alertas fora da faixa ideal', BellRingIcon),
      item('previsao', 'Previsão de Colheita', 'Estimativa de quando cada lote fica pronto para colher', CloudSunIcon),
      item('mercado', 'Mercado e Exportação', 'Preços e dados de exportação das frutas', TrendingUpIcon),
    ],
  },
]

export const BRAND_ICON = LeafIcon
