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