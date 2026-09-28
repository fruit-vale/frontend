import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Empresa } from '../../auth/authContextInstance'
import CampoCoordenadas from '../../components/CampoCoordenadas/CampoCoordenadas'
import MapaNasa from '../../components/MapaNasa/MapaNasa'
import SeletorImagem from '../../components/MapaNasa/SeletorImagem'
import { apiFetch } from '../../lib/api'
import {
  listarEstados,
  listarMunicipios,
  malhaEstado,
  malhaMunicipio,
  type Estado,
  type Municipio,
} from '../../lib/ibge'
import type { ImagemDisponivel } from '../../lib/nasa'
import type { PropriedadeCompleta, StatusPropriedade } from './tipos'

type Ponto = { lat: number; lng: number }

type Props = {
  empresas: Empresa[]
  /** Propriedade em edição; ausente no cadastro. */
  propriedade?: PropriedadeCompleta
  onSalva: (propriedade: PropriedadeCompleta) => void
  onCancelar: () => void
}

function PropriedadeForm({ empresas, propriedade, onSalva, onCancelar }: Props) {
  const [empresaId, setEmpresaId] = useState(String(propriedade?.empresa_id ?? ''))
  const [nome, setNome] = useState(propriedade?.nome ?? '')
  const [estado, setEstado] = useState(propriedade?.estado ?? '')
  const [municipio, setMunicipio] = useState(propriedade?.municipio ?? '')
  const [area, setArea] = useState(propriedade?.area_total_ha?.toString() ?? '')
  const [status, setStatus] = useState<StatusPropriedade>(propriedade?.status ?? 'ATIVA')
  // cada coordenada pode estar vazia enquanto o usuário digita
  const [coordenadas, setCoordenadas] = useState<{ lat: number | null; lng: number | null }>({
    lat: propriedade?.latitude ?? null,
    lng: propriedade?.longitude ?? null,
  })
  const ponto: Ponto | null =
    coordenadas.lat !== null && coordenadas.lng !== null
      ? { lat: coordenadas.lat, lng: coordenadas.lng }
      : null
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  // contorno do estado/município escolhido: o mapa dá zoom nele
  const [contorno, setContorno] = useState<GeoJSON.GeoJsonObject | null>(null)
  const ultimaBusca = useRef(0)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [estados, setEstados] = useState<Estado[] | null>(null)
  const [erroIbge, setErroIbge] = useState(false)
  const [cidades, setCidades] = useState<{ uf: string; lista: Municipio[] }>()

  useEffect(() => {
    listarEstados().then(setEstados).catch(() => setErroIbge(true))
  }, [])

  useEffect(() => {
    if (!estado || erroIbge) return
    let ativo = true
    listarMunicipios(estado)
      .then((lista) => ativo && setCidades({ uf: estado, lista }))
      .catch(() => ativo && setErroIbge(true))
    return () => {
      ativo = false
    }
  }, [estado, erroIbge])

  const cidadesDaUf = cidades?.uf === estado ? cidades.lista : null

  /** Busca o contorno no IBGE; ignora respostas de escolhas anteriores. */
  function enquadrar(busca: Promise<GeoJSON.GeoJsonObject>) {
    const id = ++ultimaBusca.current
    busca
      .then((geo) => id === ultimaBusca.current && setContorno(geo))
      // sem contorno o mapa só não dá zoom; o formulário segue normal
      .catch(() => undefined)
  }

  function escolherEstado(uf: string) {
    setEstado(uf)
    setMunicipio('')
    if (uf) enquadrar(malhaEstado(uf))
  }

  function escolherMunicipio(nome: string) {
    setMunicipio(nome)
    const cidade = cidadesDaUf?.find((c) => c.nome === nome)
    if (cidade) enquadrar(malhaMunicipio(cidade.id))
    else if (estado) enquadrar(malhaEstado(estado))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!propriedade && !empresaId) return setErro('Selecione a empresa da propriedade.')
    if ((coordenadas.lat === null) !== (coordenadas.lng === null))
      return setErro('Preencha latitude e longitude, ou deixe as duas em branco.')

    const areaNumero = area.replace(',', '.').trim()
    setErro('')
    setSalvando(true)
    try {
      const salva = await apiFetch<PropriedadeCompleta>(
        propriedade ? `/propriedades/${propriedade.id}` : '/propriedades',
        {
          method: propriedade ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...(!propriedade && { empresa_id: Number(empresaId) }),
            nome,
            estado,
            municipio,
            area_total_ha: areaNumero === '' ? null : Number(areaNumero),
            status,
            latitude: ponto?.lat ?? null,
            longitude: ponto?.lng ?? null,
          }),
        },
      )
      onSalva(salva)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-mapa">
        <div className="form-mapa__campos">
      <div className="form-grid">
        <label className="form-field">
          <span>Empresa *</span>
          <select
            value={empresaId}
            onChange={(event) => setEmpresaId(event.target.value)}
            // lotes, sensores e culturas dependem da empresa: não muda depois
            disabled={!!propriedade}
          >
            <option value="">Selecione...</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.razao_social}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Nome *</span>
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            maxLength={100}
            placeholder="Fazenda Boa Vista"
            required
            autoFocus
          />
        </label>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Estado *</span>
          {erroIbge ? (
            <input value={estado} onChange={(event) => setEstado(event.target.value.toUpperCase())} maxLength={2} placeholder="UF (ex.: PE)" />
          ) : (
            <select
              value={estado}
              onChange={(event) => escolherEstado(event.target.value)}
              disabled={!estados}
            >
              <option value="">{estados ? 'Selecione...' : 'Carregando estados...'}</option>
              {estados?.map((e) => (
                <option key={e.sigla} value={e.sigla}>
                  {e.nome}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="form-field">
          <span>Município *</span>
          {erroIbge ? (
            <input value={municipio} onChange={(event) => setMunicipio(event.target.value)} maxLength={100} />
          ) : (
            <select value={municipio} onChange={(event) => escolherMunicipio(event.target.value)} disabled={!cidadesDaUf}>
              <option value="">
                {!estado ? 'Selecione o estado primeiro' : cidadesDaUf ? 'Selecione...' : 'Carregando cidades...'}
              </option>
              {/* mantém o município salvo mesmo que o nome no IBGE tenha mudado */}
              {municipio && cidadesDaUf && !cidadesDaUf.some((c) => c.nome === municipio) && (
                <option value={municipio}>{municipio}</option>
              )}
              {cidadesDaUf?.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="form-field">
          <span>Área total (ha)</span>
          <input type="number" min={0} step="0.01" value={area} onChange={(event) => setArea(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusPropriedade)}>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </select>
        </label>
      </div>
      {erroIbge && (
        <p className="form-hint">Não foi possível carregar a lista do IBGE; digite manualmente.</p>
      )}

      <fieldset className="propriedade-mapa">
        <legend>Localização (sede ou centro da propriedade)</legend>

        <CampoCoordenadas
          lat={coordenadas.lat}
          lng={coordenadas.lng}
          onChange={(lat, lng) => setCoordenadas({ lat, lng })}
        />
        {ponto ? (
          <button
            type="button"
            className="propriedade-mapa__remover"
            onClick={() => setCoordenadas({ lat: null, lng: null })}
          >
            Remover localização
          </button>
        ) : (
          <p className="form-hint">
            Escolha o estado e o município para o mapa ir até lá. Você também
            pode clicar no mapa para preencher as coordenadas. É por esse ponto
            que o mapa abre ao cadastrar os lotes da propriedade.
          </p>
        )}

      </fieldset>

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : propriedade ? 'Salvar alterações' : 'Cadastrar propriedade'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
        </div>

        <aside className="form-mapa__mapa">
          <MapaNasa
            centro={null}
            poligono={null}
            ponto={ponto}
            contorno={contorno}
            imagem={imagem}
            onMoverCentro={(lat, lng) => setCoordenadas({ lat, lng })}
          />
          {ponto && (
            <SeletorImagem lat={ponto.lat} lng={ponto.lng} selecionada={imagem} onSelecionar={setImagem} />
          )}
        </aside>
      </div>
    </form>
  )
}

export default PropriedadeForm
