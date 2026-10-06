import { useAuth } from '../../auth/useAuth'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../auth/roles'
import './Perfil.css'

function Perfil() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <section className="perfil-page">
      <header className="perfil-page__header">
        <span className="perfil-page__eyebrow">MINHA CONTA</span>

        <h1>Perfil</h1>

        <p>
          Gerencie suas informações e preferências da conta.
        </p>
      </header>

      {/* Informações principais do usuário */}
      <section className="perfil-card">
        <div className="perfil-card__avatar" aria-hidden="true">
          {user.nome.charAt(0)}
        </div>

        <div className="perfil-card__info">
          <h2>{user.nome}</h2>

          <p>{user.email}</p>

          <p>
            {user.empresa?.razao_social ?? 'Plataforma FruitVale'}
          </p>

          <span
            className={`perfil-card__badge perfil-card__badge--${user.role}`}
          >
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </section>

      {/* Configurações da conta */}
      <section className="perfil-config">
        <div className="perfil-section-header">
          <span className="perfil-page__eyebrow">
            CONFIGURAÇÕES DA CONTA
          </span>

          <h2>Preferências e segurança</h2>

          <p>
            Gerencie seus dados e as configurações de acesso à sua conta.
          </p>
        </div>

        <div className="perfil-options">

          <button type="button" className="perfil-option">
            <div className="perfil-option__icon">
              👤
            </div>

            <div className="perfil-option__content">
              <strong>Dados do perfil</strong>

              <span>
                Nome, empresa e informações pessoais
              </span>
            </div>

            <span className="perfil-option__arrow">
              →
            </span>
          </button>

          <button type="button" className="perfil-option">
            <div className="perfil-option__icon">
              ✉️
            </div>

            <div className="perfil-option__content">
              <strong>Alterar e-mail</strong>

              <span>
                Atualize o e-mail utilizado na sua conta
              </span>
            </div>

            <span className="perfil-option__arrow">
              →
            </span>
          </button>

          <button type="button" className="perfil-option">
            <div className="perfil-option__icon">
              🔒
            </div>

            <div className="perfil-option__content">
              <strong>Alterar senha</strong>

              <span>
                Mantenha sua conta segura
              </span>
            </div>

            <span className="perfil-option__arrow">
              →
            </span>
          </button>

          <button type="button" className="perfil-option">
            <div className="perfil-option__icon">
              ⚙️
            </div>

            <div className="perfil-option__content">
              <strong>Preferências</strong>

              <span>
                Personalize sua experiência no FruitVale
              </span>
            </div>

            <span className="perfil-option__arrow">
              →
            </span>
          </button>

        </div>
      </section>

      {/* Permissões */}
      <section className="perfil-permissoes">
        <h3>Permissões do perfil</h3>

        <p>
          {ROLE_DESCRIPTIONS[user.role]}
        </p>
      </section>
    </section>
  )
}

export default Perfil