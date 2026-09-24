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
