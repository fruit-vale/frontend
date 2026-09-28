import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import Modal from '../../components/Modal/Modal'
import { apiFetch } from '../../lib/api'
import CredenciaisSensor, { type Credenciais } from './CredenciaisSensor'
import EditarMedidasForm from './EditarMedidasForm'
import NovoSensorForm from './NovoSensorForm'
import {
  STATUS_LABELS,
  type LoteResumo,
  type Sensor,
  type StatusSensor,
} from './tipos'
import './Sensores.css'

type FiltroStatus = 'todos' | StatusSensor

type ModalEstado =
  | { tipo: 'fechado' }
  | { tipo: 'novo' }
  | {
      tipo: 'credenciais'
      titulo: string
      credenciais: Credenciais
      medidas: Sensor['medidas']
    }
  | { tipo: 'medidas'; sensor: Sensor }

const porCodigo = (a: Sensor, b: Sensor) =>
  a.codigo_sensor.localeCompare(b.codigo_sensor)

const ACESSO_LABELS = {
  ativo: 'Conectável',
  inativo: 'Bloqueado',
  sem_acesso: 'Sem acesso MQTT',
} as const

function Sensores() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'

  const [sensores, setSensores] = useState<Sensor[]>([])
  const [lotes, setLotes] = useState<LoteResumo[]>([])
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalEstado>({ tipo: 'fechado' })

  useEffect(() => {
    Promise.all([
      apiFetch<Sensor[]>('/sensores'),
      apiFetch<LoteResumo[]>('/lotes'),
    ])
      .then(([lista, listaLotes]) => {
        setSensores(lista.sort(porCodigo))
        setLotes(listaLotes)
      })
      .catch((error: Error) =>
        setErro(`Não foi possível carregar os sensores: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [])

  // empresas presentes na lista, para o filtro do administrador
  const empresas = useMemo(() => {
    const unicas = new Map(sensores.map((s) => [s.empresa.id, s.empresa]))
    return [...unicas.values()].sort((a, b) =>
      a.razao_social.localeCompare(b.razao_social),
    )
  }, [sensores])

  const daEmpresa = filtroEmpresa
    ? sensores.filter((s) => s.empresa.id === Number(filtroEmpresa))
    : sensores
  const ativos = daEmpresa.filter((s) => s.status === 'ATIVO').length
  const inativos = daEmpresa.filter((s) => s.status === 'INATIVO').length
  const visiveis = daEmpresa.filter(
    (s) => filtroStatus === 'todos' || s.status === filtroStatus,
  )

  function fecharModal() {
    setModal({ tipo: 'fechado' })
  }

  function substituir(sensor: Sensor) {
    setSensores((atuais) =>
      atuais.map((s) => (s.id === sensor.id ? sensor : s)),
    )
  }

  async function executar(id: number, acao: () => Promise<void>) {
    setErroAcao('')
    setEmAndamento(id)
    try {
      await acao()
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : 'Erro na operação.')
    } finally {
      setEmAndamento(null)
    }
  }

  function cadastrado(sensor: Sensor, credenciais: Credenciais) {
    setSensores((atuais) => [...atuais, sensor].sort(porCodigo))
    setModal({
      tipo: 'credenciais',
      titulo: 'Sensor cadastrado',
      credenciais,
      medidas: sensor.medidas,
    })
  }

  function novaSenha(sensor: Sensor) {
    const semAcesso = sensor.acesso_mqtt === 'sem_acesso'
    const confirmado = window.confirm(
      semAcesso
        ? `Criar o acesso MQTT de ${sensor.codigo_sensor}?`
        : `Gerar uma nova senha para ${sensor.codigo_sensor}?\n\nA senha atual deixa de funcionar imediatamente.`,
    )
    if (!confirmado) return

    void executar(sensor.id, async () => {
      const credenciais = await apiFetch<Credenciais>(
        `/sensores/${sensor.id}/senha`,
        { method: 'POST' },
      )
      substituir({
        ...sensor,
        acesso_mqtt: sensor.status === 'INATIVO' ? 'inativo' : 'ativo',
      })
      setModal({
        tipo: 'credenciais',
        titulo: semAcesso ? 'Acesso MQTT criado' : 'Nova senha gerada',
        credenciais,
        medidas: sensor.medidas,
      })
    })
  }

  function alterarStatus(sensor: Sensor, status: StatusSensor) {
    if (
      status === 'INATIVO' &&
      !window.confirm(
        `Desativar ${sensor.codigo_sensor}? Ele será desconectado e não poderá mais enviar leituras.`,
      )
    )
      return

    void executar(sensor.id, async () => {
      const alterado = await apiFetch<Sensor>(`/sensores/${sensor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      substituir(alterado)
    })
  }

  function excluir(sensor: Sensor) {
    const confirmado = window.confirm(
      `Excluir ${sensor.codigo_sensor}?\n\nO sensor e o acesso MQTT dele serão removidos.`,
    )
    if (!confirmado) return

    void executar(sensor.id, async () => {
      await apiFetch<void>(`/sensores/${sensor.id}`, { method: 'DELETE' })
      setSensores((atuais) => atuais.filter((s) => s.id !== sensor.id))
    })
  }

  const colunas = admin ? ' sensores-table--admin' : ''

  return (
    <section className="sensores-page">
      <header className="sensores-page__header">
        <div>
          <span className="sensores-page__eyebrow">MONITORAMENTO</span>

          <h1>Sensores</h1>

          <p>
            {admin
              ? 'Sensores de todas as empresas e seus acessos ao broker MQTT.'
              : `Sensores de ${user?.empresa?.razao_social ?? 'sua empresa'} e seus acessos ao broker MQTT.`}
          </p>
        </div>

        <button
          type="button"
          className="sensores-page__add"
          onClick={() => setModal({ tipo: 'novo' })}
          disabled={carregando || !!erro}
        >
          + Cadastrar sensor
        </button>
      </header>

      <Modal
        aberto={modal.tipo !== 'fechado'}
        titulo={
          modal.tipo === 'credenciais'
            ? modal.titulo
            : modal.tipo === 'medidas'
              ? `Dados de ${modal.sensor.codigo_sensor}`
              : 'Cadastrar sensor'
        }
        largo={modal.tipo === 'novo' || modal.tipo === 'medidas'}
        onFechar={fecharModal}
      >
        {modal.tipo === 'novo' && (
          <NovoSensorForm
            lotes={lotes}
            onCriado={cadastrado}
            onCancelar={fecharModal}
          />
        )}
        {modal.tipo === 'credenciais' && (
          <CredenciaisSensor
            credenciais={modal.credenciais}
            medidas={modal.medidas}
            onConcluir={fecharModal}
          />
        )}
        {modal.tipo === 'medidas' && (
          <EditarMedidasForm
            key={modal.sensor.id}
            sensor={modal.sensor}
            onSalvo={(salvo) => {
              substituir(salvo)
              fecharModal()
            }}
            onCancelar={fecharModal}
          />
        )}
      </Modal>

      <section className="sensores-summary">
        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">📡</span>
          <div>
            <strong>{carregando ? '—' : daEmpresa.length}</strong>
            <span>Total de sensores</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🟢</span>
          <div>
            <strong>{carregando ? '—' : ativos}</strong>
            <span>Sensores ativos</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🔴</span>
          <div>
            <strong>{carregando ? '—' : inativos}</strong>
            <span>Sensores inativos</span>
          </div>
        </article>
      </section>

      <section className="sensores-list">
        <div className="sensores-list__header">
          <div>
            <h2>Sensores cadastrados</h2>
            <p>Acompanhe os sensores e gerencie o acesso de cada um ao broker.</p>
          </div>

          <div className="sensores-list__filtros">
            {admin && empresas.length > 1 && (
              <select
                value={filtroEmpresa}
                onChange={(event) => setFiltroEmpresa(event.target.value)}
                aria-label="Filtrar por empresa"
              >
                <option value="">Todas as empresas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razao_social}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(event.target.value as FiltroStatus)
              }
              aria-label="Filtrar sensores"
            >
              <option value="todos">Todos</option>
              <option value="ATIVO">Ativos</option>
              <option value="INATIVO">Inativos</option>
              <option value="MANUTENCAO">Em manutenção</option>
            </select>
          </div>
        </div>

        {erro && (
          <p className="empty-state" role="alert">
            {erro}
          </p>
        )}

        {erroAcao && (
          <p className="form-error sensores-list__erro" role="alert">
            {erroAcao}
          </p>
        )}

        {!carregando && !erro && visiveis.length === 0 && (
          <p className="empty-state">
            {sensores.length === 0
              ? 'Nenhum sensor cadastrado ainda.'
              : 'Nenhum sensor encontrado com esse filtro.'}
          </p>
        )}

        {visiveis.length > 0 && (
          <div className="sensores-table">
            <div className={`sensores-table__head${colunas}`}>
              <span>Sensor</span>
              <span>Lote</span>
              {admin && <span>Empresa</span>}
              <span>Status</span>
              <span></span>
            </div>

            {visiveis.map((sensor) => {
              const ocupado = emAndamento === sensor.id
              const temLeituras = sensor.total_leituras > 0
              return (
                <article key={sensor.id} className={`sensor-row${colunas}`}>
                  <div className="sensor-row__name">
                    <span className="sensor-row__icon" aria-hidden="true">
                      📡
                    </span>
                    <div>
                      <strong>{sensor.codigo_sensor}</strong>
                      <span>
                        {sensor.tipo} · {sensor.total_leituras} leitura
                        {sensor.total_leituras === 1 ? '' : 's'}
                      </span>
                      {sensor.acesso_mqtt && (
                        <span
                          className={`sensor-row__acesso sensor-row__acesso--${sensor.acesso_mqtt}`}
                        >
                          {ACESSO_LABELS[sensor.acesso_mqtt]}
                        </span>
                      )}
                      <span className="sensor-row__medidas">
                        {sensor.medidas.length
                          ? sensor.medidas.map((m) => (
                              <em key={m.id} title={`chave no JSON: ${m.chave}`}>
                                {m.nome}
                                {m.unidade ? ` (${m.unidade})` : ''}
                              </em>
                            ))
                          : 'Nenhum dado configurado'}
                      </span>
                    </div>
                  </div>

                  <div className="sensor-row__lote">
                    <strong>{sensor.lote?.nome ?? 'Sem lote'}</strong>
                    <span>{sensor.propriedade.nome}</span>
                  </div>

                  {admin && (
                    <span className="sensor-row__plantacao">
                      {sensor.empresa.razao_social}
                    </span>
                  )}

                  <span
                    className={`sensor-status sensor-status--${sensor.status.toLowerCase()}`}
                  >
                    {STATUS_LABELS[sensor.status]}
                  </span>

                  <div className="sensor-row__acoes">
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => setModal({ tipo: 'medidas', sensor })}
                    >
                      Dados
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => novaSenha(sensor)}
                    >
                      {sensor.acesso_mqtt === 'sem_acesso'
                        ? 'Criar acesso'
                        : 'Nova senha'}
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() =>
                        alterarStatus(
                          sensor,
                          sensor.status === 'INATIVO' ? 'ATIVO' : 'INATIVO',
                        )
                      }
                    >
                      {sensor.status === 'INATIVO' ? 'Reativar' : 'Desativar'}
                    </button>
                    <button
                      type="button"
                      className="sensor-row__excluir"
                      disabled={ocupado || temLeituras}
                      title={
                        temLeituras
                          ? 'Sensor com leituras registradas não pode ser excluído; desative-o.'
                          : undefined
                      }
                      onClick={() => excluir(sensor)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default Sensores
