import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './leafletGlobal'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { poligonoDeVertices, verticesLeaflet, type Poligono } from '@/lib/geo'
import {
  ATRIBUICAO,
  URL_FUNDO,
  URL_REFERENCIAS,
  ZOOM_FUNDO,
  ZOOM_HLS,
  ZOOM_REFERENCIAS,
  urlHls,
  type ImagemDisponivel,
} from '@/services/nasa.service'
import {
  LOGO_GOOGLE,
  googleDisponivel,
  invalidarSessaoGoogle,
  sessaoGoogle,
  urlTilesGoogle,
  viewportGoogle,
} from '@/services/google-tiles.service'
import { CamadaAmpliada } from './camadaAmpliada'
import { cn } from '@/lib/utils'
import './mapa-nasa.css'

// com o Google a imagem vai a ~20 (e é ampliada além disso); a NASA, a 30 m/pixel, não passa de 17
const ZOOM_MAXIMO = googleDisponivel ? 21 : 17
// enquadramento automático num lote ou na propriedade
const ZOOM_ENQUADRAR = googleDisponivel ? 18 : 16
// zoom nativo até o viewport do Google informar o da área
const ZOOM_NATIVO_GOOGLE = 19
const ZOOM_PONTO = 15
// abaixo disso (ex.: vista do estado), um ponto novo leva o mapa até ele
const ZOOM_APROXIMAR = 12
// centro do Brasil, quando não há nenhuma coordenada
const BRASIL: [number, number] = [-14.2, -51.9]

/** Lote desenhado como referência (vizinhos) ou na visão geral. */
export type LoteNoMapa = { id: number; nome: string; poligono: Poligono }

type Props = {
  /** Ponto inicial (ex.: a propriedade), usado quando não há polígono. */
  centro: { lat: number; lng: number } | null
  poligono: Poligono | null
  /** Ponto marcado (ex.: localização da propriedade), no lugar de um polígono. */
  ponto?: { lat: number; lng: number } | null
  /** Contorno de referência (ex.: município do IBGE); o mapa enquadra nele ao mudar. */
  contorno?: GeoJSON.GeoJsonObject | null
  /**
   * Área que contém o desenho (ex.: a propriedade, ao desenhar o lote): fica em
   * destaque, enquadra o mapa e os cantos encaixam na divisa dela.
   */
  limite?: Poligono | null
  /** Outros lotes, em GeoJSON: vizinhos ao desenhar, ou todos na visão geral. */
  lotes?: LoteNoMapa[]
  /** Clique num dos `lotes` (visão geral); também deixa os nomes sempre visíveis. */
  onClicarLote?: (id: number) => void
  imagem: ImagemDisponivel | null
  referencias?: boolean
  /**
   * Edição do contorno: sem polígono, o mapa entra no modo de desenho; com ele,
   * os vértices podem ser arrastados, criados (no meio dos lados) e apagados
   * (clique direito), e o lote inteiro pode ser arrastado.
   */
  onAlterarPoligono?: (poligono: Poligono) => void
  /** Clique no mapa ou arraste do marcador `ponto`. */
  onMoverCentro?: (lat: number, lng: number) => void
  /** Altura e demais ajustes do contêiner (padrão: 360 px de altura). */
  className?: string
}

const iconeCentro = L.divIcon({
  className: 'mapa-nasa__centro',
  iconSize: [18, 18],
})

const ESTILO_LOTE: L.PathOptions = { className: 'mapa-nasa__lote', weight: 3 }

const OPCOES_EDICAO = {
  allowSelfIntersection: false,
  draggable: true,
  snappable: true,
  // apagar até sobrarem 2 vértices sumiria com o lote sem aviso
  removeLayerBelowMinVertexCount: false,
}

// ordem das camadas: fundo da NASA < satélite do Google < imagem por data < estradas e nomes
const Z_FUNDO = 0
const Z_GOOGLE = 1
const Z_HLS = 2
const Z_REFERENCIAS = 3

