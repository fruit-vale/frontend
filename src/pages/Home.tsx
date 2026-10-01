import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import DadosSensores, { type RespostaLeituras } from '../components/GraficoSensores/DadosSensores'
import GraficoSensores, { type Serie } from '../components/GraficoSensores/GraficoSensores'
import PrimeirosPassos from '../components/PrimeirosPassos/PrimeirosPassos'
import { apiFetch } from '../lib/api'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from './Sensores/tipos'
import './Home.css'

type StatusCultivo = 'normal' | 'atencao' | 'sem_dados' | 'sem_faixa'

/** GET /painel */
type Painel = {
  resumo: {
    propriedades: number
    lotes_em_cultivo: number
    area_em_cultivo_ha: number
    sensores_total: number
    sensores_ativos: number
    leituras_24h: number
  }
  culturas: {
    cultura: { id: number; nome: string; variedade: string | null }
    lotes: number
    area_ha: number
    status: StatusCultivo
    motivo: string | null
  }[]
  proxima_colheita: {
    lote: { id: number; nome: string }
    propriedade: string
    cultura: { nome: string; variedade: string | null }
    previsao: string
    /** negativo = atrasada */
    dias: number
  } | null
  alertas: {
    nao_lidos: number
    recentes: { id: number; mensagem: string; data_hora: string | null; lote: string }[]
  }
  tipos: { tipo: TipoMedida; unidade: string | null }[]
}

/** GET /painel/serie */
type SerieResposta = {
  tipo: TipoMedida
  intervalo: 'hour' | 'day'
  unidade: string | null
  series: Serie[]
}

// status sempre com ícone + texto, nunca só a cor
const STATUS: Record<StatusCultivo, { rotulo: string; icone: string }> = {
  normal: { rotulo: 'Normal', icone: '✓' },
  atencao: { rotulo: 'Atenção', icone: '!' },
  sem_dados: { rotulo: 'Sem leituras recentes', icone: '–' },
  sem_faixa: { rotulo: 'Sem faixa ideal', icone: 'i' },
}

const PERIODOS = [
  { dias: 1, rotulo: 'Últimas 24 horas' },
  { dias: 7, rotulo: 'Últimos 7 dias' },
  { dias: 30, rotulo: 'Últimos 30 dias' },
]

const EMOJIS: [RegExp, string][] = [
  [/uva/i, '🍇'],
  [/manga/i, '🥭'],
  [/melancia/i, '🍉'],
  [/mel[aã]o/i, '🍈'],
  [/banana/i, '🍌'],
  [/coco/i, '🥥'],
  [/lim[aã]o/i, '🍋'],
  [/acerola|cereja/i, '🍒'],
  [/tomate/i, '🍅'],
]
const emoji = (nome: string) => EMOJIS.find(([re]) => re.test(nome))?.[1] ?? '🌱'

const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const fmtData = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')

function quando(dias: number) {
  if (dias < 0) return `atrasada há ${-dias} dia${dias === -1 ? '' : 's'}`
  if (dias === 0) return 'prevista para hoje'
  if (dias === 1) return 'prevista para amanhã'
  return `em ${dias} dias`
}

