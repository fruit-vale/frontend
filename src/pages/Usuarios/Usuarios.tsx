import { useState } from 'react'
import { ROLE_LABELS, type Role } from '../../auth/roles'
import { mockUsers } from '../../auth/mockUsers'
import './Usuarios.css'

type Usuario = {
  id: string
  nome: string
  email: string
  role: Role
}

const roleOptions: Role[] = ['administrador', 'produtor', 'analista']

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(
    mockUsers.map(({ id, nome, email, role }) => ({ id, nome, email, role })),
  )

  function handleRoleChange(id: string, role: Role) {
    setUsuarios((prev) =>
      prev.map((usuario) => (usuario.id === id ? { ...usuario, role } : usuario)),
    )
  }

  return (
    <section className="usuarios-page">
      <header className="usuarios-page__header">
        <div>
          <span className="usuarios-page__eyebrow">ADMINISTRAÇÃO</span>

          <h1>Usuários</h1>

          <p>
            Gerencie as contas da plataforma e altere as permissões de cada
            perfil.
          </p>
        </div>

        <button type="button" className="usuarios-page__add">
          + Novo usuário
        </button>
      </header>

      <section className="usuarios-list">
        <div className="usuarios-table">
          <div className="usuarios-table__head">
            <span>Usuário</span>
            <span>E-mail</span>
            <span>Perfil</span>
          </div>

          {usuarios.map((usuario) => (
            <article className="usuario-row" key={usuario.id}>
              <div className="usuario-row__name">
                <span className="usuario-row__avatar" aria-hidden="true">
                  {usuario.nome.charAt(0)}
                </span>
                <strong>{usuario.nome}</strong>
              </div>

              <span className="usuario-row__email">{usuario.email}</span>

              <select
                className={`usuario-row__role usuario-row__role--${usuario.role}`}
                value={usuario.role}
                onChange={(event) =>
                  handleRoleChange(usuario.id, event.target.value as Role)
                }
                aria-label={`Perfil de ${usuario.nome}`}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Usuarios