/**
 * Imagem de satélite do Google sobre o fundo da NASA, com a atribuição e o
 * logo exigidos pela Map Tiles API. Sem sessão (chave inválida, API desligada),
 * o mapa segue só com a NASA.
 */
function ligarGoogle(m: L.Map) {
  let camada: L.TileLayer | null = null
  let sessao = ''
  let renovou = false
  let copyright = ''
  let encerrado = false
  let consulta: AbortController | null = null
  m.on('unload', () => {
    encerrado = true
    consulta?.abort()
  })

  // o logo só entra junto com a imagem do Google (sem ela, o mapa é só NASA)
  let logo: L.Control | null = null
  const Logo = L.Control.extend({
    onAdd() {
      const img = L.DomUtil.create('img', 'mapa-nasa__logo-google') as HTMLImageElement
      img.src = LOGO_GOOGLE
      img.alt = 'Google'
      return img
    },
  })

  async function atualizarViewport() {
    if (!camada || encerrado) return
    consulta?.abort()
    consulta = new AbortController()
    const b = m.getBounds()
    try {
      const v = await viewportGoogle(
        sessao,
        m.getZoom(),
        { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() },
        consulta.signal,
      )
      if (encerrado) return
      // a atribuição muda com a região visível
      if (copyright) m.attributionControl.removeAttribution(copyright)
      copyright = v.copyright
      if (copyright) m.attributionControl.addAttribution(copyright)

      // maior zoom com imagem no centro: acima dele o tile é ampliado, em vez de vir vazio
      const c = m.getCenter()
      const maximo = Math.max(
        0,
        ...v.maxZoomRects
          .filter((r) => c.lat <= r.north && c.lat >= r.south && c.lng <= r.east && c.lng >= r.west)
          .map((r) => r.maxZoom),
      )
      if (maximo && camada.options.maxNativeZoom !== maximo) {
        camada.options.maxNativeZoom = Math.min(maximo, ZOOM_MAXIMO)
        camada.redraw()
      }
    } catch {
      // consulta cancelada ou sem resposta: mantém a atribuição anterior
    }
  }

  function criar(novaSessao: string) {
    if (encerrado) return
    sessao = novaSessao
    camada?.remove()
    camada = L.tileLayer(urlTilesGoogle(sessao), {
      maxZoom: ZOOM_MAXIMO,
      maxNativeZoom: ZOOM_NATIVO_GOOGLE,
      zIndex: Z_GOOGLE,
      className: 'camada-google',
    })
    // sessão vencida ou revogada: tenta uma nova, uma vez só
    camada.on('tileerror', () => {
      if (renovou) return
      renovou = true
      invalidarSessaoGoogle('satelite')
      sessaoGoogle('satelite').then(criar).catch(() => undefined)
    })
    camada.addTo(m)
    logo ??= new Logo({ position: 'bottomleft' }).addTo(m)
    void atualizarViewport()
  }

  m.on('moveend', () => void atualizarViewport())
  sessaoGoogle('satelite')
    .then(criar)
    .catch((erro: Error) => console.warn('Imagem do Google indisponível; usando só a NASA.', erro))
}

/** Contorno de uma camada do Leaflet (polígono sem furos). */
function poligonoDaCamada(camada: L.Polygon): Poligono {
  const [anel] = camada.getLatLngs() as L.LatLng[][]
  return poligonoDeVertices(anel)
}