function Home() {
  const { user } = useAuth()
  const [painel, setPainel] = useState<Painel | null>(null)
  const [erro, setErro] = useState('')
  const [tipo, setTipo] = useState<TipoMedida | null>(null)
  const [dias, setDias] = useState(7)
  const [serie, setSerie] = useState<{ chave: string; dados: SerieResposta | null; erro?: string }>()

  useEffect(() => {
    apiFetch<Painel>('/painel')
      .then((dados) => {
        setPainel(dados)
        // começa pela temperatura, se algum sensor mede
        const tipos = dados.tipos.map((t) => t.tipo)
        setTipo(tipos.includes('TEMPERATURA') ? 'TEMPERATURA' : (tipos[0] ?? null))
      })
      .catch((error: Error) => setErro(`Não foi possível carregar o painel: ${error.message}`))
  }, [])

  const chaveSerie = tipo ? `${tipo}-${dias}` : ''
  useEffect(() => {
    if (!tipo) return
    let ativo = true
    const chave = `${tipo}-${dias}`
    apiFetch<SerieResposta>(`/painel/serie?tipo=${tipo}&dias=${dias}`)
      .then((dados) => ativo && setSerie({ chave, dados }))
      .catch((error: Error) => ativo && setSerie({ chave, dados: null, erro: error.message }))
    return () => {
      ativo = false
    }
  }, [tipo, dias])
  const serieAtual = serie?.chave === chaveSerie ? serie : undefined

  // "Ver dados em tabela": leituras do mesmo tipo e período do gráfico
  const [tabelaAberta, setTabelaAberta] = useState(false)
  const buscarLeituras = useCallback(
    () => apiFetch<RespostaLeituras>(`/painel/leituras?tipo=${tipo}&dias=${dias}`),
    [tipo, dias],
  )
  const periodo = PERIODOS.find((p) => p.dias === dias)?.rotulo.toLowerCase() ?? ''

  if (!user) return null
  const gestor = user.role === 'administrador' || user.role === 'produtor'
  const r = painel?.resumo

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <span className="dashboard__eyebrow">VISÃO GERAL</span>
        <h1>Olá, {user.nome.split(' ')[0]}!</h1>
        <p>
          {user.role === 'administrador'
            ? 'Acompanhe as plantações de todas as empresas.'
            : `Acompanhe as plantações de ${user.empresa?.razao_social ?? 'sua empresa'}.`}
        </p>
      </header>

      {/* guia de configuração: só o administrador cadastra empresas e propriedades */}
      {user.role === 'administrador' && <PrimeirosPassos />}

      {erro && (
        <p className="empty-state" role="alert">
          {erro}
        </p>
      )}

      {r && (
        <section className="dashboard__resumo" aria-label="Resumo">
          <article className="dashboard-numero">
            <span>Propriedades ativas</span>
            <strong>{r.propriedades}</strong>
          </article>
          <article className="dashboard-numero">
            <span>Lotes em cultivo</span>
            <strong>{r.lotes_em_cultivo}</strong>
            <small>{fmt(r.area_em_cultivo_ha)} ha</small>
          </article>
          <article className="dashboard-numero">
            <span>Sensores ativos</span>
            <strong>{r.sensores_ativos}</strong>
            <small>de {r.sensores_total} cadastrado{r.sensores_total === 1 ? '' : 's'}</small>
          </article>
          <article className="dashboard-numero">
            <span>Leituras nas últimas 24 h</span>
            <strong>{r.leituras_24h.toLocaleString('pt-BR')}</strong>
          </article>
        </section>
      )}

      {painel && (
        <section className="dashboard__bloco">
          <div className="dashboard__section-header">
            <div>
              <span className="dashboard__eyebrow">CULTIVOS</span>
              <h2>Culturas em cultivo</h2>
              <p>Situação pela leitura mais recente dos sensores, comparada à faixa ideal da cultura.</p>
            </div>
          </div>

          {painel.culturas.length === 0 ? (
            <p className="empty-state">
              Nenhum lote em cultivo.{' '}
              {gestor && <Link to="/cultivos">Cadastre um lote em Cultivos e Lotes.</Link>}
            </p>
          ) : (
            <div className="dashboard__cultivos">
              {painel.culturas.map((c) => (
                <article key={c.cultura.id} className="dashboard-cultivo">
                  <div className="dashboard-cultivo__icon" aria-hidden="true">
                    {emoji(c.cultura.nome)}
                  </div>
                  <div className="dashboard-cultivo__texto">
                    <strong>
                      {c.cultura.nome}
                      {c.cultura.variedade && <span> — {c.cultura.variedade}</span>}
                    </strong>
                    <small>
                      {c.lotes} lote{c.lotes === 1 ? '' : 's'}
                      {c.area_ha > 0 && ` · ${fmt(c.area_ha)} ha`}
                    </small>
                    {c.motivo && <p className="dashboard-cultivo__motivo">{c.motivo}</p>}
                  </div>
                  <span className={`dashboard-status dashboard-status--${c.status}`}>
                    <i aria-hidden="true">{STATUS[c.status].icone}</i>
                    {STATUS[c.status].rotulo}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {painel && (
        <section className="dashboard__bloco dashboard__chart">
          <div className="dashboard__section-header">
            <div>
              <span className="dashboard__eyebrow">MONITORAMENTO</span>
              <h2>Comportamento dos sensores</h2>
              <p>Média {serieAtual?.dados?.intervalo === 'day' ? 'diária' : 'por hora'} de cada sensor.</p>
            </div>

            {painel.tipos.length > 0 && (
              <div className="dashboard__filtros">
                <select value={tipo ?? ''} onChange={(e) => setTipo(e.target.value as TipoMedida)} aria-label="Dado">
                  {painel.tipos.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {TIPO_MEDIDA_LABELS[t.tipo]}
                    </option>
                  ))}
                </select>
                <select value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período">
                  {PERIODOS.map((p) => (
                    <option key={p.dias} value={p.dias}>
                      {p.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {painel.tipos.length === 0 ? (
            <p className="empty-state">
              Nenhum sensor com dados configurados ainda.{' '}
              {gestor && <Link to="/sensores">Cadastre um sensor em Sensores.</Link>}
            </p>
          ) : !serieAtual ? (
            <p className="form-hint">Carregando leituras...</p>
          ) : serieAtual.erro ? (
            <p className="form-error" role="alert">
              Não foi possível carregar as leituras: {serieAtual.erro}
            </p>
          ) : (
            <GraficoSensores
              series={serieAtual.dados!.series}
              unidade={serieAtual.dados!.unidade}
              intervalo={serieAtual.dados!.intervalo}
              titulo={tipo ? TIPO_MEDIDA_LABELS[tipo] : ''}
              onVerDados={() => setTabelaAberta(true)}
            />
          )}
          {serieAtual?.dados && tipo && (
            <DadosSensores
              aberto={tabelaAberta}
              onFechar={() => setTabelaAberta(false)}
              titulo={`${TIPO_MEDIDA_LABELS[tipo]} — ${periodo}`}
              series={serieAtual.dados.series}
              unidade={serieAtual.dados.unidade}
              intervalo={serieAtual.dados.intervalo}
              buscarLeituras={buscarLeituras}
            />
          )}
        </section>
      )}

      {painel && (
        <section className="dashboard__bottom">
          <article className="dashboard-info">
            <span className="dashboard-info__icon" aria-hidden="true">
              {painel.alertas.nao_lidos ? '⚠️' : '✅'}
            </span>
            <div>
              <span className="dashboard-info__label">ALERTAS</span>
              {painel.alertas.nao_lidos === 0 ? (
                <>
                  <h3>Nenhum alerta não lido</h3>
                  <p>Os alertas climáticos dos lotes aparecem aqui.</p>
                </>
              ) : (
                <>
                  <h3>
                    {painel.alertas.nao_lidos} alerta{painel.alertas.nao_lidos === 1 ? '' : 's'} não lido
                    {painel.alertas.nao_lidos === 1 ? '' : 's'}
                  </h3>
                  <ul className="dashboard-info__lista">
                    {painel.alertas.recentes.map((a) => (
                      <li key={a.id}>
                        <strong>{a.lote}:</strong> {a.mensagem}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </article>

          <article className="dashboard-info">
            <span className="dashboard-info__icon" aria-hidden="true">
              🌾
            </span>
            <div>
              <span className="dashboard-info__label">PRÓXIMA COLHEITA</span>
              {painel.proxima_colheita ? (
                <>
                  <h3>
                    {painel.proxima_colheita.cultura.nome} • {painel.proxima_colheita.lote.nome}
                  </h3>
                  <p className={painel.proxima_colheita.dias < 0 ? 'dashboard-info__atrasada' : undefined}>
                    {fmtData(painel.proxima_colheita.previsao)} ({quando(painel.proxima_colheita.dias)}) ·{' '}
                    {painel.proxima_colheita.propriedade}
                  </p>
                </>
              ) : (
                <>
                  <h3>Sem previsão</h3>
                  <p>Nenhum lote em cultivo tem previsão de colheita.</p>
                </>
              )}
            </div>
          </article>
        </section>
      )}
    </section>
  )
}

export default Home
