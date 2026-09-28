// API de localidades do IBGE (pública, sem chave, com CORS liberado)
const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export type Estado = { sigla: string; nome: string }
export type Municipio = { id: number; nome: string }

let estados: Promise<Estado[]> | undefined
const municipios = new Map<string, Promise<Municipio[]>>()

async function buscar<T>(caminho: string) {
  const resposta = await fetch(`${IBGE_URL}${caminho}`)
  if (!resposta.ok) throw new Error(`IBGE respondeu HTTP ${resposta.status}`)
  return (await resposta.json()) as T
}

// guarda a promessa em cache; se falhar, descarta para permitir nova tentativa
function emCache<T>(promessa: Promise<T>, descartar: () => void) {
  promessa.catch(descartar)
  return promessa
}

export function listarEstados() {
  estados ??= emCache(
    buscar<Estado[]>('/estados?orderBy=nome').then((lista) =>
      lista.map(({ sigla, nome }) => ({ sigla, nome })),
    ),
    () => (estados = undefined),
  )
  return estados
}

export function listarMunicipios(uf: string) {
  let lista = municipios.get(uf)
  if (!lista) {
    lista = emCache(
      buscar<Municipio[]>(`/estados/${uf}/municipios?orderBy=nome`).then(
        (itens) => itens.map(({ id, nome }) => ({ id, nome })),
      ),
      () => municipios.delete(uf),
    )
    municipios.set(uf, lista)
  }
  return lista
}

// Contornos (malhas) de estados e municípios, para enquadrar o mapa.
// qualidade=minima: poucos KB, suficiente para zoom e contorno.
const MALHAS_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas'
const malhas = new Map<string, Promise<GeoJSON.GeoJsonObject>>()

function malha(caminho: string) {
  let contorno = malhas.get(caminho)
  if (!contorno) {
    contorno = emCache(
      fetch(
        `${MALHAS_URL}/${caminho}?formato=application/vnd.geo%2Bjson&qualidade=minima`,
      ).then((resposta) => {
        if (!resposta.ok) throw new Error(`IBGE respondeu HTTP ${resposta.status}`)
        return resposta.json() as Promise<GeoJSON.GeoJsonObject>
      }),
      () => malhas.delete(caminho),
    )
    malhas.set(caminho, contorno)
  }
  return contorno
}

export const malhaEstado = (uf: string) => malha(`estados/${uf}`)
export const malhaMunicipio = (id: number) => malha(`municipios/${id}`)
