import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../../lib/api'
import { nomeCultura, type CulturaResumo, type Lote, type Safra } from './tipos'

type Props = {
  lote: Lote
  /** culturas disponíveis (vazio para quem só consulta) */
  culturas: CulturaResumo[]
  podeEditar: boolean
  /** a safra atual mudou (colheita/nova safra): o card do lote precisa recarregar */
  onLoteAlterado: () => void
}

type Formulario =
  | { tipo: 'nenhum' }
  | { tipo: 'colheita' }
  | { tipo: 'nova' }
  | { tipo: 'editar'; safra: Safra }

const UNIDADES = ['kg', 't', 'caixas', 'sacas', 'unidades']
const hoje = () => new Date().toISOString().slice(0, 10)

const formatarData = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '—'
const numero = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

/** Campos compartilhados pelos formulários de colheita, nova safra e edição. */
type Campos = {
  cultura_id: string
  data_plantio: string
  previsao_colheita: string
  data_colheita: string
  producao: string
  unidade_producao: string
  observacoes: string
  situacao: 'EM_PREPARO' | 'EM_CULTIVO'
}

const camposVazios = (): Campos => ({
  cultura_id: '',
  data_plantio: '',
  previsao_colheita: '',
  data_colheita: hoje(),
  producao: '',
  unidade_producao: 'kg',
  observacoes: '',
  situacao: 'EM_CULTIVO',
})

const camposDaSafra = (s: Safra): Campos => ({
  cultura_id: String(s.cultura.id),
  data_plantio: s.data_plantio ?? '',
  previsao_colheita: s.previsao_colheita ?? '',
  data_colheita: s.data_colheita ?? '',
  producao: s.producao?.toString() ?? '',
  unidade_producao: s.unidade_producao ?? 'kg',
  observacoes: s.observacoes ?? '',
  situacao: 'EM_CULTIVO',
})

const numeroOuNull = (texto: string) => {
  const limpo = texto.replace(',', '.').trim()
  return limpo === '' ? null : Number(limpo)
}

