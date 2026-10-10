import { useState } from 'react'
import type { FormEvent } from 'react'
import { ImageryControls } from '@/components/map/ImageryControls'
import MapaNasa, { type LoteNoMapa } from '@/components/map/MapaNasa'
import { CoordinateField } from '@/components/shared/CoordinateField'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAction } from '@/hooks/use-action'
import { formatarHectares, formatarMetros, numeroOuNull } from '@/lib/format'
import {
  areaPoligonoHa,
  centroPoligono,
  perimetroM,
  retanguloDeCantos,
  retanguloParaPoligono,
  type Lado,
  type Poligono,
} from '@/lib/geo'
import { lotesService } from '@/services'
import type { ImagemDisponivel } from '@/services/nasa.service'
import { nomeCultura, type CulturaResumo } from '@/types/cultura'
import { SITUACAO_LABELS, type Lote, type SituacaoLote } from '@/types/lote'
import type { Propriedade } from '@/types/propriedade'
import { googleDisponivel } from '@/services/google-tiles.service'

/** desenhar: contorno livre no mapa; gps: retângulo por 2 cantos + profundidade */
type Modo = 'desenhar' | 'gps'

type CoordenadaParcial = { lat: number | null; lng: number | null }
type Cantos = {
  c1: CoordenadaParcial
  c2: CoordenadaParcial
  profundidade: string
  lado: Lado
}

const VAZIO: CoordenadaParcial = { lat: null, lng: null }
const cantosVazios: Cantos = { c1: VAZIO, c2: VAZIO, profundidade: '', lado: 'esquerda' }

const completa = (c: CoordenadaParcial) => c.lat !== null && c.lng !== null

/** Contorno dos cantos do GPS, ou null enquanto faltar algum dado. */
function calcularCantos(c: Cantos): Poligono | null {
  const profundidade = Number(c.profundidade.replace(',', '.'))
  if (!completa(c.c1) || !completa(c.c2) || !(profundidade > 0)) return null
  const retangulo = retanguloDeCantos(
    c.c1 as { lat: number; lng: number },
    c.c2 as { lat: number; lng: number },
    profundidade,
    c.lado,
  )
  return retangulo && retanguloParaPoligono(retangulo)
}

const coordenadas = (p: Propriedade | undefined) =>
  p?.latitude != null && p.longitude != null ? { lat: p.latitude, lng: p.longitude } : null

