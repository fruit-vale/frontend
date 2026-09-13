import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import loginImg from '../../assets/login-fruitvale.png'
import './Login.css'

type View = 'login' | 'recover'

function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverEnviado, setRecoverEnviado] = useState(false)
  const [erro, setErro] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !senha) {
      setErro('Preencha e-mail e senha para continuar.')
      return
    }

    setErro('')
    navigate('/')
  }

  function handleRecoverSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!recoverEmail) {
      setErro('Informe seu e-mail para continuar.')
      return
    }

    setErro('')
    setRecoverEnviado(true)
  }

  function voltarParaLogin() {
    setView('login')
    setErro('')
    setRecoverEmail('')
    setRecoverEnviado(false)
  }

  return (
    <div className="login-page">
      <div className="login-page__art">
        <img src={loginImg} alt="" />
      </div>

      <div className="login-page__panel">
        <div className="login-panel__inner">
          {view === 'login' ? (
            <form
              className="login-form"
              onSubmit={handleSubmit}
              noValidate
              key="login"
            >
              <h1>Bem-vindo de volta!</h1>
              <p className="login-form__subtitle">
                Acompanhe cultivos, sensores e alertas da safra.
              </p>

              <label className="login-form__field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  placeholder="voce@fruitvale.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                />
              </label>

              <label className="login-form__field">
                <span>Senha</span>
                <input
                  type="password"
                  name="senha"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="current-password"
                />
              </label>

              {erro && (
                <p className="login-form__error" role="alert">
                  {erro}
                </p>
              )}

              <div className="login-form__row">
                <label className="login-form__remember">
                  <input type="checkbox" />
                  <span>Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  className="login-form__link"
                  onClick={() => {
                    setErro('')
                    setView('recover')
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <button type="submit" className="login-form__submit">
                Entrar
              </button>

              <p className="login-form__signup">
                Ainda não tem conta?{' '}
                <a href="#">Fale com o administrador</a>
              </p>
            </form>
          ) : (
            <form
              className="login-form"
              onSubmit={handleRecoverSubmit}
              noValidate
              key="recover"
            >
              <h1>Recuperar senha</h1>

              {recoverEnviado ? (
                <>
                  <p className="login-form__subtitle">
                    Se <strong>{recoverEmail}</strong> estiver cadastrado,
                    você vai receber um link de recuperação em instantes.
                  </p>

                  <button
                    type="button"
                    className="login-form__submit"
                    onClick={voltarParaLogin}
                  >
                    Voltar para o login
                  </button>
                </>
              ) : (
                <>
                  <p className="login-form__subtitle">
                    Informe o e-mail cadastrado e enviaremos um link para
                    redefinir sua senha.
                  </p>

                  <label className="login-form__field">
                    <span>E-mail</span>
                    <input
                      type="email"
                      name="recover-email"
                      placeholder="voce@fruitvale.com"
                      value={recoverEmail}
                      onChange={(event) =>
                        setRecoverEmail(event.target.value)
                      }
                      autoComplete="username"
                    />
                  </label>

                  {erro && (
                    <p className="login-form__error" role="alert">
                      {erro}
                    </p>
                  )}

                  <button type="submit" className="login-form__submit">
                    Enviar link de recuperação
                  </button>

                  <p className="login-form__signup">
                    <button
                      type="button"
                      className="login-form__link"
                      onClick={voltarParaLogin}
                    >
                      Voltar para o login
                    </button>
                  </p>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
