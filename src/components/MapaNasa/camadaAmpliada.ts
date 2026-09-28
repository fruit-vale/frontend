import L from 'leaflet'

const TILE = 256
const LIMITE_CACHE = 300

type Origem = HTMLImageElement | HTMLCanvasElement

// tiles de origem já carregados, compartilhados entre os recortes vizinhos
const imagens = new Map<string, Promise<Origem>>()

/**
 * A NASA marca "sem dados" com preto puro: nas camadas de referência o tile
 * vazio é um PNG opaco todo preto, e a HLS tem bordas pretas fora da faixa do
 * satélite. Torna esses pixels transparentes para mostrar a camada de baixo.
 */
function pretoParaTransparente(img: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const dados = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = dados.data
  for (let i = 0; i < px.length; i += 4)
    if (px[i] === 0 && px[i + 1] === 0 && px[i + 2] === 0) px[i + 3] = 0
  ctx.putImageData(dados, 0, 0)
  return canvas
}

function carregar(url: string) {
  let imagem = imagens.get(url)
  if (!imagem) {
    imagem = new Promise<Origem>((resolve, reject) => {
      const img = new Image()
      // CORS liberado pelo GIBS: permite ler os pixels no canvas
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(pretoParaTransparente(img))
      img.onerror = () => reject(new Error(`Falha ao carregar ${url}`))
      img.src = url
    })
    imagem.catch(() => imagens.delete(url))
    imagens.set(url, imagem)
    // descarta os mais antigos (Map preserva a ordem de inserção)
    if (imagens.size > LIMITE_CACHE) imagens.delete(imagens.keys().next().value!)
  }
  return imagem
}

/**
 * Camada de tiles que amplia além do zoom nativo recortando o tile de origem
 * num canvas de 256 px, sem suavização.
 *
 * O TileLayer do Leaflet (com maxNativeZoom) amplia via CSS `scale()`: com as
 * imagens da NASA (zoom nativo 8 a 13) e o zoom alto de um lote, o tile vira
 * uma textura de milhares de pixels que o navegador não desenha (mapa preto).
 */
export class CamadaAmpliada extends L.GridLayer {
  private readonly modelo: string
  private readonly zoomNativo: number

  constructor(modelo: string, zoomNativo: number, opcoes?: L.GridLayerOptions) {
    super(opcoes)
    this.modelo = modelo
    this.zoomNativo = zoomNativo
  }

  createTile(coords: L.Coords, done: L.DoneCallback) {
    const canvas = document.createElement('canvas')
    canvas.width = TILE
    canvas.height = TILE

    const nivel = Math.max(0, coords.z - this.zoomNativo)
    const escala = 2 ** nivel
    const x = Math.floor(coords.x / escala)
    const y = Math.floor(coords.y / escala)
    const lado = TILE / escala
    const url = this.modelo
      .replace('{z}', String(coords.z - nivel))
      .replace('{y}', String(y))
      .replace('{x}', String(x))

    carregar(url)
      .then((img) => {
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(
          img,
          (coords.x - x * escala) * lado,
          (coords.y - y * escala) * lado,
          lado,
          lado,
          0,
          0,
          TILE,
          TILE,
        )
        done(undefined, canvas)
      })
      // sem imagem naquela data/lugar: o tile fica transparente
      .catch((erro: Error) => done(erro, canvas))

    return canvas
  }
}
