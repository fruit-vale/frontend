import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Empresa } from '../../auth/authContextInstance'
import { useAuth } from '../../auth/useAuth'
import Modal from '../../components/Modal/Modal'
import { apiFetch } from '../../lib/api'
import './Culturas.css'

export type Cultura = {
  id: number
  nome: string
  variedade: string | null
  temp_recomendada_min: number | null
  temp_recomendada_max: number | null
  umidade_recomendada_min: number | null
  umidade_recomendada_max: number | null
  ciclo_medio_dias: number | null
  descricao: string | null
  /** null = cultura da plataforma, visível a todas as empresas */
  empresa: { id: number; razao_social: string } | null
  total_lotes: number
}

type Formulario = { modo: 'fechado' } | { modo: 'novo' } | { modo: 'editar'; cultura: Cultura }

const CAMPOS_NUMERICOS = [
  'temp_recomendada_min',
  'temp_recomendada_max',
  'umidade_recomendada_min',
  'umidade_recomendada_max',
  'ciclo_medio_dias',
] as const

const formVazio = {
  nome: '',
  variedade: '',
  temp_recomendada_min: '',
  temp_recomendada_max: '',
  umidade_recomendada_min: '',
  umidade_recomendada_max: '',
  ciclo_medio_dias: '',
  descricao: '',
}

type Form = typeof formVazio

const paraForm = (c: Cultura): Form => ({
  nome: c.nome,
  variedade: c.variedade ?? '',
  temp_recomendada_min: c.temp_recomendada_min?.toString() ?? '',
  temp_recomendada_max: c.temp_recomendada_max?.toString() ?? '',
  umidade_recomendada_min: c.umidade_recomendada_min?.toString() ?? '',
  umidade_recomendada_max: c.umidade_recomendada_max?.toString() ?? '',
  ciclo_medio_dias: c.ciclo_medio_dias?.toString() ?? '',
  descricao: c.descricao ?? '',
})

function faixa(min: number | null, max: number | null, unidade: string) {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) return `${min} a ${max} ${unidade}`
  return min !== null ? `a partir de ${min} ${unidade}` : `até ${max} ${unidade}`
}

const porNome = (a: Cultura, b: Cultura) =>
  a.nome.localeCompare(b.nome) || (a.variedade ?? '').localeCompare(b.variedade ?? '')

