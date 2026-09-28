// Retângulo do lote (com rotação) <-> GeoJSON Polygon.
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

/** Inverso de retanguloParaPoligono, para editar um lote salvo. */
export function poligonoParaRetangulo(p: Poligono): Retangulo {
  const cantos = p.coordinates[0].slice(0, 4)
  const lng = cantos.reduce((s, c) => s + c[0], 0) / 4
  const lat = cantos.reduce((s, c) => s + c[1], 0) / 4
  const mLng = mPorGrauLng(lat)
  const [a, b, c] = cantos.map(([x, y]) => [
    (x - lng) * mLng,
    (y - lat) * M_POR_GRAU_LAT,
  ])
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return {
    lat,
    lng,
    largura: Math.round(Math.hypot(dx, dy)),
    comprimento: Math.round(Math.hypot(c[0] - b[0], c[1] - b[1])),
    rotacao: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
  }
}

export const areaHa = (r: Retangulo) =>
  Math.round(((r.largura * r.comprimento) / 10_000) * 100) / 100

/** [lat, lng] dos cantos, no formato do Leaflet. */
export const cantosLeaflet = (p: Poligono) =>
  p.coordinates[0].slice(0, 4).map(([lng, lat]) => [lat, lng] as [number, number])

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

/** Inverso de retanguloDeCantos: um lado do retângulo e a profundidade. */
export function cantosDeRetangulo(r: Retangulo) {
  const [a, b] = retanguloParaPoligono(r).coordinates[0]
  return {
    c1: { lat: a[1], lng: a[0] },
    c2: { lat: b[1], lng: b[0] },
    profundidade: r.comprimento,
    // retanguloParaPoligono percorre os cantos no sentido anti-horário
    lado: 'esquerda' as Lado,
  }
}

/** Arredonda para exibir nos campos de medidas (0,1 m e 0,1°). */
export const arredondarRetangulo = (r: Retangulo): Retangulo => ({
  ...r,
  largura: Math.round(r.largura * 10) / 10,
  comprimento: Math.round(r.comprimento * 10) / 10,
  rotacao: Math.round(r.rotacao * 10) / 10,
})
