import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle2Icon,
  FileSignatureIcon,
  Loader2Icon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { getErrorMessage } from '@/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ROUTES } from '@/config/routes'
import { contratoService } from '@/services'
import type { ContratoPublico } from '@/types/empresa'

const data = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    : ''

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#263D2C]'
const BASE_BOTAO = `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:opacity-60 ${FOCO}`
const BOTAO_PRINCIPAL = `${BASE_BOTAO} bg-[#D8A943] text-[#263D2C] hover:bg-[#e3b957]`
const BOTAO_SECUNDARIO = `${BASE_BOTAO} border border-[#263D2C]/30 text-[#263D2C] hover:border-[#263D2C] hover:bg-[#263D2C]/5`
const ROTULO = 'text-xs font-semibold tracking-[0.14em] text-[#607B55] uppercase'

export default function ContratoPage() {
  const { token = '' } = useParams()
  const [contrato, setContrato] = useState<ContratoPublico | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroAceite, setErroAceite] = useState('')

  useEffect(() => {
    const controle = new AbortController()
    contratoService
      .consultar(token, controle.signal)
      .then(setContrato)
      .catch((e: unknown) => {
        if (controle.signal.aborted) return
        setErro(getErrorMessage(e, 'Não foi possível abrir o contrato.'))
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false)
      })
    return () => controle.abort()
  }, [token])

  /** O aceite fica registrado em nome do responsável cadastrado (ou da empresa). */
  async function aceitar() {
    if (!contrato) return
    const assinante =
      contrato.contratante.responsavel?.trim() || contrato.contratante.razao_social
    setErroAceite('')
    setEnviando(true)
    try {
      const r = await contratoService.aceitar(token, assinante)
      setContrato((c) =>
        c ? { ...c, status: 'ACEITO', aceito_em: r.aceito_em, aceito_por: assinante } : c,
      )
      setConfirmando(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setErroAceite(getErrorMessage(e, 'Não foi possível registrar o aceite.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#F5F3EA] font-sans text-[#292B26] selection:bg-[#D8A943] selection:text-[#263D2C]">
      <header className="border-b border-[#263D2C]/10 bg-[#F5F3EA]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
          <span className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-heading text-xl font-medium text-[#263D2C]">FruitVale</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#292B26]/70">
            <ShieldCheckIcon className="size-4 text-[#607B55]" aria-hidden />
            Conexão segura
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-5 py-10 sm:px-8">
        {carregando && (
          <div className="flex items-center justify-center gap-2 py-24 text-[#292B26]/70">
            <Loader2Icon className="size-5 animate-spin" aria-hidden />
            Abrindo o contrato…
          </div>
        )}

        {!carregando && erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-md border border-[#263D2C]/15 bg-white p-8 text-center"
          >
            <TriangleAlertIcon className="size-10 text-[#8a6410]" aria-hidden />
            <h1 className="font-heading text-2xl font-medium text-[#263D2C]">
              Não foi possível abrir
            </h1>
            <p className="max-w-md text-[#292B26]/75">{erro}</p>
            <Link to={ROUTES.home} className="mt-2 text-sm text-[#263D2C] underline underline-offset-4">
              Ir para o início
            </Link>
          </div>
        )}

        {contrato && contrato.status === 'ACEITO' && (
          <div className="rounded-md border border-[#263D2C]/15 bg-white p-8 text-center sm:p-10">
            <CheckCircle2Icon className="mx-auto size-14 text-[#607B55]" aria-hidden />
            <h1 className="mt-4 font-heading text-3xl font-medium text-[#263D2C]">
              Contrato aceito
            </h1>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-[#292B26]/80">
              O contrato de <strong>{contrato.contratante.razao_social}</strong> foi aceito
              {contrato.aceito_por ? ` por ${contrato.aceito_por}` : ''}
              {contrato.aceito_em ? ` em ${data(contrato.aceito_em)}` : ''}. O acesso à
              plataforma está liberado.
            </p>
            <Link to={ROUTES.login} className={`${BOTAO_PRINCIPAL} mt-6 h-12 px-8`}>
              Entrar na plataforma
            </Link>
          </div>
        )}

        {contrato && contrato.status !== 'ACEITO' && (
          <>
            <div>
              <p className={`${ROTULO} inline-flex items-center gap-2`}>
                <FileSignatureIcon className="size-4" aria-hidden />
                Contrato de serviço · versão {contrato.versao}
              </p>
              <h1 className="mt-3 font-heading text-3xl font-medium text-[#263D2C] text-balance sm:text-4xl">
                Leia e aceite para liberar o acesso
              </h1>
              <p className="mt-3 leading-relaxed text-[#292B26]/75">
                Confira os dados da sua empresa e as condições do serviço. Depois do aceite, os
                usuários da empresa já podem entrar na plataforma.
              </p>
            </div>

            <section aria-labelledby="titulo-partes" className="rounded-md border border-[#263D2C]/15 bg-white p-6">
              <h2 id="titulo-partes" className="font-heading text-xl font-medium text-[#263D2C]">
                Partes
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className={ROTULO}>Contratada</dt>
                  <dd className="mt-1 font-medium">
                    {contrato.contratada.nome}
                    {contrato.contratada.cnpj ? ` · CNPJ ${contrato.contratada.cnpj}` : ''}
                  </dd>
                </div>
                <div className="border-t border-[#263D2C]/15 pt-4 sm:col-span-2">
                  <dt className={ROTULO}>Contratante (dados cadastrados)</dt>
                </div>
                {(
                  [
                    ['Empresa', contrato.contratante.razao_social],
                    ['CPF/CNPJ', contrato.contratante.cpf_cnpj],
                    ['Responsável', contrato.contratante.responsavel],
                    ['E-mail', contrato.contratante.email],
                    ['Telefone', contrato.contratante.telefone],
                    [
                      'Cidade / UF',
                      [contrato.contratante.cidade, contrato.contratante.estado]
                        .filter(Boolean)
                        .join(' / '),
                    ],
                  ] as [string, string | null][]
                ).map(([rotulo, valor]) => (
                  <div key={rotulo} className="min-w-0">
                    <dt className="text-xs text-[#292B26]/65">{rotulo}</dt>
                    <dd className="truncate font-medium">{valor || '—'}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-[#292B26]/65">
                Algum dado está errado? Avise antes de aceitar, para o cadastro ser corrigido.
              </p>
            </section>

            <section aria-label="Cláusulas do contrato" className="border-t border-[#263D2C]/20">
              {contrato.clausulas.map((c) => (
                <article key={c.titulo} className="border-b border-[#263D2C]/15 py-6">
                  <h3 className="font-heading text-lg font-medium text-[#263D2C]">{c.titulo}</h3>
                  <div className="mt-2 space-y-2 leading-relaxed text-[#292B26]/80">
                    {c.paragrafos?.map((p) => <p key={p}>{p}</p>)}
                    {c.itens && (
                      <ul className="space-y-1.5">
                        {c.itens.map((i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#D8A943]" aria-hidden />
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
              <p className="pt-5 text-sm text-[#292B26]/70">
                Veja também os{' '}
                <Link
                  to={ROUTES.termos}
                  target="_blank"
                  className="text-[#263D2C] underline underline-offset-4"
                >
                  Termos de Uso e a Política de Privacidade
                </Link>
                .
              </p>
            </section>

            <section className="rounded-md bg-[#263D2C] p-6 text-white sm:p-8">
              <h2 className="font-heading text-2xl font-medium">Aceite do contrato</h2>
              <p className="mt-2 leading-relaxed text-white/80">
                Depois de ler as condições acima e conferir os dados da empresa, clique no botão
                para aceitar. Você ainda poderá revisar antes de confirmar.
              </p>
              <button
                type="button"
                onClick={() => {
                  setErroAceite('')
                  setConfirmando(true)
                }}
                className={`${BOTAO_PRINCIPAL} mt-6 h-14 w-full text-base focus-visible:outline-[#D8A943]`}
              >
                <CheckCircle2Icon className="size-5" aria-hidden />
                Aceitar contrato
              </button>
              <p className="mt-4 text-xs leading-relaxed text-white/65">
                Ao aceitar, registramos a data e a hora, o nome do responsável, o endereço IP e a
                versão do contrato, como prova do aceite eletrônico.
                {contrato.expira_em ? ` Este link vale até ${data(contrato.expira_em)}.` : ''}
              </p>
            </section>

            <Dialog open={confirmando} onOpenChange={(aberto) => !enviando && setConfirmando(aberto)}>
              <DialogContent className="rounded-md border border-[#263D2C]/20 bg-[#F5F3EA] text-[#292B26] ring-0 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl font-medium text-[#263D2C]">
                    Confirmar aceite do contrato?
                  </DialogTitle>
                  <DialogDescription className="leading-relaxed text-[#292B26]/80">
                    Ao confirmar, você declara que leu o contrato, que os dados da empresa estão
                    corretos e que concorda com as condições, em nome de{' '}
                    <strong className="text-[#263D2C]">{contrato.contratante.razao_social}</strong>.
                    O acesso dos usuários da empresa será liberado.
                  </DialogDescription>
                </DialogHeader>

                {erroAceite && (
                  <p role="alert" className="border-l-4 border-[#a8281f] bg-white px-4 py-3 text-sm text-[#a8281f]">
                    {erroAceite}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => setConfirmando(false)}
                    className={`${BOTAO_SECUNDARIO} h-11 px-5 text-sm`}
                  >
                    Voltar e revisar
                  </button>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => void aceitar()}
                    className={`${BOTAO_PRINCIPAL} h-11 px-5 text-sm`}
                  >
                    {enviando ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2Icon className="size-4" aria-hidden />
                    )}
                    {enviando ? 'Registrando…' : 'Confirmar aceite'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  )
}
