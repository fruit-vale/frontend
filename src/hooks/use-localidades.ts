import { useEffect, useState } from 'react'
import { ibgeService, type Estado, type Municipio } from '@/services'

/**
 * Estados e municípios do IBGE para os selects em cascata. Se o IBGE estiver
 * fora do ar, `falhou` fica true e a tela oferece campos de texto livres.
 */
export function useLocalidades(uf: string) {
  const [estados, setEstados] = useState<Estado[] | null>(null)
  const [falhou, setFalhou] = useState(false)
  // lista guardada junto da UF para saber se ainda é a do estado escolhido
  const [cidades, setCidades] = useState<{ uf: string; lista: Municipio[] }>()

  useEffect(() => {
    ibgeService.listarEstados().then(setEstados).catch(() => setFalhou(true))
  }, [])

  useEffect(() => {
    if (!uf || falhou) return
    let ativo = true
    ibgeService
      .listarMunicipios(uf)
      .then((lista) => ativo && setCidades({ uf, lista }))
      .catch(() => ativo && setFalhou(true))
    return () => {
      ativo = false
    }
  }, [uf, falhou])

  const municipios = cidades?.uf === uf ? cidades.lista : null

  return {
    estados,
    municipios,
    falhou,
    carregandoMunicipios: !!uf && !municipios && !falhou,
  }
}
