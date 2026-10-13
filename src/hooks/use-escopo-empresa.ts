import { useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'

/**
 * Recorte por empresa no front: o administrador vê todas; produtor e analista,
 * só a própria. A API já devolve os dados no escopo do usuário; isto é uma
 * segunda barreira e evita mostrar dados de outra empresa por engano.
 */
export function useEscopoEmpresa() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const empresaId = user?.empresa?.id

  return useCallback(
    <T extends { empresa: { id: number } }>(itens: T[] = []) =>
      admin ? itens : itens.filter((i) => i.empresa.id === empresaId),
    [admin, empresaId],
  )
}
