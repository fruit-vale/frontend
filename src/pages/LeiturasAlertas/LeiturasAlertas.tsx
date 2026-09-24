import './LeiturasAlertas.css'

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
            <strong>—</strong>
            <span>Leituras hoje</span>
          </div>
        </article>

        <article className="leitura-summary-card">
          <span className="leitura-summary-card__icon">🟢</span>

          <div>
            <strong>—</strong>
            <span>Leituras normais</span>
          </div>
        </article>

        <article className="leitura-summary-card">
          <span className="leitura-summary-card__icon">⚠️</span>

          <div>
            <strong>—</strong>
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

        <p className="empty-state">Nenhuma leitura recebida ainda.</p>
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

        <p className="empty-state">Nenhum alerta no momento.</p>
      </section>
    </section>
  )
}

export default LeiturasAlertas