import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import MapaNasa from '@/components/map/MapaNasa'
import { SeletorImagem } from '@/components/map/SeletorImagem'
import { CoordinateField } from '@/components/shared/CoordinateField'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { LocalidadeFields } from '@/components/shared/LocalidadeFields'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { numeroOuNull } from '@/lib/format'
import { ibgeService, propriedadesService } from '@/services'
import type { ImagemDisponivel } from '@/services/nasa.service'
import type { Empresa } from '@/types/empresa'
import type { PropriedadeCompleta, StatusPropriedade } from '@/types/propriedade'

type Props = {
  empresas: Empresa[]
  /** Propriedade em edição; ausente no cadastro. */
  propriedade?: PropriedadeCompleta
  onSalva: (propriedade: PropriedadeCompleta, nova: boolean) => void
  onCancelar: () => void
}

const STATUS_OPTIONS = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'INATIVA', label: 'Inativa' },
]

export function PropriedadeForm({ empresas, propriedade, onSalva, onCancelar }: Props) {
  const [empresaId, setEmpresaId] = useState(String(propriedade?.empresa_id ?? ''))
  const [nome, setNome] = useState(propriedade?.nome ?? '')
  const [estado, setEstado] = useState(propriedade?.estado ?? '')
  const [municipio, setMunicipio] = useState(propriedade?.municipio ?? '')
  const [area, setArea] = useState(propriedade?.area_total_ha?.toString() ?? '')
  const [status, setStatus] = useState<StatusPropriedade>(propriedade?.status ?? 'ATIVA')
  // cada coordenada pode estar vazia enquanto o usuário digita
  const [coordenadas, setCoordenadas] = useState<{ lat: number | null; lng: number | null }>({
    lat: propriedade?.latitude ?? null,
    lng: propriedade?.longitude ?? null,
  })
  const ponto =
    coordenadas.lat !== null && coordenadas.lng !== null
      ? { lat: coordenadas.lat, lng: coordenadas.lng }
      : null
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  // contorno do estado/município escolhido: o mapa dá zoom nele
  const [contorno, setContorno] = useState<GeoJSON.GeoJsonObject | null>(null)
  const ultimaBusca = useRef(0)
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  /** Busca o contorno no IBGE; ignora respostas de escolhas anteriores. */
  function enquadrar(busca: Promise<GeoJSON.GeoJsonObject>) {
    const id = ++ultimaBusca.current
    busca
      .then((geo) => id === ultimaBusca.current && setContorno(geo))
      // sem contorno o mapa só não dá zoom; o formulário segue normal
      .catch(() => undefined)
  }

  function escolherEstado(uf: string) {
    setEstado(uf)
    setMunicipio('')
    if (uf) enquadrar(ibgeService.malhaEstado(uf))
  }

  function escolherMunicipio(nomeMunicipio: string, escolhido?: { id: number }) {
    setMunicipio(nomeMunicipio)
    if (escolhido) enquadrar(ibgeService.malhaMunicipio(escolhido.id))
    else if (estado) enquadrar(ibgeService.malhaEstado(estado))
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!propriedade && !empresaId) return setErroLocal('Selecione a empresa da propriedade.')
    if ((coordenadas.lat === null) !== (coordenadas.lng === null))
      return setErroLocal('Preencha latitude e longitude, ou deixe as duas em branco.')
    setErroLocal('')

    const payload = {
      ...(!propriedade && { empresa_id: Number(empresaId) }),
      nome,
      estado,
      municipio,
      area_total_ha: numeroOuNull(area),
      status,
      latitude: ponto?.lat ?? null,
      longitude: ponto?.lng ?? null,
    }
    const salva = await run(() =>
      propriedade
        ? propriedadesService.atualizar(propriedade.id, payload)
        : propriedadesService.criar(payload),
    )
    if (salva) onSalva(salva, !propriedade)
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" onSubmit={enviar} noValidate>
      <div className="flex flex-col gap-5">
        <FormGrid>
          <FormField label="Empresa" htmlFor="empresa" required>
            <SelectField
              id="empresa"
              value={empresaId}
              onValueChange={setEmpresaId}
              options={empresas.map((e) => ({ value: String(e.id), label: e.razao_social }))}
              // lotes, sensores e culturas dependem da empresa: não muda depois
              disabled={!!propriedade}
            />
          </FormField>
          <FormField label="Nome" htmlFor="nome" required>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
              placeholder="Fazenda Boa Vista"
              required
              autoFocus
            />
          </FormField>
        </FormGrid>

        <FormGrid>
          <LocalidadeFields
            idPrefix="propriedade"
            required
            estado={estado}
            municipio={municipio}
            onEstadoChange={escolherEstado}
            onMunicipioChange={escolherMunicipio}
          />
          <FormField label="Área total (ha)" htmlFor="area">
            <Input
              id="area"
              type="number"
              min={0}
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <SelectField
              id="status"
              value={status}
              onValueChange={(v) => setStatus(v as StatusPropriedade)}
              options={STATUS_OPTIONS}
            />
          </FormField>
        </FormGrid>

        <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">
            Localização (sede ou centro da propriedade)
          </legend>
          <CoordinateField
            idPrefix="propriedade"
            lat={coordenadas.lat}
            lng={coordenadas.lng}
            onChange={(lat, lng) => setCoordenadas({ lat, lng })}
          />
          {ponto ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setCoordenadas({ lat: null, lng: null })}
            >
              Remover localização
            </Button>
          ) : (
            <Hint>
              Escolha o estado e o município para o mapa ir até lá. Você também pode
              clicar no mapa para preencher as coordenadas. É por esse ponto que o mapa
              abre ao cadastrar os lotes da propriedade.
            </Hint>
          )}
        </fieldset>

        <ErrorMessage message={erroLocal || error} />

        <FormActions
          submitLabel={propriedade ? 'Salvar alterações' : 'Cadastrar propriedade'}
          pending={pending}
          onCancel={onCancelar}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <MapaNasa
          className="h-[26rem] lg:h-[32rem]"
          centro={null}
          poligono={null}
          ponto={ponto}
          contorno={contorno}
          imagem={imagem}
          onMoverCentro={(lat, lng) => setCoordenadas({ lat, lng })}
        />
        {ponto && (
          <SeletorImagem
            lat={ponto.lat}
            lng={ponto.lng}
            selecionada={imagem}
            onSelecionar={setImagem}
          />
        )}
      </aside>
    </form>
  )
}
