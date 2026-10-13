import { useState } from 'react'
import type { FormEvent } from 'react'
import { ContornoCampos } from '@/components/map/ContornoEditor'
import { ImageryControls } from '@/components/map/ImageryControls'
import MapaNasa, { type LoteNoMapa } from '@/components/map/MapaNasa'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { useContorno } from '@/hooks/use-contorno'
import { numeroOuNull } from '@/lib/format'
import { centroPoligono, poligonoDentro } from '@/lib/geo'
import { lotesService } from '@/services'
import type { ImagemDisponivel } from '@/services/nasa.service'
import { nomeCultura, type CulturaResumo } from '@/types/cultura'
import { SITUACAO_LABELS, type Lote, type SituacaoLote } from '@/types/lote'
import type { Propriedade } from '@/types/propriedade'
import { googleDisponivel } from '@/services/google-tiles.service'

/** Plantio + ciclo médio da cultura, como "AAAA-MM-DD" (meio-dia: sem erro de fuso). */
const somarCiclo = (plantio: string, dias: number) =>
  new Date(new Date(`${plantio}T12:00:00`).getTime() + dias * 86_400_000).toLocaleDateString('sv-SE')

const coordenadas = (p: Propriedade | undefined) =>
  p?.latitude != null && p.longitude != null ? { lat: p.latitude, lng: p.longitude } : null

type Props = {
  propriedades: Propriedade[]
  culturas: CulturaResumo[]
  /** Todos os lotes: os da mesma propriedade aparecem no mapa como referência. */
  lotes: Lote[]
  /** Lote em edição; ausente no cadastro. */
  lote?: Lote
  onSalvo: (lote: Lote, novo: boolean) => void
  onCancelar: () => void
}

