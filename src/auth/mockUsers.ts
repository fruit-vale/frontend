import type { Role } from './roles'

export type MockUser = {
  id: string
  nome: string
  email: string
  senha: string
  role: Role
}

// Usuários de demonstração — não há backend integrado ainda,
// então a autenticação valida contra esta lista local.
export const mockUsers: MockUser[] = [
  {
    id: 'u-admin-1',
    nome: 'Ana Souza',
    email: 'admin@fruitvale.com',
    senha: '123456',
    role: 'administrador',
  },
  {
    id: 'u-produtor-1',
    nome: 'Carlos Mendes',
    email: 'produtor@fruitvale.com',
    senha: '123456',
    role: 'produtor',
  },
  {
    id: 'u-analista-1',
    nome: 'Beatriz Lima',
    email: 'analista@fruitvale.com',
    senha: '123456',
    role: 'analista',
  },
]
