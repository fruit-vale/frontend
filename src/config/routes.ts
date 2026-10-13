import type { Role } from '@/types/auth'

/** Caminhos das telas — nenhum componente escreve rota "na mão". */
export const ROUTES = {
  home: '/',
  login: '/login',
  perfil: '/perfil',
  empresas: '/empresas',
  usuarios: '/usuarios',
  propriedades: '/propriedades',
  culturas: '/culturas',
  cultivos: '/cultivos',
  sensores: '/sensores',
  leiturasAlertas: '/leituras-alertas',
  previsao: '/previsao',
  analises: '/analises',
  relatorios: '/relatorios',
  mercado: '/mercado',
  configuracoes: '/configuracoes',
} as const

export type RouteKey = keyof typeof ROUTES

const TODOS: Role[] = ['administrador', 'produtor', 'analista']

/**
 * Quem pode abrir cada tela. É a única fonte: o roteador bloqueia o acesso e
 * o menu lateral esconde os itens a partir destes mesmos papéis.
 */
export const ROUTE_ROLES: Record<Exclude<RouteKey, 'login'>, Role[]> = {
  home: TODOS,
  perfil: TODOS,
  empresas: ['administrador'],
  usuarios: ['administrador'],
  propriedades: ['administrador'],
  culturas: ['administrador', 'produtor'],
  cultivos: ['administrador', 'produtor'],
  sensores: ['administrador', 'produtor'],
  leiturasAlertas: TODOS,
  previsao: TODOS,
  // análise: o produtor não vê; o analista só lê, não cadastra nem edita
  analises: ['administrador', 'analista'],
  relatorios: ['administrador', 'analista'],
  mercado: ['administrador', 'analista'],
  configuracoes: ['administrador'],
}
