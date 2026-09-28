import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import CampoCoordenadas from '../../components/CampoCoordenadas/CampoCoordenadas'
import CampoNumero from '../../components/CampoNumero/CampoNumero'
import MapaNasa from '../../components/MapaNasa/MapaNasa'
import SeletorImagem from '../../components/MapaNasa/SeletorImagem'
import { apiFetch } from '../../lib/api'
import {
  areaHa,
  arredondarRetangulo,
  cantosDeRetangulo,
  poligonoParaRetangulo,
  retanguloDeCantos,
  retanguloParaPoligono,
  type Lado,
  type Retangulo,
} from '../../lib/geo'
import type { ImagemDisponivel } from '../../lib/nasa'
import {
  SITUACAO_LABELS,
  nomeCultura,
  type CulturaResumo,
  type Lote,
  type Propriedade,
  type SituacaoLote,
} from './tipos'

// tamanho inicial ao marcar um lote pelo centro
const LADO_INICIAL_M = 100

/** cantos: 2 cantos de um lado (GPS) + profundidade; medidas: centro + tamanho + rotação */
type Modo = 'cantos' | 'medidas'

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

function cantosIniciais(r: Retangulo | null): Cantos {
  if (!r) return cantosVazios
  const { c1, c2, profundidade, lado } = cantosDeRetangulo(r)
  return { c1, c2, profundidade: String(Math.round(profundidade * 10) / 10), lado }
}

/** Retângulo dos cantos, ou null enquanto faltar algum dado. */
function calcularCantos(c: Cantos): Retangulo | null {
  const profundidade = Number(c.profundidade.replace(',', '.'))
  if (!completa(c.c1) || !completa(c.c2) || !(profundidade > 0)) return null
  return retanguloDeCantos(
    c.c1 as { lat: number; lng: number },
    c.c2 as { lat: number; lng: number },
    profundidade,
    c.lado,
  )
}

const retanguloInicial = (lat: number, lng: number): Retangulo => ({
  lat,
  lng,
  largura: LADO_INICIAL_M,
  comprimento: LADO_INICIAL_M,
  rotacao: 0,
})

const coordenadas = (p: Propriedade | undefined) =>
  p?.latitude != null && p.longitude != null
    ? { lat: p.latitude, lng: p.longitude }
    : null

type Props = {
  propriedades: Propriedade[]
  culturas: CulturaResumo[]
  /** Lote em edição; ausente no cadastro. */
  lote?: Lote
  onSalvo: (lote: Lote) => void
  onCancelar: () => void
}

