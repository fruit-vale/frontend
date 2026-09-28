import { useAuth } from '../auth/useAuth'
import { ROLE_DESCRIPTIONS } from '../auth/roles'

function Home() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">
            VISÃO GERAL
          </span>

          <h1>
            Olá, {user.nome.split(' ')[0]}!
          </h1>

          <p>
            Acompanhe o comportamento das suas plantações.
          </p>
        </div>
      </header>

      <section className="dashboard__cultivos">
        <article className="dashboard-cultivo">
          <div className="dashboard-cultivo__icon">
            🍇
          </div>

          <div>
            <span>Uva</span>
            <strong>Monitoramento normal</strong>
          </div>

          <span className="dashboard-cultivo__status">
            ● Normal
          </span>
        </article>

        <article className="dashboard-cultivo">
          <div className="dashboard-cultivo__icon">
            🥭
          </div>

          <div>
            <span>Manga</span>
            <strong>Monitoramento normal</strong>
          </div>

          <span className="dashboard-cultivo__status">
            ● Normal
          </span>
        </article>
      </section>

      <section className="dashboard__chart">
        <div className="dashboard__section-header">
          <div>
            <span className="dashboard__eyebrow">
              MONITORAMENTO
            </span>

            <h2>Comportamento dos sensores</h2>

            <p>
              Acompanhe a variação dos dados coletados nas plantações.
            </p>
          </div>

          <select defaultValue="temperatura">
            <option value="temperatura">
              Temperatura
            </option>

            <option value="umidade">
              Umidade
            </option>

            <option value="luminosidade">
              Luminosidade
            </option>
          </select>
        </div>

        <div className="dashboard__chart-placeholder">
          <span>Gráfico dos sensores</span>
        </div>
      </section>

      <section className="dashboard__bottom">
        <article className="dashboard-info">
          <span className="dashboard-info__icon">
            ⚠️
          </span>

          <div>
            <span className="dashboard-info__label">
              ATENÇÃO
            </span>

            <h3>Nenhum alerta crítico</h3>

            <p>
              Suas plantações estão dentro dos parâmetros monitorados.
            </p>
          </div>
        </article>

        <article className="dashboard-info">
          <span className="dashboard-info__icon">
            🌾
          </span>

          <div>
            <span className="dashboard-info__label">
              PRÓXIMA COLHEITA
            </span>

            <h3>Uva • UV-001</h3>

            <p>
              Previsão para os próximos dias.
            </p>
          </div>
        </article>
      </section>
    </section>
  )
}

export default Home
