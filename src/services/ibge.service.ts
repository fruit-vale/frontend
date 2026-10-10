import { EXTERNAL, externalHttp } from '@/api'

// API de localidades do IBGE (pública, sem chave, com CORS liberado)

export type Estado = { sigla: string; nome: string }
export type Municipio = { id: number; nome: string }

let estados: Promise<Estado[]> | undefined
const municipios = new Map<string, Promise<Municipio[]>>()
const malhas = new Map<string, Promise<GeoJSON.GeoJsonObject>>()

// guarda a promessa em cache; se falhar, descarta para permitir nova tentativa
function emCache<T>(promessa: Promise<T>, descartar: () => void) {
  promessa.catch(descartar)
  return promessa
}

const buscar = <T>(url: string) =>
  externalHttp.get<T>(url).then((resposta) => resposta.data)

function malha(caminho: string) {
  let contorno = malhas.get(caminho)
  if (!contorno) {
    // qualidade=minima: poucos KB, suficiente para zoom e contorno
    contorno = emCache(
      buscar<GeoJSON.GeoJsonObject>(
        `${EXTERNAL.ibge.malhas}/${caminho}?formato=application/vnd.geo%2Bjson&qualidade=minima`,
      ),
      () => malhas.delete(caminho),
    )
    malhas.set(caminho, contorno)
  }
  return contorno
}

export const ibgeService = {
  listarEstados() {
    estados ??= emCache(
      buscar<Estado[]>(`${EXTERNAL.ibge.base}${EXTERNAL.ibge.estados}`).then(
        (lista) => lista.map(({ sigla, nome }) => ({ sigla, nome })),
      ),
      () => (estados = undefined),
    )
    return estados
  },

  listarMunicipios(uf: string) {
    let lista = municipios.get(uf)
    if (!lista) {
      lista = emCache(
        buscar<Municipio[]>(
          `${EXTERNAL.ibge.base}${EXTERNAL.ibge.municipios(uf)}`,
        ).then((itens) => itens.map(({ id, nome }) => ({ id, nome }))),
        () => municipios.delete(uf),
      )
      municipios.set(uf, lista)
    }
    return lista
  },

  /** Contornos (malhas) de estados e municípios, para enquadrar o mapa. */
  malhaEstado: (uf: string) => malha(`estados/${uf}`),
  malhaMunicipio: (id: number) => malha(`municipios/${id}`),
}
