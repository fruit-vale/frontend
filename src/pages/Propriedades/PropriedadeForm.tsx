import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ContornoCampos } from '@/components/map/ContornoEditor'
import { ImageryControls } from '@/components/map/ImageryControls'
import MapaNasa, { type LoteNoMapa } from '@/components/map/MapaNasa'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { LocalidadeFields } from '@/components/shared/LocalidadeFields'
import { SelectField } from '@/components/shared/SelectField'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { useContorno } from '@/hooks/use-contorno'
import { centroPoligono } from '@/lib/geo'
import { ibgeService, propriedadesService } from '@/services'
import { googleDisponivel } from '@/services/google-tiles.service'
import type { ImagemDisponivel } from '@/services/nasa.service'
import type { Empresa } from '@/types/empresa'
import type { PropriedadeCompleta, StatusPropriedade } from '@/types/propriedade'

type Props = {
  empresas: Empresa[]
  /** Todas as propriedades: as da mesma empresa aparecem no mapa como referência. */
  propriedades: PropriedadeCompleta[]
  /** Propriedade em edição; ausente no cadastro. */
  propriedade?: PropriedadeCompleta
  onSalva: (propriedade: PropriedadeCompleta, nova: boolean) => void
  onCancelar: () => void
}

const STATUS_OPTIONS = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'INATIVA', label: 'Inativa' },
]

export function PropriedadeForm({ empresas, propriedades, propriedade, onSalva, onCancelar }: Props) {
  const [empresaId, setEmpresaId] = useState(String(propriedade?.empresa_id ?? ''))
  const [nome, setNome] = useState(propriedade?.nome ?? '')
  const [estado, setEstado] = useState(propriedade?.estado ?? '')
  const [municipio, setMunicipio] = useState(propriedade?.municipio ?? '')
  const [status, setStatus] = useState<StatusPropriedade>(propriedade?.status ?? 'ATIVA')
  // a área é desenhada como a dos lotes; a API calcula dela a área em ha e o ponto central
  const contorno = useContorno(propriedade?.geometria ?? null)
  const poligono = contorno.poligono
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)
  // contorno do estado/município escolhido: o mapa dá zoom nele
  const [municipioNoMapa, setMunicipioNoMapa] = useState<GeoJSON.GeoJsonObject | null>(null)
  const ultimaBusca = useRef(0)
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  const centro = poligono
    ? centroPoligono(poligono)
    : propriedade?.latitude != null && propriedade.longitude != null
      ? { lat: propriedade.latitude, lng: propriedade.longitude }
      : null
  // as outras propriedades da empresa, para não desenhar uma por cima da outra
  const vizinhas: LoteNoMapa[] = propriedades
    .filter((p) => p.empresa_id === Number(empresaId) && p.id !== propriedade?.id && p.geometria)
    .map((p) => ({ id: p.id, nome: p.nome, poligono: p.geometria! }))

  /** Busca o contorno no IBGE; ignora respostas de escolhas anteriores. */
  function enquadrar(busca: Promise<GeoJSON.GeoJsonObject>) {
    const id = ++ultimaBusca.current
    busca
      .then((geo) => id === ultimaBusca.current && setMunicipioNoMapa(geo))
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
    if (contorno.cantosIncompletos)
      return setErroLocal('Complete os dois cantos e a profundidade para fechar o retângulo.')
    if (!poligono) return setErroLocal('Desenhe a área da propriedade no mapa.')
    setErroLocal('')

    const payload = {
      ...(!propriedade && { empresa_id: Number(empresaId) }),
      nome,
      estado,
      municipio,
      status,
      geometria: poligono,
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
          <FormField label="Status" htmlFor="status">
            <SelectField
              id="status"
              value={status}
              onValueChange={(v) => setStatus(v as StatusPropriedade)}
              options={STATUS_OPTIONS}
            />
          </FormField>
        </FormGrid>

        <ContornoCampos
          editor={contorno}
          entidade="propriedade"
          legenda="Área da propriedade"
          semContorno={
            <Hint>
              Obrigatório. Escolha o estado e o município para o mapa ir até lá e desenhe a divisa
              da propriedade. A área em hectares é calculada do desenho, e os lotes vão precisar
              ficar dentro dela.
            </Hint>
          }
        />

        <ErrorMessage message={erroLocal || error} />

        <FormActions
          submitLabel={propriedade ? 'Salvar alterações' : 'Cadastrar propriedade'}
          pending={pending}
          onCancel={onCancelar}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <MapaNasa
          className="h-[26rem] lg:h-[34rem]"
          centro={centro}
          {...contorno.mapa}
          contorno={municipioNoMapa}
          lotes={vizinhas}
          imagem={imagem}
          referencias={referencias}
        />
        <Hint>
          {vizinhas.length > 0 && 'As outras propriedades da empresa aparecem tracejadas. '}
          {municipioNoMapa && 'O limite do município aparece em branco tracejado. '}
          {googleDisponivel
            ? 'Aproxime bem o mapa para marcar a divisa com precisão.'
            : 'As imagens são da NASA (30 m por pixel), por isso aparecem pixeladas em zoom alto.'}
        </Hint>
        <ImageryControls
          centro={centro}
          imagem={imagem}
          onImagemChange={setImagem}
          referencias={referencias}
          onReferenciasChange={setReferencias}
        />
      </aside>
    </form>
  )
}
