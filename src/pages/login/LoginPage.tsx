import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import loginImg from '@/assets/landing-campo.webp'
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

/**
 * Painel claro fixo, independente do tema do sistema: os componentes do
 * formulário leem estas variáveis, então ficam na paleta da marca.
 */
const PALETA = {
  '--foreground': '#292B26',
  '--muted-foreground': '#5d5f58',
  '--card': '#ffffff',
  '--card-foreground': '#292B26',
  '--input': 'rgb(38 61 44 / 0.3)',
  '--border': 'rgb(38 61 44 / 0.2)',
  '--ring': '#263D2C',
  '--primary': '#D8A943',
  '--primary-foreground': '#263D2C',
  '--destructive': '#a8281f',
} as CSSProperties

const CAMPO = 'h-11 rounded-md bg-white dark:bg-white'
const LINK = 'text-[#263D2C] underline underline-offset-4 hover:text-[#607B55]'

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
    <div className="flex min-h-svh bg-[#F5F3EA] font-sans">
      {/* foto com um tom único, só para dar leitura ao texto */}
      <div className="relative hidden flex-[1.2] overflow-hidden bg-[#263D2C] lg:block">
        <img src={loginImg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[#1d2f22]/55" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="FruitVale">
            <img src="/favicon.svg" alt="" className="size-9" />
            <span className="font-heading text-2xl font-medium">FruitVale</span>
          </Link>
          <div>
            <p className="max-w-md font-heading text-4xl leading-[1.12] font-medium text-balance">
              Sua plantação, <span className="text-[#D8A943]">sob controle</span>, de onde você
              estiver.
            </p>
            <p className="mt-4 max-w-md text-lg text-white/85">
              Acompanhe cultivos, sensores e alertas da safra.
            </p>
          </div>
        </div>
      </div>

      <div
        style={PALETA}
        className="flex min-w-0 flex-1 flex-col bg-[#F5F3EA] p-6 text-foreground lg:min-w-[26rem]"
      >
        <div className="flex items-center justify-between">
          <Link to={ROUTES.home} className="flex items-center gap-2 lg:invisible" aria-label="FruitVale">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-heading text-lg font-medium text-[#263D2C]">FruitVale</span>
          </Link>
          <Link
            to={ROUTES.home}
            className="inline-flex items-center gap-1.5 text-sm text-[#292B26]/75 hover:text-[#263D2C]"
          >
            <ArrowLeftIcon className="size-4" aria-hidden /> Voltar ao site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            {view === 'login' ? (
              <form onSubmit={entrar} noValidate className="flex flex-col gap-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#607B55] uppercase">
                    Área do cliente
                  </p>
                  <h1 className="font-heading text-3xl font-medium text-[#263D2C]">
                    Bem-vindo de volta
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Entre para ver como está a sua plantação.
                  </p>
                </div>

                <FormField label="E-mail" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="voce@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    className={CAMPO}
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
                    className={CAMPO}
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
                    className={LINK}
                    onClick={() => {
                      setErroLocal('')
                      setError('')
                      setView('recover')
                    }}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <Button type="submit" size="lg" className="h-11 rounded-md font-semibold" disabled={pending}>
                  {pending && <Loader2Icon className="animate-spin" />}
                  {pending ? 'Entrando...' : 'Entrar'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Ainda não tem conta? Fale com o administrador.
                </p>

                <p className="text-center text-xs text-muted-foreground">
                  Ao entrar, você concorda com os{' '}
                  <Link to={ROUTES.termos} className={LINK}>
                    Termos de Uso e a Política de Privacidade
                  </Link>
                  .
                </p>
              </form>
            ) : (
              <form onSubmit={recuperar} noValidate className="flex flex-col gap-5">
                <h1 className="font-heading text-3xl font-medium text-[#263D2C]">
                  Recuperar senha
                </h1>

                {recoverEnviado ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Se <strong className="text-[#263D2C]">{recoverEmail}</strong> estiver
                      cadastrado, você vai receber um link de recuperação em instantes.
                    </p>
                    <Button type="button" size="lg" className="h-11 rounded-md font-semibold" onClick={voltarParaLogin}>
                      Voltar para o login
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
                    </p>

                    <FormField label="E-mail" htmlFor="recover-email">
                      <Input
                        id="recover-email"
                        type="email"
                        name="recover-email"
                        placeholder="voce@empresa.com.br"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        autoComplete="username"
                        className={CAMPO}
                      />
                    </FormField>

                    <ErrorMessage message={erroLocal} />

                    <Button type="submit" size="lg" className="h-11 rounded-md font-semibold">
                      Enviar link de recuperação
                    </Button>

                    <button
                      type="button"
                      className={`${LINK} text-center text-sm`}
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
    </div>
  )
}
