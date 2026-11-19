import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { useAnimacoes } from '@/pages/landing/use-animacoes'
import { ATUALIZADO_EM, PRIVACIDADE, RESUMO, TERMOS, type Secao } from './conteudo'

const TODAS = [...TERMOS, ...PRIVACIDADE]

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#263D2C]'

function irPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

export default function TermosPage() {
  const raiz = useRef<HTMLDivElement>(null)
  const [ativa, setAtiva] = useState(TODAS[0].id)
  useAnimacoes(raiz)

  // destaca no índice a seção que está na tela
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((e) => e.isIntersecting)
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    TODAS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observador.observe(el)
    })
    return () => observador.disconnect()
  }, [])

  // abre direto na seção quando o link traz #ancora
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50)
  }, [])

  return (
    <div
      ref={raiz}
      className="min-h-svh overflow-x-clip bg-[#F5F3EA] font-sans text-[#292B26] selection:bg-[#D8A943] selection:text-[#263D2C]"
    >
      <header className="sticky top-0 z-50 border-b border-[#263D2C]/10 bg-[#F5F3EA]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="FruitVale">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-heading text-xl font-medium text-[#263D2C]">FruitVale</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              to={ROUTES.home}
              className={`inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-[#292B26]/80 hover:text-[#263D2C] ${FOCO}`}
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              <span className="hidden sm:inline">Voltar ao início</span>
            </Link>
            <Link
              to={ROUTES.login}
              className={`inline-flex h-10 items-center rounded-md bg-[#D8A943] px-4 font-semibold text-[#263D2C] transition-colors hover:bg-[#e3b957] ${FOCO}`}
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#263D2C] text-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
          <p
            data-hero
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#D8A943] uppercase"
          >
            <ShieldCheckIcon className="size-4" aria-hidden />
            Em conformidade com a LGPD
          </p>
          <h1
            data-hero
            className="mt-4 max-w-3xl font-heading text-4xl leading-[1.1] font-medium text-balance sm:text-5xl"
          >
            Termos de Uso e Política de Privacidade
          </h1>
          <p data-hero className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Explicamos de forma clara como a plataforma funciona, quais dados coletamos, por quê, e
            quais são os seus direitos.
          </p>
          <p data-hero className="mt-4 text-sm text-white/60">
            Última atualização: {ATUALIZADO_EM}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
        {/* resumo em quatro pontos, separados por filetes */}
        <dl
          data-reveal
          className="grid border-t border-[#263D2C]/20 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#263D2C]/15"
        >
          {RESUMO.map((r, i) => (
            <div key={r.titulo} data-item className="border-b border-[#263D2C]/15 py-6 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <span className="font-heading text-2xl text-[#D8A943]" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <dt className="mt-2 font-heading text-lg font-medium text-[#263D2C]">{r.titulo}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-[#292B26]/75">{r.texto}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
          <nav aria-label="Índice" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#607B55] uppercase">
              Neste documento
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-[#263D2C]/20 lg:pb-0">
              {TODAS.map((s) => (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => irPara(s.id)}
                    aria-current={ativa === s.id ? 'true' : undefined}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-sm whitespace-nowrap transition-colors lg:-ml-px lg:rounded-none lg:border-l-2 lg:py-2 lg:whitespace-normal ${FOCO} ${
                      ativa === s.id
                        ? 'bg-[#263D2C] font-semibold text-white lg:border-[#D8A943] lg:bg-transparent lg:text-[#263D2C]'
                        : 'text-[#292B26]/70 hover:text-[#263D2C] lg:border-transparent'
                    }`}
                  >
                    {s.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0 space-y-16">
            <Bloco rotulo="Parte 1" titulo="Termos de Uso" secoes={TERMOS} />
            <Bloco
              rotulo="Parte 2"
              titulo="Política de Privacidade e Coleta de Dados"
              secoes={PRIVACIDADE}
            />
            <p className="border-l-4 border-[#D8A943] bg-white px-5 py-4 text-sm leading-relaxed text-[#292B26]/80">
              Dúvidas sobre este documento ou sobre seus dados? Fale com a gente pelo canal de
              contato da sua conta e responderemos o quanto antes.
            </p>
          </main>
        </div>
      </div>

      <footer className="bg-[#1d2f22] py-6 text-center text-xs text-white/70">
        © {new Date().getFullYear()} FruitVale. Todos os direitos reservados.
      </footer>
    </div>
  )
}

function Bloco({ rotulo, titulo, secoes }: { rotulo: string; titulo: string; secoes: Secao[] }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-[#607B55] uppercase">{rotulo}</p>
      <h2 className="mt-2 font-heading text-3xl font-medium text-[#263D2C] text-balance">{titulo}</h2>
      <div className="mt-6 border-t border-[#263D2C]/20">
        {secoes.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 border-b border-[#263D2C]/15 py-7"
          >
            <h3 className="font-heading text-xl font-medium text-[#263D2C]">{s.titulo}</h3>
            <div className="mt-3 max-w-3xl space-y-3 leading-relaxed text-[#292B26]/80">
              {s.paragrafos?.map((p) => <p key={p}>{p}</p>)}
              {s.itens && (
                <ul className="space-y-2">
                  {s.itens.map((i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#D8A943]" aria-hidden />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.nota && <p>{s.nota}</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
