import './Previsao.css'

function Previsao() {
  return (
    <section className="previsao-page">
      <header className="previsao-page__header">
        <div>
          <span className="previsao-page__eyebrow">
            PLANEJAMENTO AGRÍCOLA
          </span>

          <h1>Previsão de Colheita</h1>

          <p>
            Acompanhe a previsão de colheita das suas plantações.
          </p>
        </div>
      </header>

      <section className="previsao-summary">
        <article className="previsao-summary-card">
          <span className="previsao-summary-card__icon">
            🌾
          </span>

          <div>
            <strong>—</strong>
            <span>Plantações monitoradas</span>
          </div>
        </article>

        <article className="previsao-summary-card">
          <span className="previsao-summary-card__icon">
            📅
          </span>

          <div>
            <strong>—</strong>
            <span>Colheita nos próximos 7 dias</span>
          </div>
        </article>

        <article className="previsao-summary-card">
          <span className="previsao-summary-card__icon">
            📈
          </span>

          <div>
            <strong>—</strong>
            <span>Progresso médio</span>
          </div>
        </article>
      </section>

      <section className="previsao-list">
        <div className="previsao-list__header">
          <div>
            <h2>Próximas colheitas</h2>

            <p>
              Previsões baseadas no acompanhamento das plantações.
            </p>
          </div>

          <select defaultValue="todas" aria-label="Filtrar previsões">
            <option value="todas">Todas</option>
            <option value="uva">Uva</option>
            <option value="manga">Manga</option>
          </select>
        </div>

        <p className="empty-state">Nenhuma previsão de colheita disponível.</p>
      </section>
    </section>
  )
}

export default Previsao