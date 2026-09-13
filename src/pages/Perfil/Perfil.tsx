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
      </header>

      <section className="perfil-card">
        <div className="perfil-card__avatar" aria-hidden="true">
          {user.nome.charAt(0)}
        </div>

        <div className="perfil-card__info">
          <h2>{user.nome}</h2>
          <p>{user.email}</p>

          <span className={`perfil-card__badge perfil-card__badge--${user.role}`}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </section>

      <section className="perfil-permissoes">
        <h3>Permissões do perfil</h3>
        <p>{ROLE_DESCRIPTIONS[user.role]}</p>
      </section>
    </section>
  )
}

export default Perfil
