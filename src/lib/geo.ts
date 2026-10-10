// Contorno do lote em GeoJSON Polygon, e o retângulo pelos cantos do GPS.
// Mesma aproximação local usada pela API em src/lotes/geometria.ts.

const M_POR_GRAU_LAT = 110_540
const M_POR_GRAU_LNG_EQUADOR = 111_320

export type Poligono = {
  type: 'Polygon'
  coordinates: [number, number][][]
}

/** Parâmetros editáveis no formulário. */
export type Retangulo = {
  lat: number
  lng: number
  /** lado leste-oeste antes da rotação, em metros */
  largura: number
  /** lado norte-sul antes da rotação, em metros */
  comprimento: number
  /** graus no sentido anti-horário */
  rotacao: number
}

const mPorGrauLng = (lat: number) =>
  M_POR_GRAU_LNG_EQUADOR * Math.cos((lat * Math.PI) / 180)

export function retanguloParaPoligono(r: Retangulo): Poligono {
  const rad = (r.rotacao * Math.PI) / 180
  const mLng = mPorGrauLng(r.lat)
  const cantos = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]): [number, number] => {
    const x = (sx * r.largura) / 2
    const y = (sy * r.comprimento) / 2
    const xr = x * Math.cos(rad) - y * Math.sin(rad)
    const yr = x * Math.sin(rad) + y * Math.cos(rad)
    return [
      Number((r.lng + xr / mLng).toFixed(7)),
      Number((r.lat + yr / M_POR_GRAU_LAT).toFixed(7)),
    ]
  })
  return { type: 'Polygon', coordinates: [[...cantos, cantos[0]]] }
}

/** [lat, lng] de cada vértice (sem o fechamento), no formato do Leaflet. */
export const verticesLeaflet = (p: Poligono) =>
  p.coordinates[0].slice(0, -1).map(([lng, lat]) => [lat, lng] as [number, number])

/** Polígono fechado a partir dos vértices do Leaflet (~1 cm de precisão). */
export function poligonoDeVertices(vertices: { lat: number; lng: number }[]): Poligono {
  const anel = vertices.map(
    ({ lat, lng }): [number, number] => [Number(lng.toFixed(7)), Number(lat.toFixed(7))],
  )
  return { type: 'Polygon', coordinates: [[...anel, anel[0]]] }
}

/** Vértices em metros ao redor do centro (mesma projeção da API). */
function emMetros(p: Poligono) {
  const pontos = p.coordinates[0].slice(0, -1)
  const lng0 = pontos.reduce((s, c) => s + c[0], 0) / pontos.length
  const lat0 = pontos.reduce((s, c) => s + c[1], 0) / pontos.length
  const mLng = mPorGrauLng(lat0)
  return pontos.map(([lng, lat]) => [(lng - lng0) * mLng, (lat - lat0) * M_POR_GRAU_LAT])
}

/** Área em hectares, como a API calcula (fórmula do laço). */
export function areaPoligonoHa(p: Poligono) {
  const xy = emMetros(p)
  const dobro = xy.reduce(
    (s, a, i) => s + a[0] * xy[(i + 1) % xy.length][1] - xy[(i + 1) % xy.length][0] * a[1],
    0,
  )
  return Math.round((Math.abs(dobro) / 2 / 10_000) * 100) / 100
}

/** Perímetro em metros. */
export function perimetroM(p: Poligono) {
  const xy = emMetros(p)
  return xy.reduce((s, a, i) => {
    const b = xy[(i + 1) % xy.length]
    return s + Math.hypot(b[0] - a[0], b[1] - a[1])
  }, 0)
}

/** Média dos vértices: basta para centrar o mapa e buscar imagens. */
export function centroPoligono(p: Poligono): { lat: number; lng: number } {
  const pontos = p.coordinates[0].slice(0, -1)
  return {
    lat: pontos.reduce((s, c) => s + c[1], 0) / pontos.length,
    lng: pontos.reduce((s, c) => s + c[0], 0) / pontos.length,
  }
}

export type Coordenada = { lat: number; lng: number }
/** Para que lado do segmento canto 1 → canto 2 fica a profundidade. */
export type Lado = 'esquerda' | 'direita'

/** Menor lado aceito, igual ao da API. */
const LADO_MIN_M = 1

/**
 * Retângulo a partir de dois cantos de um mesmo lado (ex.: medidos com GPS)
 * e da profundidade. Sempre fecha um retângulo exato, mesmo com o erro do GPS.
 */
export function retanguloDeCantos(
  c1: Coordenada,
  c2: Coordenada,
  profundidade: number,
  lado: Lado,
): Retangulo | null {
  const mLng = mPorGrauLng((c1.lat + c2.lat) / 2)
  const dx = (c2.lng - c1.lng) * mLng
  const dy = (c2.lat - c1.lat) * M_POR_GRAU_LAT
  const frente = Math.hypot(dx, dy)
  if (frente < LADO_MIN_M || profundidade < LADO_MIN_M) return null

  const [ux, uy] = [dx / frente, dy / frente]
  // normal à esquerda (anti-horário) ou à direita do sentido 1 → 2
  const [nx, ny] = lado === 'esquerda' ? [-uy, ux] : [uy, -ux]
  const cx = (ux * frente) / 2 + (nx * profundidade) / 2
  const cy = (uy * frente) / 2 + (ny * profundidade) / 2

  // o retângulo é simétrico: girar 180° dá o mesmo, então fica em (-90°, 90°]
  let rotacao = (Math.atan2(uy, ux) * 180) / Math.PI
  if (rotacao > 90) rotacao -= 180
  if (rotacao <= -90) rotacao += 180

  return {
    lat: c1.lat + cy / M_POR_GRAU_LAT,
    lng: c1.lng + cx / mLng,
    largura: frente,
    comprimento: profundidade,
    rotacao,
  }
}
