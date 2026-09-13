export type Role = 'administrador' | 'produtor' | 'analista'

export const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  produtor: 'Produtor',
  analista: 'Analista',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  administrador:
    'Gerencia usuários, propriedades, sensores e configurações da plataforma.',
  produtor:
    'Cadastra propriedades, lotes, culturas e sensores. Acompanha dashboard e alertas dos próprios lotes.',
  analista:
    'Acompanha dashboards analíticos, dados de mercado e recomendações de exportação.',
}
