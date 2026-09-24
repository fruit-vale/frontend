import './Plantacoes.css'

function Plantacoes() {
  return (
    <section className="plantacoes-page">
      <header className="plantacoes-page__header">
        <div>
          <span className="plantacoes-page__eyebrow">
            GESTÃO AGRÍCOLA
          </span>

          <h1>Plantações</h1>

          <p>
            Acompanhe as áreas de cultivo cadastradas no FruitVale.
          </p>
        </div>

        <button type="button" className="plantacoes-page__add">
          + Nova plantação
        </button>
      </header>

      <section className="plantacoes-summary">
        <article className="summary-card">
          <span className="summary-card__icon">🌱</span>

          <div>
            <strong>—</strong>
            <span>Plantações</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-card__icon">📡</span>

          <div>
            <strong>—</strong>
            <span>Sensores</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-card__icon">📐</span>

          <div>
            <strong>—</strong>
            <span>Área total</span>
          </div>
        </article>
      </section>

      <section className="plantacoes-list">
        <div className="plantacoes-list__header">
          <div>
            <h2>Suas plantações</h2>
            <p>Áreas cadastradas e seu status atual.</p>
          </div>

          <select defaultValue="todas" aria-label="Filtrar plantações">
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </div>

        <p className="empty-state">Nenhuma plantação cadastrada ainda.</p>
      </section>
    </section>
  )
}

export default Plantacoes