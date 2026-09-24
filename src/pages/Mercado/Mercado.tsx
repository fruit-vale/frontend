import './Mercado.css'

function Mercado() {
  return (
    <section className="mercado-page">
      <header className="mercado-page__header">
        <div>
          <span className="mercado-page__eyebrow">ANÁLISE DE MERCADO</span>

          <h1>Mercado e Exportação</h1>

          <p>
            Dashboards analíticos, preços de mercado e recomendações de
            exportação.
          </p>
        </div>

        <button type="button" className="mercado-page__report">
          Gerar relatório
        </button>
      </header>

      <p className="empty-state">Nenhum dado de mercado disponível.</p>

      <section className="mercado-recomendacoes">
        <h2>Recomendações de exportação</h2>

        <p className="empty-state">Nenhuma recomendação disponível.</p>
      </section>
    </section>
  )
}

export default Mercado