export function LoteForm({ propriedades, culturas, lotes, lote, onSalvo, onCancelar }: Props) {
  const [nome, setNome] = useState(lote?.nome_identificacao ?? '')
  const [propriedadeId, setPropriedadeId] = useState(
    String(lote?.propriedade.id ?? (propriedades.length === 1 ? propriedades[0].id : '')),
  )
  const [culturaId, setCulturaId] = useState(String(lote?.cultura.id ?? ''))
  const [dataPlantio, setDataPlantio] = useState(lote?.data_plantio ?? '')
  const [previsao, setPrevisao] = useState(lote?.previsao_colheita ?? '')
  // a previsão acompanha cultura e plantio até a pessoa digitar uma data
  const [previsaoManual, setPrevisaoManual] = useState(false)
  const [situacao, setSituacao] = useState<SituacaoLote>(lote?.situacao ?? 'EM_CULTIVO')
  const [areaManual, setAreaManual] = useState(
    lote && !lote.geometria && lote.area_ha !== null ? String(lote.area_ha) : '',
  )
  const contorno = useContorno(lote?.geometria ?? null)
  const poligono = contorno.poligono
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  // sem safra em andamento: cultura, datas e situação vêm da última safra
  const colhido = !!lote && lote.safra_atual_id === null
  const propriedade = propriedades.find((p) => p.id === Number(propriedadeId))
  // culturas da plataforma e da empresa dona da propriedade
  const culturasDisponiveis = culturas.filter(
    (c) => !c.empresa || c.empresa.id === propriedade?.empresa_id,
  )
  const cultura = culturasDisponiveis.find((c) => c.id === Number(culturaId))
  const centroMapa = poligono ? centroPoligono(poligono) : coordenadas(propriedade)
  // o lote é parte da propriedade: o contorno precisa caber na área dela
  const limite = propriedade?.geometria ?? null
  const foraDaPropriedade = !!(poligono && limite && !poligonoDentro(poligono, limite))

  // os outros lotes da propriedade, para não desenhar um por cima do outro
  const vizinhos: LoteNoMapa[] = lotes
    .filter((l) => l.propriedade.id === propriedade?.id && l.id !== lote?.id && l.geometria)
    .map((l) => ({ id: l.id, nome: l.nome_identificacao, poligono: l.geometria! }))

  /** Recalcula a previsão pela cultura e o plantio (se a pessoa não digitou uma). */
  function preverColheita(plantio: string, idCultura: string) {
    if (previsaoManual) return
    const ciclo = culturasDisponiveis.find((c) => c.id === Number(idCultura))?.ciclo_medio_dias
    if (plantio && ciclo) setPrevisao(somarCiclo(plantio, ciclo))
  }

  const previsaoPeloCiclo =
    !previsaoManual && dataPlantio && cultura?.ciclo_medio_dias && previsao === somarCiclo(dataPlantio, cultura.ciclo_medio_dias)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!propriedade) return setErroLocal('Selecione a propriedade do lote.')
    if (!cultura) return setErroLocal('Selecione a cultura do lote.')
    if (contorno.cantosIncompletos)
      return setErroLocal(
        'Complete os dois cantos e a profundidade (com pelo menos 1 m entre os cantos), ou deixe a localização em branco.',
      )
    if (foraDaPropriedade)
      return setErroLocal(`O lote precisa ficar dentro da área da propriedade ${propriedade.nome}.`)
    setErroLocal('')

    const payload = {
      nome_identificacao: nome,
      propriedade_id: propriedade.id,
      cultura_id: cultura.id,
      data_plantio: dataPlantio || null,
      previsao_colheita: previsao || null,
      situacao,
      geometria: poligono,
      area_ha: poligono ? null : numeroOuNull(areaManual),
    }
    const salvo = await run(() =>
      lote ? lotesService.atualizar(lote.id, payload) : lotesService.criar(payload),
    )
    if (salvo) onSalvo(salvo, !lote)
  }

  if (culturas.length === 0)
    return (
      <div className="flex flex-col gap-4">
        <ErrorMessage message="Nenhuma cultura cadastrada. Cadastre as culturas na página Culturas antes de criar lotes." />
        <div>
          <Button variant="outline" size="lg" onClick={onCancelar}>
            Fechar
          </Button>
        </div>
      </div>
    )

  const opcoesSituacao = (colhido ? ['COLHIDO'] : ['EM_PREPARO', 'EM_CULTIVO']).map((valor) => ({
    value: valor,
    // "Colhido" só pelo histórico, ao registrar a colheita
    label: SITUACAO_LABELS[valor as SituacaoLote],
  }))

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      onSubmit={enviar}
      noValidate
    >
      <div className="flex flex-col gap-5">
        <FormGrid>
          <FormField label="Identificação" htmlFor="identificacao" required>
            <Input
              id="identificacao"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={50}
              placeholder="Lote A1"
              required
              autoFocus
            />
          </FormField>
          <FormField label="Propriedade" htmlFor="propriedade" required>
            <SelectField
              id="propriedade"
              value={propriedadeId}
              onValueChange={setPropriedadeId}
              options={propriedades.map((p) => ({
                value: String(p.id),
                label: `${p.nome} — ${p.municipio}/${p.estado}`,
              }))}
            />
          </FormField>
          <FormField label="Cultura" htmlFor="cultura" required>
            <SelectField
              id="cultura"
              value={culturaId}
              onValueChange={(v) => {
                setCulturaId(v)
                preverColheita(dataPlantio, v)
              }}
              disabled={colhido}
              options={culturasDisponiveis.map((c) => ({
                value: String(c.id),
                label: nomeCultura(c),
              }))}
            />
          </FormField>
        </FormGrid>

        <FormGrid>
          <FormField label="Data de plantio" htmlFor="plantio">
            <Input
              id="plantio"
              type="date"
              value={dataPlantio}
              onChange={(e) => {
                setDataPlantio(e.target.value)
                preverColheita(e.target.value, culturaId)
              }}
              disabled={colhido}
            />
          </FormField>
          <FormField label="Previsão de colheita" htmlFor="previsao">
            <Input
              id="previsao"
              type="date"
              value={previsao}
              min={dataPlantio || undefined}
              onChange={(e) => {
                setPrevisao(e.target.value)
                // apagou a data: volta a calcular pelo ciclo
                setPrevisaoManual(e.target.value !== '')
              }}
              disabled={colhido}
            />
          </FormField>
          <FormField label="Situação" htmlFor="situacao">
            <SelectField
              id="situacao"
              value={situacao}
              onValueChange={(v) => setSituacao(v as SituacaoLote)}
              options={opcoesSituacao}
              disabled={colhido}
            />
          </FormField>
        </FormGrid>

        {colhido && (
          <Hint>
            Lote colhido: a cultura e as datas são da última safra. Para plantar de novo,
            use Histórico → Iniciar nova safra.
          </Hint>
        )}
        {!colhido && lote && (
          <Hint>
            A cultura e as datas são da safra em andamento. Para encerrá-la, use Histórico
            → Registrar colheita.
          </Hint>
        )}
        {!colhido && previsaoPeloCiclo && (
          <Hint>
            Previsão calculada pelo ciclo médio da cultura ({cultura!.ciclo_medio_dias} dias
            depois do plantio). Você pode mudar a data.
          </Hint>
        )}
        {!colhido && dataPlantio && cultura && !cultura.ciclo_medio_dias && !previsao && (
          <Hint>
            Esta cultura não tem ciclo médio cadastrado: informe a previsão de colheita ou
            cadastre o ciclo em Culturas.
          </Hint>
        )}

        <ContornoCampos
          editor={contorno}
          entidade="lote"
          legenda="Localização do lote"
          erro={
            foraDaPropriedade
              ? `O lote passa da área da propriedade ${propriedade?.nome}. Arraste os cantos para dentro do contorno verde-água.`
              : undefined
          }
          semContorno={
            <FormField label="Área (ha) — se não for marcar no mapa" htmlFor="area-manual">
              <Input
                id="area-manual"
                type="number"
                min={0}
                step="0.01"
                value={areaManual}
                onChange={(e) => setAreaManual(e.target.value)}
              />
            </FormField>
          }
        />

        <ErrorMessage message={erroLocal || error} />

        <FormActions
          submitLabel={lote ? 'Salvar alterações' : 'Cadastrar lote'}
          pending={pending}
          onCancel={onCancelar}
        />
      </div>

      <aside className="flex min-w-0 flex-col gap-3">
        <MapaNasa
          className="h-[26rem] lg:h-[34rem]"
          centro={centroMapa}
          {...contorno.mapa}
          limite={limite}
          lotes={vizinhos}
          imagem={imagem}
          referencias={referencias}
        />
        <Hint>
          {limite && 'A área da propriedade aparece com o contorno verde-água: o lote precisa ficar dentro dela, e os cantos encaixam na divisa. '}
          {vizinhos.length > 0 && 'Os outros lotes da propriedade aparecem tracejados. '}
          {googleDisponivel
            ? 'Aproxime bem o mapa para marcar os cantos com precisão. As imagens da NASA, abaixo, mostram datas recentes, mas em baixa resolução (30 m por pixel).'
            : 'As imagens são da NASA (30 m por pixel), por isso aparecem pixeladas em zoom alto.'}
        </Hint>
        <ImageryControls
          centro={centroMapa}
          imagem={imagem}
          onImagemChange={setImagem}
          referencias={referencias}
          onReferenciasChange={setReferencias}
        />
      </aside>
    </form>
  )
}