function LoteForm({ propriedades, culturas, lote, onSalvo, onCancelar }: Props) {
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
  const [retangulo, setRetangulo] = useState<Retangulo | null>(() =>
    lote?.geometria ? poligonoParaRetangulo(lote.geometria) : null,
  )
  const [modo, setModo] = useState<Modo>('cantos')
  const [cantos, setCantos] = useState<Cantos>(() => cantosIniciais(retangulo))
  // centro digitado antes de o retângulo existir (uma coordenada por vez)
  const [centroDigitado, setCentroDigitado] = useState<{
    lat: number | null
    lng: number | null
  }>({ lat: null, lng: null })
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // sem safra em andamento: cultura, datas e situação vêm da última safra
  const colhido = !!lote && lote.safra_atual_id === null
  const propriedade = propriedades.find((p) => p.id === Number(propriedadeId))
  // culturas da plataforma e da empresa dona da propriedade
  const culturasDisponiveis = culturas.filter(
    (c) => !c.empresa || c.empresa.id === propriedade?.empresa_id,
  )
  const cultura = culturasDisponiveis.find((c) => c.id === Number(culturaId))
  const centroPropriedade = coordenadas(propriedade)


  const poligono = useMemo(
    () => (retangulo ? retanguloParaPoligono(retangulo) : null),
    [retangulo],
  )
  const centroMapa = retangulo ?? centroPropriedade

  function atualizarCantos(novos: Cantos) {
    setCantos(novos)
    setRetangulo(calcularCantos(novos))
  }

  function trocarModo(novo: Modo) {
    if (novo === modo) return
    // leva o retângulo atual para o outro modo
    if (novo === 'cantos') setCantos(cantosIniciais(retangulo))
    else if (retangulo) setRetangulo(arredondarRetangulo(retangulo))
    setModo(novo)
  }

  /**
   * Clique ou arraste no mapa. Medidas: move o centro. Cantos: preenche o
   * canto que falta; com o retângulo pronto, desloca os dois cantos juntos.
   */
  function clicarMapa(lat: number, lng: number) {
    if (modo === 'medidas') {
      setRetangulo((atual) => (atual ? { ...atual, lat, lng } : retanguloInicial(lat, lng)))
      return
    }
    if (retangulo) {
      const [dLat, dLng] = [lat - retangulo.lat, lng - retangulo.lng]
      const deslocar = (c: CoordenadaParcial) => ({ lat: c.lat! + dLat, lng: c.lng! + dLng })
      atualizarCantos({ ...cantos, c1: deslocar(cantos.c1), c2: deslocar(cantos.c2) })
    } else if (!completa(cantos.c1)) atualizarCantos({ ...cantos, c1: { lat, lng } })
    else if (!completa(cantos.c2)) atualizarCantos({ ...cantos, c2: { lat, lng } })
  }

  /**
   * Coordenadas digitadas: sem retângulo, ele é criado quando as duas estão
   * preenchidas; com retângulo, move o centro (campo incompleto é ignorado).
   */
  function digitarCentro(lat: number | null, lng: number | null) {
    if (lat === null || lng === null) {
      if (!retangulo) setCentroDigitado({ lat, lng })
      return
    }
    setRetangulo((atual) =>
      atual ? { ...atual, lat, lng } : retanguloInicial(lat, lng),
    )
  }

  function alterar(campo: keyof Retangulo, valor: number) {
    setRetangulo((atual) => (atual ? { ...atual, [campo]: valor } : atual))
  }

  const previsaoEstimada =
    !previsao && dataPlantio && cultura?.ciclo_medio_dias
      ? new Date(
          new Date(`${dataPlantio}T12:00:00`).getTime() +
            cultura.ciclo_medio_dias * 86_400_000,
        ).toLocaleDateString('pt-BR')
      : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!propriedade) return setErro('Selecione a propriedade do lote.')
    if (!cultura) return setErro('Selecione a cultura do lote.')
    const cantosIniciados =
      cantos.c1.lat !== null || cantos.c1.lng !== null || cantos.c2.lat !== null ||
      cantos.c2.lng !== null || cantos.profundidade.trim() !== ''
    if (modo === 'cantos' && !retangulo && cantosIniciados)
      return setErro(
        'Complete os dois cantos e a profundidade (com pelo menos 1 m entre os cantos), ou deixe a localização em branco.',
      )

    const area = areaManual.replace(',', '.').trim()
    setErro('')
    setSalvando(true)
    try {
      const salvo = await apiFetch<Lote>(lote ? `/lotes/${lote.id}` : '/lotes', {
        method: lote ? 'PATCH' : 'POST',
        body: JSON.stringify({
          nome_identificacao: nome,
          propriedade_id: propriedade.id,
          cultura_id: cultura.id,
          data_plantio: dataPlantio || null,
          previsao_colheita: previsao || null,
          situacao,
          geometria: poligono,
          area_ha: poligono || area === '' ? null : Number(area),
        }),
      })
      onSalvo(salvo)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (culturas.length === 0)
    return (
      <div className="form-card">
        <p className="form-error">
          Nenhuma cultura cadastrada. Cadastre as culturas na página Culturas
          antes de criar lotes.
        </p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar}>
            Fechar
          </button>
        </div>
      </div>
    )

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-mapa">
        <div className="form-mapa__campos">
      <div className="form-grid">
        <label className="form-field">
          <span>Identificação *</span>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            maxLength={50}
            placeholder="Lote A1"
            required
            autoFocus
          />
        </label>
        <label className="form-field">
          <span>Propriedade *</span>
          <select value={propriedadeId} onChange={(event) => setPropriedadeId(event.target.value)}>
            <option value="">Selecione...</option>
            {propriedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.municipio}/{p.estado}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Cultura *</span>
          <select value={culturaId} onChange={(event) => setCulturaId(event.target.value)} disabled={colhido}>
            <option value="">Selecione...</option>
            {culturasDisponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {nomeCultura(c)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Data de plantio</span>
          <input type="date" value={dataPlantio} onChange={(event) => setDataPlantio(event.target.value)} disabled={colhido} />
        </label>
        <label className="form-field">
          <span>Previsão de colheita</span>
          <input
            type="date"
            value={previsao}
            min={dataPlantio || undefined}
            onChange={(event) => setPrevisao(event.target.value)}
            disabled={colhido}
          />
        </label>
        <label className="form-field">
          <span>Situação</span>
          <select
            value={situacao}
            onChange={(event) => setSituacao(event.target.value as SituacaoLote)}
            disabled={colhido}
          >
            {/* "Colhido" só pelo histórico, ao registrar a colheita */}
            {(colhido ? ['COLHIDO'] : ['EM_PREPARO', 'EM_CULTIVO']).map((valor) => (
              <option key={valor} value={valor}>
                {SITUACAO_LABELS[valor as SituacaoLote]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {colhido && (
        <p className="form-hint">
          Lote colhido: a cultura e as datas são da última safra. Para plantar de
          novo, use Histórico → Iniciar nova safra.
        </p>
      )}
      {!colhido && lote && (
        <p className="form-hint">
          A cultura e as datas são da safra em andamento. Para encerrá-la, use
          Histórico → Registrar colheita.
        </p>
      )}
      {previsaoEstimada && (
        <p className="form-hint">
          Sem previsão informada, será usada a estimativa pelo ciclo da cultura:{' '}
          {previsaoEstimada}.
        </p>
      )}

      <fieldset className="lote-mapa">
        <legend>Localização do lote</legend>

        <div className="lote-modo" role="tablist" aria-label="Como delimitar o lote">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'cantos'}
            className={modo === 'cantos' ? 'lote-modo__opcao lote-modo__opcao--ativa' : 'lote-modo__opcao'}
            onClick={() => trocarModo('cantos')}
          >
            Cantos (GPS)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'medidas'}
            className={modo === 'medidas' ? 'lote-modo__opcao lote-modo__opcao--ativa' : 'lote-modo__opcao'}
            onClick={() => trocarModo('medidas')}
          >
            Centro e medidas
          </button>
        </div>

        {modo === 'cantos' ? (
          <div className="lote-cantos">
            <p className="form-hint">
              Fique num canto do lote e anote a coordenada do GPS (canto 1). Ande
              ao longo de um dos lados até o canto seguinte (canto 2). Depois
              informe a profundidade do lote e para que lado ela fica.
            </p>
            <CampoCoordenadas
              rotuloLat="Canto 1 — latitude"
              rotuloLng="Canto 1 — longitude"
              lat={cantos.c1.lat}
              lng={cantos.c1.lng}
              onChange={(lat, lng) => atualizarCantos({ ...cantos, c1: { lat, lng } })}
            />
            <CampoCoordenadas
              rotuloLat="Canto 2 — latitude"
              rotuloLng="Canto 2 — longitude"
              lat={cantos.c2.lat}
              lng={cantos.c2.lng}
              onChange={(lat, lng) => atualizarCantos({ ...cantos, c2: { lat, lng } })}
              dica={false}
            />
            <div className="lote-mapa__campos">
              <label className="form-field">
                <span>Profundidade (m)</span>
                <input
                  type="number"
                  min={1}
                  max={20000}
                  step="0.1"
                  value={cantos.profundidade}
                  onChange={(event) => atualizarCantos({ ...cantos, profundidade: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Lado da profundidade</span>
                <select
                  value={cantos.lado}
                  onChange={(event) => atualizarCantos({ ...cantos, lado: event.target.value as Lado })}
                >
                  <option value="esquerda">À esquerda (olhando do canto 1 para o 2)</option>
                  <option value="direita">À direita (olhando do canto 1 para o 2)</option>
                </select>
              </label>
            </div>
            {retangulo && (
              <p className="lote-mapa__area">
                Lado 1–2: <strong>{Math.round(retangulo.largura).toLocaleString('pt-BR')} m</strong> ·
                Profundidade: <strong>{Math.round(retangulo.comprimento).toLocaleString('pt-BR')} m</strong> ·
                Área: <strong>{areaHa(retangulo).toLocaleString('pt-BR')} ha</strong>
                <button type="button" onClick={() => atualizarCantos(cantosVazios)}>
                  Limpar cantos
                </button>
              </p>
            )}
          </div>
        ) : (
          <>
            <CampoCoordenadas
              rotuloLat="Latitude do centro"
              rotuloLng="Longitude do centro"
              lat={retangulo?.lat ?? centroDigitado.lat}
              lng={retangulo?.lng ?? centroDigitado.lng}
              onChange={digitarCentro}
            />
            {retangulo ? (
          <>
            <div className="lote-mapa__campos">
              <CampoNumero rotulo="Largura (m)" valor={retangulo.largura} passo={5} min={1} max={20000} onChange={(v) => alterar('largura', v)} />
              <CampoNumero rotulo="Comprimento (m)" valor={retangulo.comprimento} passo={5} min={1} max={20000} onChange={(v) => alterar('comprimento', v)} />
            </div>

            <label className="form-field lote-mapa__rotacao">
              <span>Rotação: {retangulo.rotacao}°</span>
              <input
                type="range"
                min={-90}
                max={90}
                step={1}
                value={retangulo.rotacao}
                onChange={(event) => alterar('rotacao', Number(event.target.value))}
              />
            </label>

            <p className="lote-mapa__area">
              Área: <strong>{areaHa(retangulo).toLocaleString('pt-BR')} ha</strong>
              <button
                type="button"
                onClick={() => {
                  setRetangulo(null)
                  setCentroDigitado({ lat: null, lng: null })
                }}
              >
                Remover do mapa
              </button>
            </p>
          </>
        ) : (
          <p className="form-hint">
            Informe as coordenadas do centro do lote (ou clique no mapa) para
            desenhar o retângulo.
          </p>
        )}

          </>
        )}

        {!retangulo && (
          <label className="form-field lote-mapa__area-manual">
            <span>Área (ha) — se não for marcar no mapa</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={areaManual}
              onChange={(event) => setAreaManual(event.target.value)}
            />
          </label>
        )}

      </fieldset>

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : lote ? 'Salvar alterações' : 'Cadastrar lote'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
        </div>

        <aside className="form-mapa__mapa">
          <MapaNasa
            centro={centroMapa}
            poligono={poligono}
            imagem={imagem}
            referencias={referencias}
            onMoverCentro={clicarMapa}
          />
          <p className="form-hint">
            {modo === 'cantos'
              ? 'Clique no mapa para preencher o canto que falta; com o lote pronto, arraste o ponto roxo para deslocá-lo.'
              : 'Clique no mapa ou arraste o ponto roxo para mover o lote.'}{' '}
            As imagens são da NASA (30 m por pixel), por isso aparecem pixeladas em
            zoom alto.
          </p>

          <div className="lote-mapa__imagens">
            <label className="lote-mapa__referencias">
              <input type="checkbox" checked={referencias} onChange={(event) => setReferencias(event.target.checked)} />
              Estradas e limites
            </label>
            {centroMapa && (
              <SeletorImagem lat={centroMapa.lat} lng={centroMapa.lng} selecionada={imagem} onSelecionar={setImagem} />
            )}
          </div>
        </aside>
      </div>
    </form>
  )
}

export default LoteForm
