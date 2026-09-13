import './Previsao.css'

type Previsao = {
  plantacao: string
  cultivo: string
  lote: string
  previsao: string
  diasRestantes: number
  progresso: number
  status: 'Próxima' | 'Em desenvolvimento'
  emoji: string
}

const previsoes: Previsao[] = [
  {
    plantacao: 'Fazenda Uva Norte',
    cultivo: 'Uva',
    lote: 'UV-001',
    previsao: '15/09/2026',
    diasRestantes: 5,
    progresso: 92,
    status: 'Próxima',
    emoji: '🍇',
  },
  {
    plantacao: 'Fazenda Manga Norte',
    cultivo: 'Manga',
    lote: 'MG-001',
    previsao: '28/09/2026',
    diasRestantes: 18,
    progresso: 76,
    status: 'Em desenvolvimento',
    emoji: '🥭',
  },
  {
    plantacao: 'Fazenda Uva Sul',
    cultivo: 'Uva',
    lote: 'UV-002',
    previsao: '05/10/2026',
    diasRestantes: 25,
    progresso: 68,
    status: 'Em desenvolvimento',
    emoji: '🍇',
  },
  {
    plantacao: 'Fazenda Manga Sul',
    cultivo: 'Manga',
    lote: 'MG-002',
    previsao: '18/10/2026',
    diasRestantes: 38,
    progresso: 54,
    status: 'Em desenvolvimento',
    emoji: '🥭',
  },
]

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
            <strong>4</strong>
            <span>Plantações monitoradas</span>
          </div>
        </article>

        <article className="previsao-summary-card">
          <span className="previsao-summary-card__icon">
            📅
          </span>

          <div>
            <strong>1</strong>
            <span>Colheita nos próximos 7 dias</span>
          </div>
        </article>

        <article className="previsao-summary-card">
          <span className="previsao-summary-card__icon">
            📈
          </span>

          <div>
            <strong>73%</strong>
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

        <div className="previsao-cards">
          {previsoes.map((previsao) => (
            <article
              className="previsao-card"
              key={previsao.lote}
            >
              <div className="previsao-card__top">
                <div className="previsao-card__cultivo">
                  <span className="previsao-card__emoji">
                    {previsao.emoji}
                  </span>

                  <div>
                    <h3>{previsao.plantacao}</h3>

                    <p>
                      {previsao.cultivo} • {previsao.lote}
                    </p>
                  </div>
                </div>

                <span
                  className={`previsao-status previsao-status--${previsao.status
                    .toLowerCase()
                    .replace(' ', '-')
                    .replace('ó', 'o')}`}
                >
                  {previsao.status}
                </span>
              </div>

              <div className="previsao-card__date">
                <div>
                  <span>Previsão de colheita</span>

                  <strong>{previsao.previsao}</strong>
                </div>

                <div>
                  <span>Tempo restante</span>

                  <strong>
                    {previsao.diasRestantes} dias
                  </strong>
                </div>
              </div>

              <div className="previsao-card__progress">
                <div className="previsao-card__progress-header">
                  <span>Desenvolvimento da plantação</span>

                  <strong>{previsao.progresso}%</strong>
                </div>

                <div className="previsao-progress-bar">
                  <div
                    style={{
                      width: `${previsao.progresso}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Previsao