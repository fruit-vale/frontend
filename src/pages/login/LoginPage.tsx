import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import loginImg from '@/assets/login-fruitvale.png'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/config/routes'
import { useAction } from '@/hooks/use-action'
import { useAuth } from '@/hooks/use-auth'

type View = 'login' | 'recover'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login } = useAuth()
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverEnviado, setRecoverEnviado] = useState(false)
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error, setError } = useAction()

  const from = (location.state as { from?: Location } | null)?.from?.pathname

  // já autenticado: não faz sentido ver a tela de login
  if (user) return <Navigate to={from ?? ROUTES.home} replace />

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !senha) {
      setErroLocal('Preencha e-mail e senha para continuar.')
      return
    }
    setErroLocal('')

    const usuario = await run(
      () => login(email, senha, lembrar),
      'Não foi possível entrar. Tente novamente.',
    )
    if (usuario) navigate(from ?? ROUTES.home, { replace: true })
  }

  function recuperar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!recoverEmail) {
      setErroLocal('Informe seu e-mail para continuar.')
      return
    }
    setErroLocal('')
    setRecoverEnviado(true)
  }

  function voltarParaLogin() {
    setView('login')
    setErroLocal('')
    setError('')
    setRecoverEmail('')
    setRecoverEnviado(false)
  }

  const mensagemErro = erroLocal || error

  return (
    <div className="flex min-h-svh bg-[#171022]">
      <div className="relative hidden flex-[1.5] lg:block">
        <img src={loginImg} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent from-60% to-[#171022]" />
      </div>

      {/* painel escuro fixo, independente do tema do sistema */}
      <div className="dark flex min-w-0 flex-1 items-center justify-center bg-[#171022] p-6 text-foreground lg:min-w-[26rem]">
        <div className="w-full max-w-sm">
          {view === 'login' ? (
            <form onSubmit={entrar} noValidate className="flex flex-col gap-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-[#f6f1e7]">
                  Bem-vindo de volta!
                </h1>
                <p className="text-sm text-[#b7a6c9]">
                  Acompanhe cultivos, sensores e alertas da safra.
                </p>
              </div>

              <FormField label="E-mail" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="voce@fruitvale.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="h-10"
                />
              </FormField>

              <FormField label="Senha" htmlFor="senha">
                <Input
                  id="senha"
                  type="password"
                  name="senha"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="h-10"
                />
              </FormField>

              <ErrorMessage message={mensagemErro} />

              <div className="flex items-center justify-between gap-3 text-sm">
                <Label className="cursor-pointer text-muted-foreground">
                  <Checkbox
                    checked={lembrar}
                    onCheckedChange={(marcado) => setLembrar(marcado)}
                  />
                  Lembrar de mim
                </Label>
                <button
                  type="button"
                  className="text-[#e0a83d] underline-offset-4 hover:underline"
                  onClick={() => {
                    setErroLocal('')
                    setError('')
                    setView('recover')
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" size="lg" className="h-10" disabled={pending}>
                {pending && <Loader2Icon className="animate-spin" />}
                {pending ? 'Entrando...' : 'Entrar'}
              </Button>

              <p className="text-center text-sm text-[#b7a6c9]">
                Ainda não tem conta? Fale com o administrador.
              </p>
            </form>
          ) : (
            <form onSubmit={recuperar} noValidate className="flex flex-col gap-5">
              <h1 className="text-3xl font-semibold text-[#f6f1e7]">Recuperar senha</h1>

              {recoverEnviado ? (
                <>
                  <p className="text-sm text-[#b7a6c9]">
                    Se <strong className="text-[#f6f1e7]">{recoverEmail}</strong>{' '}
                    estiver cadastrado, você vai receber um link de recuperação em
                    instantes.
                  </p>
                  <Button type="button" size="lg" className="h-10" onClick={voltarParaLogin}>
                    Voltar para o login
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#b7a6c9]">
                    Informe o e-mail cadastrado e enviaremos um link para
                    redefinir sua senha.
                  </p>

                  <FormField label="E-mail" htmlFor="recover-email">
                    <Input
                      id="recover-email"
                      type="email"
                      name="recover-email"
                      placeholder="voce@fruitvale.com.br"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      autoComplete="username"
                      className="h-10"
                    />
                  </FormField>

                  <ErrorMessage message={erroLocal} />

                  <Button type="submit" size="lg" className="h-10">
                    Enviar link de recuperação
                  </Button>

                  <button
                    type="button"
                    className="text-center text-sm text-[#e0a83d] underline-offset-4 hover:underline"
                    onClick={voltarParaLogin}
                  >
                    Voltar para o login
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
