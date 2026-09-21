import { useCallback, useEffect, useRef, useState } from 'react'

import './Sensores.css'

type Sensor = {
  nome: string
  tipo: string
  plantacao: string
  lote: string
  ultimaLeitura: string
  status: 'Ativo' | 'Inativo'
  icone: string
}

const sensores: Sensor[] = [
  {
    nome: 'Sensor de Umidade 01',
    tipo: 'Umidade do solo',
    plantacao: 'Fazenda Uva Norte',
    lote: 'UV-001',
    ultimaLeitura: 'Há 5 minutos',
    status: 'Ativo',
    icone: '💧',
  },
  {
    nome: 'Sensor de Temperatura 01',
    tipo: 'Temperatura',
    plantacao: 'Fazenda Uva Norte',
    lote: 'UV-001',
    ultimaLeitura: 'Há 8 minutos',
    status: 'Ativo',
    icone: '🌡️',
  },
  {
    nome: 'Sensor de Umidade 02',
    tipo: 'Umidade do solo',
    plantacao: 'Fazenda Manga Norte',
    lote: 'MG-001',
    ultimaLeitura: 'Há 12 minutos',
    status: 'Ativo',
    icone: '💧',
  },
  {
    nome: 'Sensor de Luminosidade 01',
    tipo: 'Luminosidade',
    plantacao: 'Fazenda Manga Sul',
    lote: 'MG-002',
    ultimaLeitura: 'Há 25 minutos',
    status: 'Inativo',
    icone: '☀️',
  },
]

type DadosFalsos = {
  umidade: number
  temperatura: number
}

function gerarNumero(minimo: number, maximo: number, casasDecimais = 0) {
  const valor = minimo + Math.random() * (maximo - minimo)

  return Number(valor.toFixed(casasDecimais))
}

function gerarDadosFalsos(): DadosFalsos {
  return {
    umidade: gerarNumero(35, 85),
    temperatura: gerarNumero(18, 34, 1),
  }
}

