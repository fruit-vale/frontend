import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cantosLeaflet, type Poligono } from '../../lib/geo'
import {
  ATRIBUICAO,
  URL_FUNDO,
  URL_REFERENCIAS,
  ZOOM_FUNDO,
  ZOOM_HLS,
  ZOOM_REFERENCIAS,
  urlHls,
  type ImagemDisponivel,
} from '../../lib/nasa'
import { CamadaAmpliada } from './camadaAmpliada'
import './MapaNasa.css'

const ZOOM_MAXIMO = 17
const ZOOM_PONTO = 15
// abaixo disso (ex.: vista do estado), um ponto novo leva o mapa até ele
const ZOOM_APROXIMAR = 12
// centro do Brasil, quando não há nenhuma coordenada
const BRASIL: [number, number] = [-14.2, -51.9]

type Props = {
  /** Ponto inicial (ex.: a propriedade), usado quando não há polígono. */
  centro: { lat: number; lng: number } | null
  poligono: Poligono | null
  /** Ponto marcado (ex.: localização da propriedade), no lugar de um polígono. */
  ponto?: { lat: number; lng: number } | null
  /** Contorno de referência (ex.: município do IBGE); o mapa enquadra nele ao mudar. */
  contorno?: GeoJSON.GeoJsonObject | null
  imagem: ImagemDisponivel | null
  referencias?: boolean
  /** Modo edição: clique no mapa ou arraste o marcador para mover o lote/ponto. */
  onMoverCentro?: (lat: number, lng: number) => void
}

const iconeCentro = L.divIcon({
  className: 'mapa-nasa__centro',
  iconSize: [18, 18],
})

function MapaNasa({
  centro,
  poligono,
  ponto = null,
  contorno = null,
  imagem,
  referencias = true,
  onMoverCentro,
}: Props) {
  const elemento = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camadaImagem = useRef<L.GridLayer | null>(null)
  const camadasReferencia = useRef<L.GridLayer[]>([])
  const forma = useRef<L.Polygon | null>(null)
  const marcador = useRef<L.Marker | null>(null)
  const camadaContorno = useRef<L.GeoJSON | null>(null)
  const arrastando = useRef(false)
  const aoMover = useRef(onMoverCentro)
  // enquadramento mais recente, aplicado quando o mapa ganha tamanho
  const vista = useRef({ centro, poligono, ponto, contorno })
  /** O elemento já tem tamanho e a vista inicial foi aplicada. */
  const pronto = useRef(false)

  // declarado antes dos demais efeitos: eles leem os valores atuais
  useEffect(() => {
    aoMover.current = onMoverCentro
    vista.current = { centro, poligono, ponto, contorno }
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

    m.on('click', (evento: L.LeafletMouseEvent) =>
      aoMover.current?.(evento.latlng.lat, evento.latlng.lng),
    )
    mapa.current = m

    function enquadrar() {
      const { poligono: p, ponto: pt, centro: c, contorno: ct } = vista.current
      if (p)
        m.fitBounds(L.latLngBounds(cantosLeaflet(p)).pad(0.6), { maxZoom: 16 })
      else if (pt) m.setView([pt.lat, pt.lng], ZOOM_PONTO)
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
    }).addTo(m)
    if (pronto.current) m.fitBounds(camadaContorno.current.getBounds())
  }, [contorno])

  // retângulo do lote; atualiza a camada existente em vez de recriar
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    if (!poligono) {
      forma.current?.remove()
      forma.current = null
      return
    }

    const cantos = cantosLeaflet(poligono)
    const novo = !forma.current
    if (forma.current) forma.current.setLatLngs(cantos)
    else
      forma.current = L.polygon(cantos, {
        className: 'mapa-nasa__lote',
        weight: 3,
      }).addTo(m)

    // lote recém-desenhado, ou que saiu da tela (ex.: coordenadas digitadas):
    // enquadra nele
    const limites = L.latLngBounds(cantos)
    if (pronto.current && (novo || !m.getBounds().contains(limites)))
      m.fitBounds(limites.pad(0.6), { maxZoom: 16 })
  }, [poligono])

  // marcador: no ponto informado ou no centro do lote (este só no modo edição).
  // Move o marcador existente, para não interromper o arraste.
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    const cantos = poligono ? cantosLeaflet(poligono) : null
    const posicao: [number, number] | null = ponto
      ? [ponto.lat, ponto.lng]
      : cantos && aoMover.current
        ? [
            cantos.reduce((s, c) => s + c[0], 0) / 4,
            cantos.reduce((s, c) => s + c[1], 0) / 4,
          ]
        : null

    if (!posicao) {
      marcador.current?.remove()
      marcador.current = null
      return
    }
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
      ponto &&
      pronto.current &&
      !arrastando.current &&
      (m.getZoom() < ZOOM_APROXIMAR || !m.getBounds().contains(posicao))
    )
      m.setView(posicao, Math.max(m.getZoom(), ZOOM_PONTO - 1))
  }, [poligono, ponto])

  return <div ref={elemento} className="mapa-nasa" />
}

export default MapaNasa