function Culturas() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'

  const [culturas, setCulturas] = useState<Cultura[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaNova, setEmpresaNova] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [formulario, setFormulario] = useState<Formulario>({ modo: 'fechado' })
  const [form, setForm] = useState<Form>(formVazio)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<Cultura[]>('/culturas'),
      admin ? apiFetch<Empresa[]>('/empresas') : Promise.resolve([]),
    ])
      .then(([lista, listaEmpresas]) => {
        setCulturas(lista)
        setEmpresas(listaEmpresas)
      })
      .catch((error: Error) =>
        setErro(`Não foi possível carregar as culturas: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [admin])

  /** Produtor só altera as culturas da própria empresa. */
  const podeAlterar = (c: Cultura) => admin || c.empresa !== null
  const origem = (c: Cultura) =>
    c.empresa === null ? 'Plataforma' : admin ? c.empresa.razao_social : 'Sua empresa'

  function campo(nome: keyof Form) {
    return {
      value: form[nome],
      onChange: (event: { target: { value: string } }) =>
        setForm((atual) => ({ ...atual, [nome]: event.target.value })),
    }
  }

  function abrir(novo: Formulario) {
    setForm(novo.modo === 'editar' ? paraForm(novo.cultura) : formVazio)
    setEmpresaNova('')
    setErroForm('')
    setFormulario(novo)
  }

  function fechar() {
    setFormulario({ modo: 'fechado' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const corpo: Record<string, string | number | null> = {
      nome: form.nome,
      variedade: form.variedade,
      descricao: form.descricao,
    }
    // o administrador escolhe a empresa na criação; o produtor sempre cria na dele
    if (admin && formulario.modo === 'novo')
      corpo.empresa_id = empresaNova ? Number(empresaNova) : null
    for (const nome of CAMPOS_NUMERICOS) {
      const valor = form[nome].replace(',', '.').trim()
      corpo[nome] = valor === '' ? null : Number(valor)
    }

    setSalvando(true)
    try {
      const editando = formulario.modo === 'editar' ? formulario.cultura : null
      const salva = await apiFetch<Cultura>(
        editando ? `/culturas/${editando.id}` : '/culturas',
        { method: editando ? 'PATCH' : 'POST', body: JSON.stringify(corpo) },
      )
      setCulturas((atuais) =>
        (editando
          ? atuais.map((c) => (c.id === salva.id ? salva : c))
          : [...atuais, salva]
        ).sort(porNome),
      )
      fechar()
    } catch (error) {
      setErroForm(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(cultura: Cultura) {
    const nome = [cultura.nome, cultura.variedade].filter(Boolean).join(' — ')
    if (!window.confirm(`Excluir a cultura ${nome}?`)) return
    setErroAcao('')
    try {
      await apiFetch<void>(`/culturas/${cultura.id}`, { method: 'DELETE' })
      setCulturas((atuais) => atuais.filter((c) => c.id !== cultura.id))
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : 'Erro ao excluir.')
    }
  }

  return (
    <section className="culturas-page">
      <header className="culturas-page__header">
        <div>
          <span className="culturas-page__eyebrow">
            {admin ? 'ADMINISTRAÇÃO' : 'GESTÃO AGRÍCOLA'}
          </span>
          <h1>Culturas</h1>
          <p>
            {admin
              ? 'Culturas da plataforma e de cada empresa, com as condições ideais usadas nos alertas.'
              : `Culturas de ${user?.empresa?.razao_social ?? 'sua empresa'} e da plataforma, disponíveis para os seus lotes.`}
          </p>
        </div>

        <button type="button" className="btn-primary" onClick={() => abrir({ modo: 'novo' })}>
          + Nova cultura
        </button>
      </header>

      <Modal
        aberto={formulario.modo !== 'fechado'}
        titulo={formulario.modo === 'editar' ? 'Editar cultura' : 'Nova cultura'}
        onFechar={fechar}
      >
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          {admin && formulario.modo === 'novo' && (
            <label className="form-field">
              <span>Disponível para</span>
              <select value={empresaNova} onChange={(event) => setEmpresaNova(event.target.value)}>
                <option value="">Plataforma (todas as empresas)</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    Somente {e.razao_social}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!admin && formulario.modo === 'novo' && (
            <p className="form-hint">
              A cultura será cadastrada para {user?.empresa?.razao_social ?? 'a sua empresa'}.
            </p>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span>Nome *</span>
              <input {...campo('nome')} maxLength={50} placeholder="Manga" required autoFocus />
            </label>
            <label className="form-field">
              <span>Variedade</span>
              <input {...campo('variedade')} maxLength={50} placeholder="Tommy Atkins" />
            </label>
            <label className="form-field">
              <span>Ciclo médio (dias)</span>
              <input {...campo('ciclo_medio_dias')} type="number" min={1} step={1} />
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Temperatura mínima (°C)</span>
              <input {...campo('temp_recomendada_min')} type="number" step="0.1" />
            </label>
            <label className="form-field">
              <span>Temperatura máxima (°C)</span>
              <input {...campo('temp_recomendada_max')} type="number" step="0.1" />
            </label>
            <label className="form-field">
              <span>Umidade mínima (%)</span>
              <input {...campo('umidade_recomendada_min')} type="number" min={0} max={100} step="0.1" />
            </label>
            <label className="form-field">
              <span>Umidade máxima (%)</span>
              <input {...campo('umidade_recomendada_max')} type="number" min={0} max={100} step="0.1" />
            </label>
          </div>

          <label className="form-field">
            <span>Descrição</span>
            <textarea {...campo('descricao')} rows={3} maxLength={2000} />
          </label>

          <p className="form-hint">
            O ciclo médio é usado para estimar a previsão de colheita dos lotes.
          </p>

          {erroForm && (
            <p className="form-error" role="alert">
              {erroForm}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : formulario.modo === 'editar' ? 'Salvar alterações' : 'Cadastrar cultura'}
            </button>
            <button type="button" className="btn-secondary" onClick={fechar}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {erro && (
        <p className="empty-state" role="alert">
          {erro}
        </p>
      )}
      {erroAcao && (
        <p className="form-error culturas-page__erro" role="alert">
          {erroAcao}
        </p>
      )}

      {!carregando && !erro && culturas.length === 0 && (
        <p className="empty-state">Nenhuma cultura cadastrada ainda.</p>
      )}

      {culturas.length > 0 && (
        <div className="culturas-table">
          <div className="culturas-table__head">
            <span>Cultura</span>
            <span>Origem</span>
            <span>Temperatura ideal</span>
            <span>Umidade ideal</span>
            <span>Ciclo</span>
            <span>Lotes</span>
            <span></span>
          </div>

          {culturas.map((cultura) => (
            <article className="cultura-row" key={cultura.id}>
              <div className="cultura-row__name">
                <strong>{cultura.nome}</strong>
                {cultura.variedade && <span>{cultura.variedade}</span>}
              </div>
              <span className={`cultura-origem${cultura.empresa ? '' : ' cultura-origem--plataforma'}`}>
                {origem(cultura)}
              </span>
              <span>{faixa(cultura.temp_recomendada_min, cultura.temp_recomendada_max, '°C')}</span>
              <span>{faixa(cultura.umidade_recomendada_min, cultura.umidade_recomendada_max, '%')}</span>
              <span>{cultura.ciclo_medio_dias ? `${cultura.ciclo_medio_dias} dias` : '—'}</span>
              <span>{cultura.total_lotes}</span>
              {podeAlterar(cultura) ? (
                <div className="cultura-row__acoes">
                  <button type="button" onClick={() => abrir({ modo: 'editar', cultura })}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="cultura-row__excluir"
                    onClick={() => excluir(cultura)}
                    disabled={cultura.total_lotes > 0}
                    title={cultura.total_lotes > 0 ? 'Cultura usada em lotes não pode ser excluída.' : undefined}
                  >
                    Excluir
                  </button>
                </div>
              ) : (
                <span className="cultura-row__somente-leitura" title="Culturas da plataforma são mantidas pelo administrador.">
                  Somente leitura
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Culturas
