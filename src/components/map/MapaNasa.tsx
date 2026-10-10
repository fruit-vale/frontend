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
import { CamadaAmpliada } from './camadaAmpliada'
import { cn } from '@/lib/utils'
import './mapa-nasa.css'

const ZOOM_MAXIMO = 17
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
  const camadaLotes = useRef<L.GeoJSON | null>(null)
  const arrastando = useRef(false)
  const aoMover = useRef(onMoverCentro)
  const aoAlterar = useRef(onAlterarPoligono)
  const aoClicarLote = useRef(onClicarLote)
  /** Último contorno enviado ao pai: quando ele volta pela prop, a camada já está igual. */
  const ultimoEnviado = useRef<string | null>(null)
  // enquadramento mais recente, aplicado quando o mapa ganha tamanho
  const vista = useRef({ centro, poligono, ponto, contorno, lotes })
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
    vista.current = { centro, poligono, ponto, contorno, lotes }
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
    new CamadaAmpliada(URL_FUNDO, ZOOM_FUNDO, {
      maxZoom: ZOOM_MAXIMO,
      attribution: ATRIBUICAO,
    }).addTo(m)

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
      const { poligono: p, ponto: pt, centro: c, contorno: ct, lotes: ls } = vista.current
      if (p) m.fitBounds(L.latLngBounds(verticesLeaflet(p)).pad(0.6), { maxZoom: 16 })
      else if (pt) m.setView([pt.lat, pt.lng], ZOOM_PONTO)
      else if (ls.length)
        m.fitBounds(L.latLngBounds(ls.flatMap((l) => verticesLeaflet(l.poligono))).pad(0.3), {
          maxZoom: 16,
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
        }).addTo(m)
      : null
    camadasReferencia.current.forEach((c) => c.bringToFront())
  }, [imagem])

  // estradas e nomes por cima da imagem
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    camadasReferencia.current.forEach((c) => c.remove())
    camadasReferencia.current = referencias
      ? URL_REFERENCIAS.map((url) =>
          new CamadaAmpliada(url, ZOOM_REFERENCIAS, {
            maxZoom: ZOOM_MAXIMO,
          }).addTo(m),
        )
      : []
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
      m.fitBounds(camadaLotes.current.getBounds().pad(0.3), { maxZoom: 16 })
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
        m.fitBounds(limites.pad(0.6), { maxZoom: 16 })
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
