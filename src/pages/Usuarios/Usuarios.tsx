import { useEffect, useState } from 'react'
import { ROLE_LABELS, type Role } from '../../auth/roles'
import { apiFetch } from '../../lib/api'
import './Usuarios.css'

type Usuario = {
  id: number
  nome: string
  email: string
  role: Role | null
}

const roleOptions: Role[] = ['administrador', 'produtor', 'analista']

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiFetch<Usuario[]>('/usuarios')
      .then(setUsuarios)
      .catch((error: Error) =>
        setErro(`Não foi possível carregar os usuários: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [])

  async function handleRoleChange(id: number, role: Role) {
    try {
      const atualizado = await apiFetch<Usuario>(`/usuarios/${id}/perfil`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setErro('')
      setUsuarios((prev) =>
        prev.map((usuario) => (usuario.id === id ? atualizado : usuario)),
      )
    } catch (error) {
      setErro(
        `Não foi possível alterar o perfil: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      )
    }
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
        {erro && (
          <p className="empty-state" role="alert">
            {erro}
          </p>
        )}

        {!carregando && !erro && usuarios.length === 0 && (
          <p className="empty-state">Nenhum usuário cadastrado.</p>
        )}

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
                className={`usuario-row__role usuario-row__role--${usuario.role ?? 'sem-perfil'}`}
                value={usuario.role ?? ''}
                onChange={(event) =>
                  handleRoleChange(usuario.id, event.target.value as Role)
                }
                aria-label={`Perfil de ${usuario.nome}`}
              >
                {!usuario.role && (
                  <option value="" disabled>
                    Sem perfil
                  </option>
                )}
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