/** Linha do tempo das safras do lote, com colheita e início de nova safra. */
function HistoricoLote({ lote, culturas, podeEditar, onLoteAlterado }: Props) {
  const [safras, setSafras] = useState<Safra[] | null>(null)
  const [erro, setErro] = useState('')
  const [formulario, setFormulario] = useState<Formulario>({ tipo: 'nenhum' })
  const [campos, setCampos] = useState<Campos>(camposVazios)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(() => {
    apiFetch<Safra[]>(`/lotes/${lote.id}/safras`)
      .then(setSafras)
      .catch((error: Error) => setErro(`Não foi possível carregar o histórico: ${error.message}`))
  }, [lote.id])

  useEffect(carregar, [carregar])

  // culturas da plataforma e da empresa do lote
  const culturasDoLote = culturas.filter((c) => !c.empresa || c.empresa.id === lote.empresa.id)

  function abrir(novo: Formulario) {
    setCampos(novo.tipo === 'editar' ? camposDaSafra(novo.safra) : camposVazios())
    setErroForm('')
    setFormulario(novo)
  }

  function campo(nome: keyof Campos) {
    return {
      value: campos[nome],
      onChange: (event: { target: { value: string } }) =>
        setCampos((atual) => ({ ...atual, [nome]: event.target.value })),
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formulario.tipo === 'nenhum') return
    if (formulario.tipo !== 'colheita' && !campos.cultura_id)
      return setErroForm('Selecione a cultura.')

    const producao = numeroOuNull(campos.producao)
    const [caminho, metodo, corpo] =
      formulario.tipo === 'colheita'
        ? [`/lotes/${lote.id}/safras/colheita`, 'POST', {
            data_colheita: campos.data_colheita,
            producao,
            unidade_producao: campos.unidade_producao,
            observacoes: campos.observacoes || null,
          }]
        : formulario.tipo === 'nova'
          ? [`/lotes/${lote.id}/safras`, 'POST', {
              cultura_id: Number(campos.cultura_id),
              data_plantio: campos.data_plantio || null,
              previsao_colheita: campos.previsao_colheita || null,
              situacao: campos.situacao,
              observacoes: campos.observacoes || null,
            }]
          : [`/lotes/${lote.id}/safras/${formulario.safra.id}`, 'PATCH', {
              cultura_id: Number(campos.cultura_id),
              data_plantio: campos.data_plantio || null,
              previsao_colheita: campos.previsao_colheita || null,
              data_colheita: formulario.safra.em_andamento ? null : campos.data_colheita || null,
              producao: formulario.safra.em_andamento ? null : producao,
              unidade_producao: campos.unidade_producao,
              observacoes: campos.observacoes || null,
            }]

    setErroForm('')
    setSalvando(true)
    try {
      await apiFetch<Safra>(caminho, { method: metodo, body: JSON.stringify(corpo) })
      setFormulario({ tipo: 'nenhum' })
      carregar()
      // colheita, nova safra ou edição da atual mudam o que o card mostra
      onLoteAlterado()
    } catch (error) {
      setErroForm(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(safra: Safra) {
    if (!window.confirm(`Excluir a safra de ${nomeCultura(safra.cultura)} colhida em ${formatarData(safra.data_colheita)}?`))
      return
    try {
      await apiFetch<void>(`/lotes/${lote.id}/safras/${safra.id}`, { method: 'DELETE' })
      carregar()
      onLoteAlterado()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir.')
    }
  }

  const editandoAtual = formulario.tipo === 'editar' && formulario.safra.em_andamento
  const mostraCultura = formulario.tipo === 'nova' || formulario.tipo === 'editar'
  const mostraColheita = formulario.tipo === 'colheita' || (formulario.tipo === 'editar' && !editandoAtual)
  const titulos = {
    colheita: 'Registrar colheita da safra atual',
    nova: 'Iniciar nova safra',
    editar: 'Corrigir safra',
  } as const

  return (
    <div className="historico-lote">
      {podeEditar && formulario.tipo === 'nenhum' && (
        <div className="historico-lote__acoes">
          {lote.safra_atual_id ? (
            <button type="button" className="btn-primary" onClick={() => abrir({ tipo: 'colheita' })}>
              Registrar colheita
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => abrir({ tipo: 'nova' })}>
              Iniciar nova safra
            </button>
          )}
        </div>
      )}

      {formulario.tipo !== 'nenhum' && (
        <form className="form-card historico-lote__form" onSubmit={enviar} noValidate>
          <h2>{titulos[formulario.tipo]}</h2>

          {mostraCultura && (
            <div className="form-grid">
              <label className="form-field">
                <span>Cultura *</span>
                <select {...campo('cultura_id')}>
                  <option value="">Selecione...</option>
                  {culturasDoLote.map((c) => (
                    <option key={c.id} value={c.id}>
                      {nomeCultura(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Data de plantio</span>
                <input type="date" {...campo('data_plantio')} />
              </label>
              <label className="form-field">
                <span>Previsão de colheita</span>
                <input type="date" {...campo('previsao_colheita')} min={campos.data_plantio || undefined} />
              </label>
              {formulario.tipo === 'nova' && (
                <label className="form-field">
                  <span>Situação</span>
                  <select {...campo('situacao')}>
                    <option value="EM_PREPARO">Em preparo</option>
                    <option value="EM_CULTIVO">Em cultivo</option>
                  </select>
                </label>
              )}
            </div>
          )}

          {mostraColheita && (
            <div className="form-grid">
              <label className="form-field">
                <span>Data de colheita *</span>
                <input type="date" {...campo('data_colheita')} max={hoje()} />
              </label>
              <label className="form-field">
                <span>Produção colhida</span>
                <input type="number" min={0} step="0.01" placeholder="ex.: 12500" {...campo('producao')} />
              </label>
              <label className="form-field">
                <span>Unidade</span>
                <input list="unidades-producao" maxLength={20} {...campo('unidade_producao')} />
                <datalist id="unidades-producao">
                  {UNIDADES.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </label>
            </div>
          )}

          <label className="form-field">
            <span>Observações</span>
            <textarea rows={2} maxLength={2000} {...campo('observacoes')} />
          </label>

          {erroForm && (
            <p className="form-error" role="alert">
              {erroForm}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setFormulario({ tipo: 'nenhum' })}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      {safras === null && !erro && <p className="form-hint">Carregando histórico...</p>}
      {safras?.length === 0 && <p className="empty-state">Nenhuma safra registrada.</p>}

      {safras && safras.length > 0 && (
        <ol className="historico-lote__linha">
          {safras.map((s) => (
            <li key={s.id} className={s.em_andamento ? 'safra safra--andamento' : 'safra'}>
              <div className="safra__cabecalho">
                <strong>{nomeCultura(s.cultura)}</strong>
                <span className={s.em_andamento ? 'safra__status safra__status--andamento' : 'safra__status'}>
                  {s.em_andamento ? 'Em andamento' : `Colhida em ${formatarData(s.data_colheita)}`}
                </span>
              </div>

              <dl className="safra__dados">
                <div>
                  <dt>Plantio</dt>
                  <dd>{formatarData(s.data_plantio)}</dd>
                </div>
                <div>
                  <dt>{s.em_andamento ? 'Colheita prevista' : 'Previsão era'}</dt>
                  <dd>{formatarData(s.previsao_colheita)}</dd>
                </div>
                <div>
                  <dt>{s.em_andamento ? 'Há' : 'Duração'}</dt>
                  <dd>{s.duracao_dias !== null ? `${s.duracao_dias} dias` : '—'}</dd>
                </div>
                {!s.em_andamento && (
                  <div>
                    <dt>Produção</dt>
                    <dd>
                      {s.producao !== null ? `${numero(s.producao)} ${s.unidade_producao ?? ''}` : '—'}
                      {s.produtividade !== null && (
                        <small> · {numero(s.produtividade)} {s.unidade_producao}/ha</small>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              {s.observacoes && <p className="safra__obs">{s.observacoes}</p>}

              {podeEditar && formulario.tipo === 'nenhum' && (
                <div className="safra__acoes">
                  <button type="button" onClick={() => abrir({ tipo: 'editar', safra: s })}>
                    Corrigir
                  </button>
                  {!s.em_andamento && (
                    <button type="button" className="safra__excluir" onClick={() => excluir(s)}>
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default HistoricoLote
