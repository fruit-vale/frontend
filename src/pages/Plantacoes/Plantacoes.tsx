import './Plantacoes.css'

type Plantacao = {
  nome: string
  cultivo: string
  lote: string
  localizacao: string
  area: number
  dataPlantio: string
  status: 'Ativa' | 'Inativa'
  emoji: string
}

const plantacoes: Plantacao[] = [
  {
    nome: 'Fazenda Uva Norte',
    cultivo: 'Uva',
    lote: 'UV-001',
    localizacao: 'Petrolina, PE',
    area: 8,
    dataPlantio: '12/02/2026',
    status: 'Ativa',
    emoji: '🍇',
  },
  {
    nome: 'Fazenda Uva Sul',
    cultivo: 'Uva',
    lote: 'UV-002',
    localizacao: 'Petrolina, PE',
    area: 10,
    dataPlantio: '25/01/2026',
    status: 'Ativa',
    emoji: '🍇',
  },
  {
    nome: 'Fazenda Manga Norte',
    cultivo: 'Manga',
    lote: 'MG-001',
    localizacao: 'Petrolina, PE',
    area: 6,
    dataPlantio: '20/01/2026',
    status: 'Ativa',
    emoji: '🥭',
  },
  {
    nome: 'Fazenda Manga Sul',
    cultivo: 'Manga',
    lote: 'MG-002',
    localizacao: 'Petrolina, PE',
    area: 6,
    dataPlantio: '05/03/2026',
    status: 'Ativa',
    emoji: '🥭',
  },
]

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
            <strong>4</strong>
            <span>Plantações</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-card__icon">📡</span>

          <div>
            <strong>18</strong>
            <span>Sensores</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-card__icon">📐</span>

          <div>
            <strong>30 ha</strong>
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

        <div className="plantacoes-cards">
          {plantacoes.map((plantacao) => (
            <article
              className="plantacao-card"
              key={plantacao.lote}
            >
              <div className="plantacao-card__top">
                <div className="plantacao-card__cultivo">
                  <span className="plantacao-card__emoji">
                    {plantacao.emoji}
                  </span>

                  <div>
                    <h3>{plantacao.nome}</h3>

                    <p>
                      {plantacao.cultivo} • {plantacao.lote}
                    </p>
                  </div>
                </div>

                <span
                  className={`plantacao-status plantacao-status--${plantacao.status.toLowerCase()}`}
                >
                  ● {plantacao.status}
                </span>
              </div>

              <div className="plantacao-card__info">
                <div>
                  <span>📍 Localização</span>
                  <strong>{plantacao.localizacao}</strong>
                </div>

                <div>
                  <span>📐 Área</span>
                  <strong>{plantacao.area} hectares</strong>
                </div>

                <div>
                  <span>📅 Data de plantio</span>
                  <strong>{plantacao.dataPlantio}</strong>
                </div>
              </div>

              <button
                type="button"
                className="plantacao-card__details"
              >
                Ver detalhes →
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Plantacoes