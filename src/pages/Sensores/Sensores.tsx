import './Sensores.css'

function Sensores() {
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
            <strong>—</strong>
            <span>Total de sensores</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🟢</span>

          <div>
            <strong>—</strong>
            <span>Sensores ativos</span>
          </div>
        </article>

        <article className="sensor-summary-card">
          <span className="sensor-summary-card__icon">🔴</span>

          <div>
            <strong>—</strong>
            <span>Sensores inativos</span>
          </div>
        </article>
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

        <p className="empty-state">Nenhum sensor cadastrado ainda.</p>
      </section>
    </section>
  )
}

export default Sensores