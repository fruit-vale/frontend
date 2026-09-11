import './LeiturasAlertas.css'

type Leitura = {
  sensor: string
  tipo: string
  valor: string
  unidade: string
  plantacao: string
  horario: string
  status: 'Normal' | 'Atenção' | 'Crítico'
  icone: string
}

const leituras: Leitura[] = [
  {
    sensor: 'Umidade do solo 01',
    tipo: 'Umidade',
    valor: '68',
    unidade: '%',
    plantacao: 'Fazenda Uva Norte',
    horario: '20:25',
    status: 'Normal',
    icone: '💧',
  },
  {
    sensor: 'Temperatura 01',
    tipo: 'Temperatura',
    valor: '28',
    unidade: '°C',
    plantacao: 'Fazenda Uva Norte',
    horario: '20:22',
    status: 'Normal',
    icone: '🌡️',
  },
  {
    sensor: 'Umidade do solo 02',
    tipo: 'Umidade',
    valor: '42',
    unidade: '%',
    plantacao: 'Fazenda Manga Norte',
    horario: '20:18',
    status: 'Atenção',
    icone: '💧',
  },
  {
    sensor: 'Luminosidade 01',
    tipo: 'Luminosidade',
    valor: '32',
    unidade: 'lux',
    plantacao: 'Fazenda Manga Sul',
    horario: '20:10',
    status: 'Crítico',
    icone: '☀️',
  },
]

function LeiturasAlertas() {
  return (
    <section className="leituras-page">
      <header className="leituras-page__header">
        <div>
          <span className="leituras-page__eyebrow">
            MONITORAMENTO
          </span>

          <h1>Leituras e Alertas</h1>

          <p>
            Acompanhe os dados coletados pelos sensores das plantações.
          </p>
        </div>
      </header>

      <section className="leituras-summary">
        <article className="leitura-summary-card">
          <span className="leitura-summary-card__icon">📊</span>

          <div>
            <strong>124</strong>
            <span>Leituras hoje</span>
          </div>
        </article>

        <article className="leitura-summary-card">
          <span className="leitura-summary-card__icon">🟢</span>

          <div>
            <strong>96%</strong>
            <span>Leituras normais</span>
          </div>
        </article>

        <article className="leitura-summary-card">
          <span className="leitura-summary-card__icon">⚠️</span>

          <div>
            <strong>3</strong>
            <span>Alertas ativos</span>
          </div>
        </article>
      </section>

      <section className="leituras-content">
        <div className="leituras-content__header">
          <div>
            <h2>Últimas leituras</h2>

            <p>
              Dados recebidos recentemente pelos sensores.
            </p>
          </div>

          <select defaultValue="todas" aria-label="Filtrar leituras">
            <option value="todas">Todas</option>
            <option value="umidade">Umidade</option>
            <option value="temperatura">Temperatura</option>
            <option value="luminosidade">Luminosidade</option>
          </select>
        </div>

        <div className="leituras-list">
          {leituras.map((leitura) => (
            <article
              className="leitura-card"
              key={`${leitura.sensor}-${leitura.horario}`}
            >
              <div className="leitura-card__sensor">
                <span className="leitura-card__icon">
                  {leitura.icone}
                </span>

                <div>
                  <strong>{leitura.sensor}</strong>

                  <span>{leitura.plantacao}</span>
                </div>
              </div>

              <div className="leitura-card__value">
                <span>{leitura.tipo}</span>

                <strong>
                  {leitura.valor}
                  <small>{leitura.unidade}</small>
                </strong>
              </div>

              <div className="leitura-card__time">
                <span>Última leitura</span>
                <strong>{leitura.horario}</strong>
              </div>

              <span
                className={`leitura-status leitura-status--${leitura.status
                  .toLowerCase()
                  .replace('ã', 'a')}`}
              >
                ● {leitura.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="alertas-section">
        <div className="alertas-section__header">
          <div>
            <h2>Alertas recentes</h2>

            <p>
              Situações que precisam da sua atenção.
            </p>
          </div>

          <button type="button">
            Ver todos
          </button>
        </div>

        <div className="alertas-list">
          <article className="alerta-card alerta-card--warning">
            <span className="alerta-card__icon">⚠️</span>

            <div>
              <strong>Umidade abaixo do recomendado</strong>

              <p>
                Fazenda Manga Norte • Lote MG-001
              </p>
            </div>

            <span className="alerta-card__time">
              Há 12 min
            </span>
          </article>

          <article className="alerta-card alerta-card--critical">
            <span className="alerta-card__icon">🔴</span>

            <div>
              <strong>Luminosidade muito baixa</strong>

              <p>
                Fazenda Manga Sul • Lote MG-002
              </p>
            </div>

            <span className="alerta-card__time">
              Há 20 min
            </span>
          </article>
        </div>
      </section>
    </section>
  )
}

export default LeiturasAlertas