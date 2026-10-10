import { useMemo } from 'react'
import { FormField } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Input } from '@/components/ui/input'
import { useLocalidades } from '@/hooks/use-localidades'
import type { Municipio } from '@/services'

type Props = {
  estado: string
  municipio: string
  /** Trocar de estado já zera o município no pai. */
  onEstadoChange: (uf: string) => void
  /** Recebe também o município do IBGE (para buscar o contorno no mapa). */
  onMunicipioChange: (nome: string, municipio?: Municipio) => void
  required?: boolean
  idPrefix?: string
}

/** Estado + município em cascata (IBGE), com campos livres se o IBGE falhar. */
export function LocalidadeFields({
  estado,
  municipio,
  onEstadoChange,
  onMunicipioChange,
  required,
  idPrefix = 'local',
}: Props) {
  const { estados, municipios, falhou, carregandoMunicipios } = useLocalidades(estado)

  const opcoesEstado = useMemo(
    () => (estados ?? []).map((e) => ({ value: e.sigla, label: e.nome })),
    [estados],
  )

  const opcoesMunicipio = useMemo(() => {
    const lista = (municipios ?? []).map((m) => ({ value: m.nome, label: m.nome }))
    // mantém o município salvo mesmo que o nome no IBGE tenha mudado
    if (municipio && municipios && !municipios.some((m) => m.nome === municipio))
      lista.unshift({ value: municipio, label: municipio })
    return lista
  }, [municipios, municipio])

  const placeholderMunicipio = !estado
    ? 'Selecione o estado primeiro'
    : carregandoMunicipios
      ? 'Carregando cidades...'
      : 'Selecione...'

  return (
    <>
      <FormField label="Estado" htmlFor={`${idPrefix}-estado`} required={required}>
        {falhou ? (
          <Input
            id={`${idPrefix}-estado`}
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value.toUpperCase())}
            maxLength={2}
            placeholder="UF (ex.: PE)"
          />
        ) : (
          <SelectField
            id={`${idPrefix}-estado`}
            value={estado}
            onValueChange={onEstadoChange}
            options={opcoesEstado}
            disabled={!estados}
            placeholder={estados ? 'Selecione...' : 'Carregando estados...'}
          />
        )}
      </FormField>

      <FormField
        label="Município"
        htmlFor={`${idPrefix}-municipio`}
        required={required}
        hint={falhou ? 'Não foi possível carregar a lista do IBGE; digite manualmente.' : undefined}
      >
        {falhou ? (
          <Input
            id={`${idPrefix}-municipio`}
            value={municipio}
            onChange={(e) => onMunicipioChange(e.target.value)}
            maxLength={100}
          />
        ) : (
          <SelectField
            id={`${idPrefix}-municipio`}
            value={municipio}
            onValueChange={(nome) =>
              onMunicipioChange(nome, municipios?.find((m) => m.nome === nome))
            }
            options={opcoesMunicipio}
            disabled={!municipios}
            placeholder={placeholderMunicipio}
          />
        )}
      </FormField>
    </>
  )
}
