import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import Modal from '../../components/Modal/Modal'
import { apiFetch } from '../../lib/api'
import LoteForm from './LoteForm'
import HistoricoLote from './HistoricoLote'
import MapaLote from './MapaLote'
import {
  SITUACAO_LABELS,
  nomeCultura,
  type CulturaResumo,
  type Lote,
  type Propriedade,
} from './tipos'
import './Cultivos.css'

type ModalEstado =
  | { tipo: 'fechado' }
  | { tipo: 'novo' }
  | { tipo: 'editar'; lote: Lote }
  | { tipo: 'mapa'; lote: Lote }
  | { tipo: 'historico'; lote: Lote }

const formatarData = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '—'

const porNome = (a: Lote, b: Lote) =>
  a.propriedade.nome.localeCompare(b.propriedade.nome) ||
  a.nome_identificacao.localeCompare(b.nome_identificacao)

function Cultivos() {
  const { user } = useAuth()
  const podeEditar = user?.role === 'administrador' || user?.role === 'produtor'

  const [lotes, setLotes] = useState<Lote[]>([])
  const [propriedades, setPropriedades] = useState<Propriedade[]>([])
  const [culturas, setCulturas] = useState<CulturaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [modal, setModal] = useState<ModalEstado>({ tipo: 'fechado' })

  useEffect(() => {
    Promise.all([
      apiFetch<Lote[]>('/lotes'),
      podeEditar ? apiFetch<Propriedade[]>('/propriedades') : Promise.resolve([]),
      podeEditar ? apiFetch<CulturaResumo[]>('/culturas') : Promise.resolve([]),
    ])
      .then(([listaLotes, listaPropriedades, listaCulturas]) => {
        setLotes(listaLotes)
        setPropriedades(listaPropriedades)
        setCulturas(listaCulturas)
      })
      .catch((error: Error) =>
        setErro(`Não foi possível carregar os lotes: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [podeEditar])

  function fechar() {
    setModal({ tipo: 'fechado' })
  }

  /** Colheita ou nova safra mudam cultura/situação: recarrega o lote. */
  function recarregarLote(id: number) {
    apiFetch<Lote>(`/lotes/${id}`)
      .then((lote) => {
        setLotes((atuais) => atuais.map((l) => (l.id === lote.id ? lote : l)))
        setModal((atual) => (atual.tipo === 'historico' ? { ...atual, lote } : atual))
      })
      .catch(() => undefined)
  }

  function salvo(lote: Lote) {
    setLotes((atuais) =>
      (atuais.some((l) => l.id === lote.id)
        ? atuais.map((l) => (l.id === lote.id ? lote : l))
        : [...atuais, lote]
      ).sort(porNome),
    )
    setModal({ tipo: 'mapa', lote })
  }

  async function excluir(lote: Lote) {
    if (!window.confirm(`Excluir o lote ${lote.nome_identificacao}?`)) return
    setErroAcao('')
    try {
      await apiFetch<void>(`/lotes/${lote.id}`, { method: 'DELETE' })
      setLotes((atuais) => atuais.filter((l) => l.id !== lote.id))
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : 'Erro ao excluir.')
    }
  }

  const titulo =
    modal.tipo === 'novo'
      ? 'Novo lote'
      : modal.tipo === 'editar'
        ? `Editar ${modal.lote.nome_identificacao}`
        : modal.tipo === 'mapa'
          ? `${modal.lote.nome_identificacao} — ${modal.lote.propriedade.nome}`
          : modal.tipo === 'historico'
            ? `Histórico de cultivo — ${modal.lote.nome_identificacao}`
            : ''

  return (
    <section className="cultivos-page">
      <header className="cultivos-page__header">
        <div>
          <span className="cultivos-page__eyebrow">GESTÃO AGRÍCOLA</span>
          <h1>Cultivos e Lotes</h1>
          <p>Cadastre os lotes, marque cada um no mapa e acompanhe o cultivo.</p>
        </div>

        {podeEditar && (
          <button
            type="button"
            className="cultivos-page__add"
            onClick={() => setModal({ tipo: 'novo' })}
            disabled={carregando || !!erro}
          >
            + Novo lote
          </button>
        )}
      </header>

      <Modal aberto={modal.tipo !== 'fechado'} titulo={titulo} onFechar={fechar} largo>
        {(modal.tipo === 'novo' || modal.tipo === 'editar') && (
          <LoteForm
            // remonta ao trocar de lote, para reiniciar o formulário
            key={modal.tipo === 'editar' ? modal.lote.id : 'novo'}
            propriedades={propriedades}
            culturas={culturas}
            lote={modal.tipo === 'editar' ? modal.lote : undefined}
            onSalvo={salvo}
            onCancelar={fechar}
          />
        )}
        {modal.tipo === 'mapa' && <MapaLote key={modal.lote.id} lote={modal.lote} />}
        {modal.tipo === 'historico' && (
          <HistoricoLote
            key={modal.lote.id}
            lote={modal.lote}
            culturas={culturas}
            podeEditar={podeEditar}
            onLoteAlterado={() => recarregarLote(modal.lote.id)}
          />
        )}
      </Modal>

      {erro && (
        <p className="empty-state" role="alert">
          {erro}
        </p>
      )}
      {erroAcao && (
        <p className="form-error cultivos-page__erro" role="alert">
          {erroAcao}
        </p>
      )}

      {!carregando && !erro && lotes.length === 0 && (
        <p className="empty-state">Nenhum lote cadastrado ainda.</p>
      )}

      {lotes.length > 0 && (
        <div className="cultivos-grid">
          {lotes.map((lote) => (
            <article className="cultivo-card" key={lote.id}>
              <div className="cultivo-card__topo">
                <span className="cultivo-card__icon" aria-hidden="true">
                  🌱
                </span>
                <span className={`lote-situacao lote-situacao--${lote.situacao.toLowerCase()}`}>
                  {SITUACAO_LABELS[lote.situacao]}
                </span>
              </div>

              <div className="cultivo-card__content">
                <h2>{lote.nome_identificacao}</h2>
                <p>
                  {nomeCultura(lote.cultura)} · {lote.propriedade.nome}
                  {user?.role === 'administrador' && ` · ${lote.empresa.razao_social}`}
                </p>

                <dl className="lote-dados">
                  <div>
                    <dt>Área</dt>
                    <dd>{lote.area_ha !== null ? `${lote.area_ha.toLocaleString('pt-BR')} ha` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Plantio</dt>
                    <dd>{formatarData(lote.data_plantio)}</dd>
                  </div>
                  <div>
                    <dt>Colheita prevista</dt>
                    <dd>{formatarData(lote.previsao_colheita)}</dd>
                  </div>
                  <div>
                    <dt>Sensores</dt>
                    <dd>{lote.total_sensores}</dd>
                  </div>
                  <div>
                    <dt>Safras</dt>
                    <dd>{lote.total_safras}</dd>
                  </div>
                </dl>
              </div>

              <div className="cultivo-card__acoes">
                <button type="button" className="cultivo-card__link" onClick={() => setModal({ tipo: 'historico', lote })}>
                  Histórico
                </button>
                <button type="button" className="cultivo-card__link" onClick={() => setModal({ tipo: 'mapa', lote })}>
                  {lote.geometria ? 'Ver no mapa' : 'Sem mapa'}
                </button>
                {podeEditar && (
                  <>
                    <button type="button" className="cultivo-card__link" onClick={() => setModal({ tipo: 'editar', lote })}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="cultivo-card__link cultivo-card__link--excluir"
                      onClick={() => excluir(lote)}
                      disabled={lote.total_alertas > 0}
                      title={lote.total_alertas > 0 ? 'Lote com alertas não pode ser excluído; marque-o como colhido.' : undefined}
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Cultivos