const LADOS = [
  { value: 'esquerda', label: 'À esquerda (olhando do canto 1 para o 2)' },
  { value: 'direita', label: 'À direita (olhando do canto 1 para o 2)' },
]

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
  const [situacao, setSituacao] = useState<SituacaoLote>(lote?.situacao ?? 'EM_CULTIVO')
  const [areaManual, setAreaManual] = useState(
    lote && !lote.geometria && lote.area_ha !== null ? String(lote.area_ha) : '',
  )
  const [poligono, setPoligono] = useState<Poligono | null>(lote?.geometria ?? null)
  const [modo, setModo] = useState<Modo>('desenhar')
  const [cantos, setCantos] = useState<Cantos>(cantosVazios)
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

  // os outros lotes da propriedade, para não desenhar um por cima do outro
  const vizinhos: LoteNoMapa[] = lotes
    .filter((l) => l.propriedade.id === propriedade?.id && l.id !== lote?.id && l.geometria)
    .map((l) => ({ id: l.id, nome: l.nome_identificacao, poligono: l.geometria! }))

  function atualizarCantos(novos: Cantos) {
    setCantos(novos)
    const calculado = calcularCantos(novos)
    if (calculado) setPoligono(calculado)
  }

  /** No modo GPS, o clique no mapa preenche o canto que falta. */
  function clicarMapa(lat: number, lng: number) {
    if (!completa(cantos.c1)) atualizarCantos({ ...cantos, c1: { lat, lng } })
    else if (!completa(cantos.c2)) atualizarCantos({ ...cantos, c2: { lat, lng } })
  }

  function apagarContorno() {
    setPoligono(null)
    setCantos(cantosVazios)
  }

  const previsaoEstimada =
    !previsao && dataPlantio && cultura?.ciclo_medio_dias
      ? new Date(
          new Date(`${dataPlantio}T12:00:00`).getTime() + cultura.ciclo_medio_dias * 86_400_000,
        ).toLocaleDateString('pt-BR')
      : null

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!propriedade) return setErroLocal('Selecione a propriedade do lote.')
    if (!cultura) return setErroLocal('Selecione a cultura do lote.')
    const cantosIniciados =
      cantos.c1.lat !== null ||
      cantos.c1.lng !== null ||
      cantos.c2.lat !== null ||
      cantos.c2.lng !== null ||
      cantos.profundidade.trim() !== ''
    if (modo === 'gps' && !poligono && cantosIniciados)
      return setErroLocal(
        'Complete os dois cantos e a profundidade (com pelo menos 1 m entre os cantos), ou deixe a localização em branco.',
      )
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
              onValueChange={setCulturaId}
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
              onChange={(e) => setDataPlantio(e.target.value)}
              disabled={colhido}
            />
          </FormField>
          <FormField label="Previsão de colheita" htmlFor="previsao">
            <Input
              id="previsao"
              type="date"
              value={previsao}
              min={dataPlantio || undefined}
              onChange={(e) => setPrevisao(e.target.value)}
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
        {previsaoEstimada && (
          <Hint>
            Sem previsão informada, será usada a estimativa pelo ciclo da cultura:{' '}
            {previsaoEstimada}.
          </Hint>
        )}

        <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">Localização do lote</legend>

          <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)}>
            <TabsList aria-label="Como delimitar o lote">
              <TabsTrigger value="desenhar">Desenhar no mapa</TabsTrigger>
              <TabsTrigger value="gps">Retângulo pelo GPS</TabsTrigger>
            </TabsList>
          </Tabs>

          {modo === 'desenhar' ? (
            <ol className="ml-4 list-decimal space-y-0.5 text-xs text-muted-foreground">
              {poligono ? (
                <>
                  <li>Arraste os pontos brancos para ajustar os cantos.</li>
                  <li>Para criar um canto, arraste o ponto do meio de um lado.</li>
                  <li>Para apagar um canto, clique nele com o botão direito.</li>
                  <li>Para mover o lote inteiro, arraste a área amarela.</li>
                </>
              ) : (
                <>
                  <li>Aproxime o mapa até ver o talhão.</li>
                  <li>Clique em cada canto do lote, na ordem do contorno.</li>
                  <li>Para fechar, clique de novo no primeiro ponto.</li>
                </>
              )}
            </ol>
          ) : (
            <div className="flex flex-col gap-3">
              <Hint>
                Fique num canto do lote e anote a coordenada do GPS (canto 1). Ande ao
                longo de um dos lados até o canto seguinte (canto 2). Depois informe a
                profundidade do lote e para que lado ela fica. Você também pode clicar no
                mapa para marcar os cantos.
              </Hint>
              <CoordinateField
                idPrefix="canto1"
                rotuloLat="Canto 1 — latitude"
                rotuloLng="Canto 1 — longitude"
                lat={cantos.c1.lat}
                lng={cantos.c1.lng}
                onChange={(lat, lng) => atualizarCantos({ ...cantos, c1: { lat, lng } })}
              />
              <CoordinateField
                idPrefix="canto2"
                rotuloLat="Canto 2 — latitude"
                rotuloLng="Canto 2 — longitude"
                lat={cantos.c2.lat}
                lng={cantos.c2.lng}
                onChange={(lat, lng) => atualizarCantos({ ...cantos, c2: { lat, lng } })}
                dica={false}
              />
              <FormGrid>
                <FormField label="Profundidade (m)" htmlFor="profundidade">
                  <Input
                    id="profundidade"
                    type="number"
                    min={1}
                    max={20000}
                    step="0.1"
                    value={cantos.profundidade}
                    onChange={(e) =>
                      atualizarCantos({ ...cantos, profundidade: e.target.value })
                    }
                  />
                </FormField>
                <FormField label="Lado da profundidade" htmlFor="lado">
                  <SelectField
                    id="lado"
                    value={cantos.lado}
                    onValueChange={(v) => atualizarCantos({ ...cantos, lado: v as Lado })}
                    options={LADOS}
                  />
                </FormField>
              </FormGrid>
              {poligono && (
                <Hint>
                  Para ajustar os cantos à mão, volte para <strong>Desenhar no mapa</strong>.
                </Hint>
              )}
            </div>
          )}

          {poligono ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>
                {poligono.coordinates[0].length - 1} cantos · Perímetro:{' '}
                <strong className="text-foreground">{formatarMetros(perimetroM(poligono))}</strong>{' '}
                · Área:{' '}
                <strong className="text-foreground">
                  {formatarHectares(areaPoligonoHa(poligono))}
                </strong>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={apagarContorno}>
                Apagar contorno
              </Button>
            </div>
          ) : (
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
          )}
        </fieldset>

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
          poligono={poligono}
          lotes={vizinhos}
          imagem={imagem}
          referencias={referencias}
          onAlterarPoligono={modo === 'desenhar' ? setPoligono : undefined}
          onMoverCentro={modo === 'gps' ? clicarMapa : undefined}
        />
        <Hint>
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