function Sensores() {
  const [endpoint, setEndpoint] = useState('https://api.thingspeak.com/update')
  const [apiKey, setApiKey] = useState('')
  const [dados, setDados] = useState<DadosFalsos>(() => gerarDadosFalsos())
  const [intervalo, setIntervalo] = useState('15')
  const [enviando, setEnviando] = useState(false)
  const [simulacaoAtiva, setSimulacaoAtiva] = useState(false)
  const [mensagem, setMensagem] = useState('Nenhum dado enviado ainda.')
  const gerarEEnviarRef = useRef<() => void>(() => {})

  const enviarDados = useCallback(async (dadosParaEnviar = dados) => {
    if (!apiKey.trim()) {
      setMensagem('Informe a Write API Key do canal antes de enviar.')
      return
    }

    setEnviando(true)

    try {
      const parametros = new URLSearchParams({
        api_key: apiKey.trim(),
        field1: String(dadosParaEnviar.umidade),
        field2: String(dadosParaEnviar.temperatura),
      })
      const resposta = await fetch(`${endpoint.trim()}?${parametros}`)

      if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status}`)
      }

      const resultado = await resposta.text()
      setMensagem(`Enviado com sucesso. Entry ID: ${resultado || 'processado'}.`)
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : 'erro desconhecido'
      setMensagem(`Falha no envio: ${detalhe}. Verifique o endpoint e o CORS.`)
    } finally {
      setEnviando(false)
    }
  }, [apiKey, dados, endpoint])

  const gerarEEnviar = useCallback(() => {
    const novosDados = gerarDadosFalsos()
    setDados(novosDados)
    void enviarDados(novosDados)
  }, [enviarDados])

  useEffect(() => {
    gerarEEnviarRef.current = gerarEEnviar
  }, [gerarEEnviar])

  useEffect(() => {
    if (!simulacaoAtiva) {
      return
    }

    const timer = window.setInterval(() => {
      gerarEEnviarRef.current()
    }, Math.max(Number(intervalo) || 15, 15) * 1000)

    return () => window.clearInterval(timer)
  }, [intervalo, simulacaoAtiva])

  return (
    <section className="sensores-page">
      <header className="sensores-page__header">
        <div>
          <span className="sensores-page__eyebrow">
            MONITORAMENTO
          </span>

          <h1>Sensores</h1>

          <p>
            Monitore os sensores instalados nas suas plantações.
          </p>
        </div>

        <button type="button" className="sensores-page__add">
          + Cadastrar sensor
        </button>
      </header>

      <section className="sensores-summary">
        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">📡</span>

          <div>
            <strong>18</strong>
            <span>Total de sensores</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🟢</span>

          <div>
            <strong>16</strong>
            <span>Sensores ativos</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🔴</span>

          <div>
            <strong>2</strong>
            <span>Sensores inativos</span>
          </div>
        </article>
      </section>

      <section className="sensor-simulator">
        <div className="sensor-simulator__header">
          <div>
            <span className="sensor-simulator__eyebrow">AMBIENTE DE TESTE</span>
            <h2>Enviar dados falsos</h2>
            <p>Gere uma leitura e envie os valores para um canal ThingSpeak.</p>
          </div>

          <span className={`sensor-simulator__state ${simulacaoAtiva ? 'sensor-simulator__state--active' : ''}`}>
            {simulacaoAtiva ? 'Simulação ativa' : 'Simulação parada'}
          </span>
        </div>

        <div className="sensor-simulator__fields">
          <label>
            Endpoint
            <input
              type="url"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder=""
            />
          </label>

          <label>
            Write API Key
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Cole a chave do canal"
            />
          </label>

          <label>
            Intervalo (segundos)
            <input
              type="number"
              min="15"
              value={intervalo}
              onChange={(event) => setIntervalo(event.target.value)}
            />
          </label>
        </div>

        <div className="sensor-simulator__readings">
          <span>Umidade <strong>{dados.umidade}%</strong></span>
          <span>Temperatura <strong>{dados.temperatura} °C</strong></span>
        </div>

        <div className="sensor-simulator__actions">
          <button type="button" onClick={gerarEEnviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Gerar e enviar agora'}
          </button>
          <button
            type="button"
            className="sensor-simulator__secondary"
            onClick={() => setSimulacaoAtiva((ativa) => !ativa)}
          >
            {simulacaoAtiva ? 'Parar simulação' : 'Iniciar simulação'}
          </button>
          <span className="sensor-simulator__message" role="status">{mensagem}</span>
        </div>
      </section>

      <section className="sensores-list">
        <div className="sensores-list__header">
          <div>
            <h2>Sensores cadastrados</h2>

            <p>
              Acompanhe o funcionamento dos dispositivos instalados.
            </p>
          </div>

          <select defaultValue="todos" aria-label="Filtrar sensores">
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>

        <div className="sensores-table">
          <div className="sensores-table__head">
            <span>Sensor</span>
            <span>Tipo</span>
            <span>Plantação</span>
            <span>Última leitura</span>
            <span>Status</span>
            <span></span>
          </div>

          {sensores.map((sensor) => (
            <article
              className="sensor-row"
              key={sensor.nome}
            >
              <div className="sensor-row__name">
                <span className="sensor-row__icon">
                  {sensor.icone}
                </span>

                <div>
                  <strong>{sensor.nome}</strong>
                  <span>{sensor.lote}</span>
                </div>
              </div>

              <span className="sensor-row__type">
                {sensor.tipo}
              </span>

              <span className="sensor-row__plantacao">
                {sensor.plantacao}
              </span>

              <span className="sensor-row__reading">
                {sensor.ultimaLeitura}
              </span>

              <span
                className={`sensor-status sensor-status--${sensor.status.toLowerCase()}`}
              >
                ● {sensor.status}
              </span>

              <button
                type="button"
                className="sensor-row__details"
              >
                Ver →
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Sensores