function MapaNasa({
  centro,
  poligono,
  ponto = null,
  contorno = null,
  limite = null,
  lotes = [],
  onClicarLote,
  imagem,
  referencias = true,
  onAlterarPoligono,
  onMoverCentro,
  className,
}: Props) {
  const elemento = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camadaImagem = useRef<L.GridLayer | null>(null)
  const camadasReferencia = useRef<L.GridLayer[]>([])
  const forma = useRef<L.Polygon | null>(null)
  const marcador = useRef<L.Marker | null>(null)
  const camadaContorno = useRef<L.GeoJSON | null>(null)
  const camadaLimite = useRef<L.Polygon | null>(null)
  const camadaLotes = useRef<L.GeoJSON | null>(null)
  const arrastando = useRef(false)
  const aoMover = useRef(onMoverCentro)
  const aoAlterar = useRef(onAlterarPoligono)
  const aoClicarLote = useRef(onClicarLote)
  /** Último contorno enviado ao pai: quando ele volta pela prop, a camada já está igual. */
  const ultimoEnviado = useRef<string | null>(null)
  // enquadramento mais recente, aplicado quando o mapa ganha tamanho
  const vista = useRef({ centro, poligono, ponto, contorno, lotes, limite })
  /** O elemento já tem tamanho e a vista inicial foi aplicada. */
  const pronto = useRef(false)

  const editavel = !!onAlterarPoligono
  // os lotes chegam como array novo a cada render: compara pelo conteúdo
  const chaveLotes = JSON.stringify(lotes)
  const clicavel = !!onClicarLote

  // declarado antes dos demais efeitos: eles leem os valores atuais
  useEffect(() => {
    aoMover.current = onMoverCentro
    aoAlterar.current = onAlterarPoligono
    aoClicarLote.current = onClicarLote
    vista.current = { centro, poligono, ponto, contorno, lotes, limite }
  })

  // cria o mapa uma vez
  useEffect(() => {
    const el = elemento.current
    if (!el) return
    // vista provisória: o Leaflet exige uma antes de receber camadas
    const m = L.map(el, {
      maxZoom: ZOOM_MAXIMO,
      attributionControl: true,
    }).setView(BRASIL, 4)
    // fundo da NASA (Blue Marble): aparece enquanto o Google carrega, ou sem ele
    new CamadaAmpliada(URL_FUNDO, ZOOM_FUNDO, {
      maxZoom: ZOOM_MAXIMO,
      attribution: ATRIBUICAO,
      zIndex: Z_FUNDO,
      className: 'camada-nasa',
    }).addTo(m)
    if (googleDisponivel) ligarGoogle(m)

    m.pm.setLang('pt_br')
    m.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: true,
      snapDistance: 15,
      pathOptions: ESTILO_LOTE,
      templineStyle: { color: '#ffd23f' },
      hintlineStyle: { color: '#ffd23f', dashArray: '5 5' },
    })
    // o desenho terminado vira o contorno do pai; a camada própria é recriada
    // pelo efeito do polígono, já em modo de edição
    m.on('pm:create', (evento) => {
      const camada = evento.layer as L.Polygon
      const novo = poligonoDaCamada(camada)
      camada.remove()
      aoAlterar.current?.(novo)
    })

    m.on('click', (evento: L.LeafletMouseEvent) =>
      aoMover.current?.(evento.latlng.lat, evento.latlng.lng),
    )
    mapa.current = m

    function enquadrar() {
      const { poligono: p, ponto: pt, centro: c, contorno: ct, lotes: ls, limite: lm } = vista.current
      if (p) m.fitBounds(L.latLngBounds(verticesLeaflet(p)).pad(0.6), { maxZoom: ZOOM_ENQUADRAR })
      else if (pt) m.setView([pt.lat, pt.lng], ZOOM_PONTO)
      else if (lm) m.fitBounds(L.latLngBounds(verticesLeaflet(lm)).pad(0.15), { maxZoom: ZOOM_ENQUADRAR })
      else if (ls.length)
        m.fitBounds(L.latLngBounds(ls.flatMap((l) => verticesLeaflet(l.poligono))).pad(0.3), {
          maxZoom: ZOOM_ENQUADRAR,
        })
      else if (c) m.setView([c.lat, c.lng], ZOOM_PONTO)
      else if (ct) m.fitBounds(L.geoJSON(ct).getBounds())
    }

    // Dentro do modal, este efeito roda antes de o <dialog> abrir: o elemento
    // mede 0×0 e o Leaflet não carrega nada. Recalcula ao ganhar tamanho.
    const observador = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return
      m.invalidateSize()
      if (!pronto.current) {
        pronto.current = true
        enquadrar()
      }
    })
    observador.observe(el)

    return () => {
      observador.disconnect()
      m.remove()
      mapa.current = null
      forma.current = null
      pronto.current = false
    }
  }, [])

  // imagem HLS da data escolhida
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadaImagem.current?.remove()
    camadaImagem.current = imagem
      ? new CamadaAmpliada(urlHls(imagem.camada, imagem.data), ZOOM_HLS, {
          maxZoom: ZOOM_MAXIMO,
          zIndex: Z_HLS,
          className: 'camada-nasa',
        }).addTo(m)
      : null
    camadasReferencia.current.forEach((c) => c.bringToFront())
  }, [imagem])

  // estradas e nomes por cima da imagem
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadasReferencia.current.forEach((c) => c.remove())
    camadasReferencia.current = []
    if (!referencias) return

    const daNasa = () =>
      URL_REFERENCIAS.map((url) =>
        new CamadaAmpliada(url, ZOOM_REFERENCIAS, {
          maxZoom: ZOOM_MAXIMO,
          zIndex: Z_REFERENCIAS,
          className: 'camada-nasa',
        }).addTo(m),
      )
    if (!googleDisponivel) {
      camadasReferencia.current = daNasa()
      return
    }
    // com o Google: estradas e nomes dele, transparentes sobre o satélite
    let ativo = true
    sessaoGoogle('rotulos')
      .then((sessao) => {
        if (!ativo) return
        camadasReferencia.current = [
          L.tileLayer(urlTilesGoogle(sessao), {
            maxZoom: ZOOM_MAXIMO,
            zIndex: Z_REFERENCIAS,
            className: 'camada-google',
          }).addTo(m),
        ]
      })
      .catch(() => {
        if (ativo) camadasReferencia.current = daNasa()
      })
    return () => {
      ativo = false
    }
  }, [referencias])

  // contorno de estado/município: desenha tracejado e enquadra nele
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadaContorno.current?.remove()
    camadaContorno.current = null
    if (!contorno) return

    camadaContorno.current = L.geoJSON(contorno, {
      style: { className: 'mapa-nasa__contorno', weight: 2, fill: false },
      interactive: false,
      pmIgnore: true,
    }).addTo(m)
    if (pronto.current) m.fitBounds(camadaContorno.current.getBounds())
  }, [contorno])

  // área que limita o desenho (a propriedade do lote); sem preenchimento, para o
  // clique passar para o mapa, e sem pmIgnore, para o Geoman encaixar nela
  const chaveLimite = limite ? JSON.stringify(limite) : ''
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadaLimite.current?.remove()
    camadaLimite.current = null
    const { limite: lm, poligono: p } = vista.current
    if (!lm) return
    camadaLimite.current = L.polygon(verticesLeaflet(lm), {
      className: 'mapa-nasa__limite',
      weight: 3,
      fill: false,
      interactive: false,
    }).addTo(m)
    camadaLimite.current.bringToBack()
    if (pronto.current && !p)
      m.fitBounds(camadaLimite.current.getBounds().pad(0.15), { maxZoom: ZOOM_ENQUADRAR })
  }, [chaveLimite])

  // outros lotes como uma camada GeoJSON (FeatureCollection)
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadaLotes.current?.remove()
    camadaLotes.current = null
    const { lotes: ls } = vista.current
    if (!ls.length) return

    const colecao: GeoJSON.FeatureCollection<GeoJSON.Polygon, { id: number; nome: string }> = {
      type: 'FeatureCollection',
      features: ls.map((l) => ({
        type: 'Feature',
        geometry: l.poligono,
        properties: { id: l.id, nome: l.nome },
      })),
    }
    camadaLotes.current = L.geoJSON(colecao, {
      style: {
        className: clicavel ? 'mapa-nasa__vizinho mapa-nasa__vizinho--clicavel' : 'mapa-nasa__vizinho',
        weight: 2,
      },
      onEachFeature: (feature, camada) => {
        const { id, nome } = feature.properties as { id: number; nome: string }
        // na visão geral o nome fica fixo; como vizinho, só ao passar o mouse
        camada.bindTooltip(
          nome,
          clicavel
            ? { permanent: true, direction: 'center', className: 'mapa-nasa__rotulo' }
            : { sticky: true },
        )
        if (clicavel) camada.on('click', () => aoClicarLote.current?.(id))
      },
    }).addTo(m)
    forma.current?.bringToFront()

    // visão geral: enquadra todos os lotes quando a lista muda
    if (pronto.current && !vista.current.poligono && !vista.current.ponto)
      m.fitBounds(camadaLotes.current.getBounds().pad(0.3), { maxZoom: ZOOM_ENQUADRAR })
  }, [chaveLotes, clicavel])

  // contorno do lote; atualiza a camada existente em vez de recriar
  useEffect(() => {
    const m = mapa.current
    if (!m) return

    if (!poligono) {
      forma.current?.remove()
      forma.current = null
      ultimoEnviado.current = null
      // sem contorno no modo de edição: o próximo clique começa o desenho
      if (editavel) m.pm.enableDraw('Polygon', { snappable: true, tooltips: true })
      else m.pm.disableDraw()
      return
    }
    m.pm.disableDraw()

    // o contorno veio da própria edição no mapa: a camada já está assim
    const doMapa = !!forma.current && JSON.stringify(poligono) === ultimoEnviado.current
    if (!doMapa) {
      const vertices = verticesLeaflet(poligono)
      const novo = !forma.current
      if (forma.current) forma.current.setLatLngs(vertices)
      else {
        forma.current = L.polygon(vertices, ESTILO_LOTE).addTo(m)
        forma.current.on('pm:edit', (evento) => {
          const editado = poligonoDaCamada(evento.layer as L.Polygon)
          const json = JSON.stringify(editado)
          if (json === ultimoEnviado.current) return
          ultimoEnviado.current = json
          aoAlterar.current?.(editado)
        })
      }
      ultimoEnviado.current = JSON.stringify(poligono)

      // lote recém-desenhado, ou que saiu da tela (ex.: cantos digitados):
      // enquadra nele
      const limites = L.latLngBounds(vertices)
      if (pronto.current && (novo || !m.getBounds().contains(limites)))
        m.fitBounds(limites.pad(0.6), { maxZoom: ZOOM_ENQUADRAR })
    }

    // reabre a edição para os marcadores seguirem os vértices atuais
    const camada = forma.current!
    if (camada.pm.enabled() && !doMapa) camada.pm.disable()
    if (editavel && !camada.pm.enabled()) camada.pm.enable(OPCOES_EDICAO)
    if (!editavel && camada.pm.enabled()) camada.pm.disable()
  }, [poligono, editavel])

  // marcador do ponto informado (ex.: a propriedade).
  // Move o marcador existente, para não interromper o arraste.
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    if (!ponto) {
      marcador.current?.remove()
      marcador.current = null
      return
    }
    const posicao: [number, number] = [ponto.lat, ponto.lng]
    if (!marcador.current)
      marcador.current = L.marker(posicao, {
        icon: iconeCentro,
        draggable: !!aoMover.current,
        title: aoMover.current ? 'Arraste para mover' : undefined,
      })
        .on('dragstart', () => (arrastando.current = true))
        .on('dragend', () => (arrastando.current = false))
        .on('drag', (evento) => {
          const { lat, lng } = (evento.target as L.Marker).getLatLng()
          aoMover.current?.(lat, lng)
        })
        .addTo(m)
    else if (!arrastando.current) marcador.current.setLatLng(posicao)

    // ponto digitado fora da tela ou com o mapa muito afastado: vai até ele
    if (
      pronto.current &&
      !arrastando.current &&
      (m.getZoom() < ZOOM_APROXIMAR || !m.getBounds().contains(posicao))
    )
      m.setView(posicao, Math.max(m.getZoom(), ZOOM_PONTO - 1))
  }, [ponto])

  return <div ref={elemento} className={cn('mapa-nasa h-[360px]', className)} />
}

export default MapaNasa
