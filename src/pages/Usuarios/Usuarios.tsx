import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Empresa } from '../../auth/authContextInstance'
import { ROLE_LABELS, type Role } from '../../auth/roles'
import { useAuth } from '../../auth/useAuth'
import { apiFetch } from '../../lib/api'
import './Usuarios.css'

type Usuario = {
  id: number
  nome: string
  email: string
  cpf: string
  telefone: string | null
  role: Role | null
  empresa: Empresa | null
}

type Formulario =
  | { modo: 'fechado' }
  | { modo: 'novo' }
  | { modo: 'editar'; usuario: Usuario }

const roleOptions: Role[] = ['administrador', 'produtor', 'analista']

const formVazio = {
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  senha: '',
  role: 'produtor' as Role,
  empresa_id: '',
}

function Usuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [formulario, setFormulario] = useState<Formulario>({ modo: 'fechado' })
  const [form, setForm] = useState(formVazio)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<Usuario[]>('/usuarios'),
      apiFetch<Empresa[]>('/empresas'),
    ])
      .then(([listaUsuarios, listaEmpresas]) => {
        setUsuarios(listaUsuarios)
        setEmpresas(listaEmpresas)
      })
      .catch((error: Error) =>
        setErro(`Não foi possível carregar os usuários: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [])

  const semEmpresa = form.role === 'administrador'

  function campo(nome: Exclude<keyof typeof formVazio, 'role'>) {
    return {
      value: form[nome],
      onChange: (event: { target: { value: string } }) =>
        setForm((atual) => ({ ...atual, [nome]: event.target.value })),
    }
  }

  function abrirNovo() {
    setForm(formVazio)
    setErroForm('')
    setFormulario({ modo: 'novo' })
  }

  function abrirEdicao(usuario: Usuario) {
    setForm({
      ...formVazio,
      role: usuario.role ?? 'produtor',
      empresa_id: usuario.empresa ? String(usuario.empresa.id) : '',
    })
    setErroForm('')
    setFormulario({ modo: 'editar', usuario })
  }

  function fechar() {
    setFormulario({ modo: 'fechado' })
    setErroForm('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!semEmpresa && !form.empresa_id) {
      setErroForm('Selecione a empresa do usuário.')
      return
    }

    const vinculo = {
      role: form.role,
      empresa_id: semEmpresa ? null : Number(form.empresa_id),
    }

    setSalvando(true)

    try {
      if (formulario.modo === 'editar') {
        const atualizado = await apiFetch<Usuario>(
          `/usuarios/${formulario.usuario.id}`,
          { method: 'PATCH', body: JSON.stringify(vinculo) },
        )
        setUsuarios((atuais) =>
          atuais.map((u) => (u.id === atualizado.id ? atualizado : u)),
        )
      } else {
        const criado = await apiFetch<Usuario>('/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            cpf: form.cpf,
            telefone: form.telefone,
            senha: form.senha,
            ...vinculo,
          }),
        })
        setUsuarios((atuais) =>
          [...atuais, criado].sort((a, b) => a.nome.localeCompare(b.nome)),
        )
      }
      fechar()
    } catch (error) {
      setErroForm(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="usuarios-page">
      <header className="usuarios-page__header">
        <div>
          <span className="usuarios-page__eyebrow">ADMINISTRAÇÃO</span>

          <h1>Usuários</h1>

          <p>
            Cadastre contas, defina o perfil e vincule cada usuário à sua
            empresa.
          </p>
        </div>

        {formulario.modo === 'fechado' && (
          <button type="button" className="usuarios-page__add" onClick={abrirNovo}>
            + Novo usuário
          </button>
        )}
      </header>

      {formulario.modo !== 'fechado' && (
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <h2>
            {formulario.modo === 'novo'
              ? 'Novo usuário'
              : `Editar ${formulario.usuario.nome}`}
          </h2>

          <div className="form-grid">
            {formulario.modo === 'novo' && (
              <>
                <label className="form-field">
                  <span>Nome *</span>
                  <input {...campo('nome')} maxLength={100} required />
                </label>
                <label className="form-field">
                  <span>E-mail *</span>
                  <input
                    {...campo('email')}
                    type="email"
                    maxLength={100}
                    placeholder="nome@empresa.com.br"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>CPF *</span>
                  <input
                    {...campo('cpf')}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Telefone</span>
                  <input {...campo('telefone')} type="tel" maxLength={20} />
                </label>
                <label className="form-field">
                  <span>Senha inicial *</span>
                  <input
                    {...campo('senha')}
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                    required
                  />
                </label>
              </>
            )}

            <label className="form-field">
              <span>Perfil *</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    role: event.target.value as Role,
                  }))
                }
                disabled={
                  formulario.modo === 'editar' &&
                  formulario.usuario.id === user?.id
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Empresa {semEmpresa ? '' : '*'}</span>
              <select
                {...campo('empresa_id')}
                value={semEmpresa ? '' : form.empresa_id}
                disabled={semEmpresa}
              >
                <option value="">
                  {semEmpresa ? 'Plataforma (sem empresa)' : 'Selecione...'}
                </option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razao_social}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!semEmpresa && empresas.length === 0 && (
            <p className="form-error">
              Nenhuma empresa cadastrada.{' '}
              <Link to="/empresas">Cadastre uma empresa</Link> antes de criar
              produtores e analistas.
            </p>
          )}

          {erroForm && (
            <p className="form-error" role="alert">
              {erroForm}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando
                ? 'Salvando...'
                : formulario.modo === 'novo'
                  ? 'Cadastrar usuário'
                  : 'Salvar alterações'}
            </button>
            <button type="button" className="btn-secondary" onClick={fechar}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="usuarios-list">
        {erro && (
          <p className="empty-state" role="alert">
            {erro}
          </p>
        )}

        {!carregando && !erro && usuarios.length === 0 && (
          <p className="empty-state">Nenhum usuário cadastrado.</p>
        )}

        {usuarios.length > 0 && (
          <div className="usuarios-table">
            <div className="usuarios-table__head">
              <span>Usuário</span>
              <span>E-mail</span>
              <span>Empresa</span>
              <span>Perfil</span>
              <span></span>
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

                <span className="usuario-row__email">
                  {usuario.empresa?.razao_social ?? 'Plataforma'}
                </span>

                <span
                  className={`usuario-row__role usuario-row__role--${usuario.role ?? 'sem-perfil'}`}
                >
                  {usuario.role ? ROLE_LABELS[usuario.role] : 'Sem perfil'}
                </span>

                <button
                  type="button"
                  className="usuario-row__edit"
                  onClick={() => abrirEdicao(usuario)}
                >
                  Editar
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default Usuarios
