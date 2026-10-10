import { env } from '@/config/env'

// Map Tiles API (2D): a mesma imagem de satélite do Google Maps, servida em
// tiles para o Leaflet. Cada tile é cobrado; a sessão e o viewport, não.
// https://developers.google.com/maps/documentation/tile/2d-tiles-overview

const BASE = 'https://tile.googleapis.com'
// a sessão vale ~2 semanas; renova uma hora antes de expirar
const MARGEM_MS = 60 * 60 * 1000

/** satelite: a imagem; rotulos: estradas e nomes transparentes, por cima dela. */
export type TipoGoogle = 'satelite' | 'rotulos'

const PEDIDOS: Record<TipoGoogle, object> = {
  satelite: { mapType: 'satellite', language: 'pt-BR', region: 'BR' },
  rotulos: {
    mapType: 'satellite',
    language: 'pt-BR',
    region: 'BR',
    layerTypes: ['layerRoadmap'],
    // só a camada de estradas, sem a imagem (fica sobre a de satélite)
    overlay: true,
  },
}

/** Sem chave configurada, o mapa continua só com as imagens da NASA. */
export const googleDisponivel = env.googleMapsKey !== ''

/** Logo exigido pelas políticas da Map Tiles API (versão branca, para satélite). */
export const LOGO_GOOGLE = 'https://maps.gstatic.com/mapfiles/api-3/images/google_white5_hdpi.png'

type Sessao = { session: string; expira: number }

const chaveCache = (tipo: TipoGoogle) => `fruitvale:google-tiles:${tipo}`
const pendentes = new Map<TipoGoogle, Promise<string>>()

function lerCache(tipo: TipoGoogle): string | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveCache(tipo)) ?? 'null') as Sessao | null
    return salvo && salvo.expira - MARGEM_MS > Date.now() ? salvo.session : null
  } catch {
    return null
  }
}

/** Motivo devolvido pelo Google (ex.: "API key not valid"), para o console. */
async function motivo(resposta: Response) {
  try {
    const corpo = (await resposta.json()) as { error?: { message?: string } }
    return corpo.error?.message ? ` — ${corpo.error.message}` : ''
  } catch {
    return ''
  }
}

async function criarSessao(tipo: TipoGoogle) {
  const resposta = await fetch(
    `${BASE}/v1/createSession?key=${encodeURIComponent(env.googleMapsKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PEDIDOS[tipo]),
    },
  )
  if (!resposta.ok) throw new Error(`Map Tiles API: createSession ${resposta.status}${await motivo(resposta)}`)
  // expiry: segundos desde 1970, em texto
  const { session, expiry } = (await resposta.json()) as { session: string; expiry: string }
  try {
    localStorage.setItem(
      chaveCache(tipo),
      JSON.stringify({ session, expira: Number(expiry) * 1000 } satisfies Sessao),
    )
  } catch {
    // sem armazenamento: cria outra sessão na próxima visita
  }
  return session
}

/** Token de sessão (reaproveitado entre mapas e visitas enquanto válido). */
export function sessaoGoogle(tipo: TipoGoogle): Promise<string> {
  const emCache = lerCache(tipo)
  if (emCache) return Promise.resolve(emCache)
  let pendente = pendentes.get(tipo)
  if (!pendente) {
    pendente = criarSessao(tipo).finally(() => pendentes.delete(tipo))
    pendentes.set(tipo, pendente)
  }
  return pendente
}

/** Descarta a sessão guardada (ex.: os tiles começaram a falhar). */
export function invalidarSessaoGoogle(tipo: TipoGoogle) {
  try {
    localStorage.removeItem(chaveCache(tipo))
  } catch {
    // nada guardado
  }
}

export const urlTilesGoogle = (session: string) =>
  `${BASE}/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${encodeURIComponent(env.googleMapsKey)}`

export type ViewportGoogle = {
  /** atribuição que precisa aparecer no mapa (varia com a região) */
  copyright: string
  maxZoomRects: { maxZoom: number; north: number; south: number; east: number; west: number }[]
}

/** Atribuição e zoom máximo disponíveis na área visível. */
export async function viewportGoogle(
  session: string,
  zoom: number,
  limites: { north: number; south: number; east: number; west: number },
  signal?: AbortSignal,
): Promise<ViewportGoogle> {
  const params = new URLSearchParams({
    session,
    key: env.googleMapsKey,
    zoom: String(zoom),
    north: String(limites.north),
    south: String(limites.south),
    east: String(limites.east),
    west: String(limites.west),
  })
  const resposta = await fetch(`${BASE}/tile/v1/viewport?${params}`, { signal })
  if (!resposta.ok) throw new Error(`Map Tiles API: viewport ${resposta.status}${await motivo(resposta)}`)
  const dados = (await resposta.json()) as Partial<ViewportGoogle>
  return { copyright: dados.copyright ?? '', maxZoomRects: dados.maxZoomRects ?? [] }
}
