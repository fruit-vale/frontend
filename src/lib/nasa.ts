// Imagens de satélite da NASA GIBS (Global Imagery Browse Services).
// Gratuito, sem chave e com CORS liberado. https://nasa-gibs.github.io/gibs-api-docs/

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'

/** Zoom máximo das camadas HLS; acima disso o Leaflet só amplia os pixels. */
export const ZOOM_HLS = 12

// HLS: Landsat e Sentinel-2 harmonizados, 30 m por pixel, imagens diárias
export const SATELITES = [
  { camada: 'HLS_S30_Nadir_BRDF_Adjusted_Reflectance', nome: 'Sentinel-2' },
  { camada: 'HLS_L30_Nadir_BRDF_Adjusted_Reflectance', nome: 'Landsat' },
] as const

export type Camada = (typeof SATELITES)[number]['camada']

export const urlHls = (camada: Camada, data: string) =>
  `${GIBS}/${camada}/default/${data}/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png`

/** Fundo para contexto onde a HLS não tem imagem naquela data. */
export const URL_FUNDO = `${GIBS}/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`
export const ZOOM_FUNDO = 8

/**
 * Estradas, rios e limites (camada de referência da própria NASA). A de nomes
 * (Reference_Labels_15m) ficou de fora: o GIBS responde HTTP 500 para ela.
 */
export const URL_REFERENCIAS = [
  `${GIBS}/Reference_Features_15m/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`,
]
export const ZOOM_REFERENCIAS = 13

export const ATRIBUICAO =
  'Imagens: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a> / HLS'

export type ImagemDisponivel = {
  camada: Camada
  satelite: string
  data: string
  /** miniatura (tile do ponto), como object URL */
  miniatura: string
}

function tileDoPonto(lat: number, lng: number, z: number) {
  const n = 2 ** z
  const rad = (lat * Math.PI) / 180
  return {
    x: Math.floor(((lng + 180) / 360) * n),
    y: Math.floor(
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
    ),
  }
}

// tiles sem imagem (fora da passagem do satélite) vêm quase vazias
const TAMANHO_MINIMO_BYTES = 8_000
const DIAS_PADRAO = 40
const CONCORRENCIA = 6

const cache = new Map<string, Promise<ImagemDisponivel[]>>()

const isoDia = (d: Date) => d.toISOString().slice(0, 10)

/**
 * Datas recentes com imagem sobre o ponto, da mais nova para a mais antiga.
 * Nuvens não são detectadas: a miniatura serve para o usuário escolher.
 */
export function buscarImagens(
  lat: number,
  lng: number,
  dias = DIAS_PADRAO,
): Promise<ImagemDisponivel[]> {
  const { x, y } = tileDoPonto(lat, lng, ZOOM_HLS)
  const chave = `${x}/${y}/${dias}`
  const emCache = cache.get(chave)
  if (emCache) return emCache

  const pedidos: { camada: Camada; satelite: string; data: string }[] = []
  for (let d = 1; d <= dias; d++) {
    const data = isoDia(new Date(Date.now() - d * 86_400_000))
    for (const { camada, nome } of SATELITES)
      pedidos.push({ camada, satelite: nome, data })
  }

  const busca = (async () => {
    const encontradas: ImagemDisponivel[] = []
    let proximo = 0
    async function trabalhador() {
      while (proximo < pedidos.length) {
        const pedido = pedidos[proximo++]
        const url = urlHls(pedido.camada, pedido.data)
          .replace('{z}', String(ZOOM_HLS))
          .replace('{y}', String(y))
          .replace('{x}', String(x))
        try {
          const resposta = await fetch(url)
          if (!resposta.ok) continue
          const blob = await resposta.blob()
          if (blob.size < TAMANHO_MINIMO_BYTES) continue
          encontradas.push({ ...pedido, miniatura: URL.createObjectURL(blob) })
        } catch {
          // falha de rede numa data não impede as outras
        }
      }
    }
    await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador))
    return encontradas.sort((a, b) => b.data.localeCompare(a.data))
  })()

  cache.set(chave, busca)
  // não guarda falhas totais no cache
  busca.then((lista) => lista.length === 0 && cache.delete(chave))
  return busca
}
