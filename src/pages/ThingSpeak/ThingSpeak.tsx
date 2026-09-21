import { useState } from 'react'
import './ThingSpeak.css'

type Feed = {
  created_at: string
  field1: string | null
  field2: string | null
}

type ChannelResponse = {
  channel: {
    name: string
    description: string | null
    field1: string | null
    field2: string | null
  }
  feeds: Feed[]
}

const campos = [
  { key: 'field1', label: 'Umidade', unidade: '%' },
  { key: 'field2', label: 'Temperatura', unidade: '°C' },
] as const

function GraficoCampo({
  campo,
  feeds,
}: {
  campo: (typeof campos)[number]
  feeds: Feed[]
}) {
  const valores = feeds
    .map((feed) => Number(feed[campo.key]))
    .filter((valor) => Number.isFinite(valor))
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const amplitude = maximo - minimo || 1
  const pontos = valores
    .map((valor, indice) => {
      const x = valores.length === 1 ? 300 : (indice / (valores.length - 1)) * 560 + 20
      const y = 190 - ((valor - minimo) / amplitude) * 150

      return `${x},${y}`
    })
    .join(' ')

  return (
    <article className="thingspeak-chart">
      <div className="thingspeak-chart__header">
        <div>
          <span>{campo.label}</span>
          <strong>{valores.at(-1) ?? '--'} <small>{campo.unidade}</small></strong>
        </div>
        <span>{valores.length} pontos</span>
      </div>

      {valores.length ? (
        <svg
          className="thingspeak-chart__svg"
          viewBox="0 0 600 220"
          role="img"
          aria-label={`Gráfico de ${campo.label}`}
        >
          <line x1="20" y1="190" x2="580" y2="190" />
          <line x1="20" y1="40" x2="20" y2="190" />
          <polyline points={pontos} />
        </svg>
      ) : (
        <p className="thingspeak-chart__empty">Sem dados numéricos para exibir.</p>
      )}
    </article>
  )
}

function ThingSpeak() {
  const [channelId, setChannelId] = useState('')
  const [readApiKey, setReadApiKey] = useState('')
  const [dados, setDados] = useState<ChannelResponse | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('Informe um canal para carregar os dados.')

  async function carregarDados() {
    if (!channelId.trim()) {
      setMensagem('Informe o ID do canal ThingSpeak.')
      return
    }

    setCarregando(true)
    setMensagem('Carregando dados do canal...')

    try {
      const parametros = new URLSearchParams({ results: '10' })

      if (readApiKey.trim()) {
        parametros.set('api_key', readApiKey.trim())
      }

      const resposta = await fetch(
        `https://api.thingspeak.com/channels/${channelId.trim()}/feeds.json?${parametros}`,
      )

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`)
      }

      const resultado = (await resposta.json()) as ChannelResponse
      setDados(resultado)
      setMensagem(`${resultado.feeds.length} leituras carregadas.`)
    } catch (erro) {
      setDados(null)
      const detalhe = erro instanceof Error ? erro.message : 'erro desconhecido'
      setMensagem(`Não foi possível carregar o canal: ${detalhe}.`)
    } finally {
      setCarregando(false)
    }
  }

  const ultimaLeitura = dados?.feeds.at(-1)

  return (
    <main className="thingspeak-page">
      <header className="thingspeak-page__header">
        <div>
          <span className="thingspeak-page__eyebrow">PROVA DE CONCEITO</span>
          <h1>Dados do ThingSpeak</h1>
          <p>Consulte as leituras recentes do canal conectado aos sensores.</p>
        </div>
        <span className="thingspeak-page__badge">● POC</span>
      </header>

      <section className="thingspeak-config">
        <div>
          <h2>Conectar canal</h2>
          <p>Use o ID do canal e, se necessário, a Read API Key.</p>
        </div>

        <div className="thingspeak-config__fields">
          <label>
            ID do canal
            <input
              type="text"
              inputMode="numeric"
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              placeholder="Ex.: 1234567"
            />
          </label>

          <label>
            Read API Key <span>(opcional)</span>
            <input
              type="password"
              value={readApiKey}
              onChange={(event) => setReadApiKey(event.target.value)}
              placeholder="Para canais privados"
            />
          </label>

          <button type="button" onClick={() => void carregarDados()} disabled={carregando}>
            {carregando ? 'Carregando...' : 'Carregar dados'}
          </button>
        </div>

        <p className="thingspeak-config__message" role="status">{mensagem}</p>
      </section>

      {dados ? (
        <>
          <section className="thingspeak-channel">
            <div>
              <span>Canal conectado</span>
              <h2>{dados.channel.name || `Canal ${channelId}`}</h2>
            </div>
            <span>{dados.feeds.length} leituras recentes</span>
          </section>

          <section className="thingspeak-metrics">
            {campos.map((campo) => (
              <article className="thingspeak-metric" key={campo.key}>
                <span>{dados.channel[campo.key] || campo.label}</span>
                <strong>{ultimaLeitura?.[campo.key] ?? '--'} <small>{campo.unidade}</small></strong>
              </article>
            ))}
          </section>

          <section className="thingspeak-charts">
            <div className="thingspeak-charts__header">
              <div>
                <h2>Gráficos das leituras</h2>
                <p>Variação dos últimos dados recebidos pelo canal.</p>
              </div>
            </div>

            <div className="thingspeak-charts__grid">
              {campos.map((campo) => (
                <GraficoCampo campo={campo} feeds={dados.feeds} key={campo.key} />
              ))}
            </div>
          </section>

          <section className="thingspeak-history">
            <div className="thingspeak-history__header">
              <div>
                <h2>Últimas leituras</h2>
                <p>Dados recebidos do canal ThingSpeak.</p>
              </div>
            </div>

            <div className="thingspeak-history__table">
              <div className="thingspeak-history__row thingspeak-history__row--header">
                <span>Data e hora</span>
                {campos.map((campo) => <span key={campo.key}>{dados.channel[campo.key] || campo.label}</span>)}
              </div>
              {dados.feeds.slice().reverse().map((feed) => (
                <div className="thingspeak-history__row" key={feed.created_at}>
                  <span>{new Date(feed.created_at).toLocaleString('pt-BR')}</span>
                  {campos.map((campo) => <span key={campo.key}>{feed[campo.key] ?? '--'}</span>)}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="thingspeak-empty">
          <span>◌</span>
          <h2>As leituras aparecerão aqui</h2>
          <p>Conecte um canal ThingSpeak para visualizar os dados dos sensores.</p>
        </section>
      )}
    </main>
  )
}

export default ThingSpeak
