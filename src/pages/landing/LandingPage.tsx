import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { animate, stagger, svg } from 'animejs'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  MenuIcon,
  MessageCircleIcon,
  XIcon,
} from 'lucide-react'
import heroImg from '@/assets/landing-hero.webp'
import campoImg from '@/assets/landing-campo.webp'
import { env } from '@/config/env'
import { ROUTES } from '@/config/routes'
import { mapaPublicoService } from '@/services'
import type { PropriedadePublica } from '@/types/mapa-publico'
import { BENEFICIOS, DIFERENCIAIS, PASSOS, PERGUNTAS } from './conteudo'
import { useAnimacoes } from './use-animacoes'

// o mapa (Leaflet) só baixa quando a seção é montada
const MapaNasa = lazy(() => import('@/components/map/MapaNasa'))

const MENSAGEM =
  'Olá! Vi o FruitVale e quero saber como funciona e quanto custa para a minha plantação.'
const WHATSAPP = `https://wa.me/${env.whatsappNumero}?text=${encodeURIComponent(MENSAGEM)}`

/* Paleta: off-white #F5F3EA, verde #263D2C, oliva #607B55, dourado #D8A943, grafite #292B26 */
const BASE_BOTAO =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#263D2C]'
const BOTAO_PRINCIPAL = `${BASE_BOTAO} bg-[#D8A943] text-[#263D2C] hover:bg-[#e3b957]`
const BOTAO_SECUNDARIO = `${BASE_BOTAO} border border-[#263D2C]/30 text-[#263D2C] hover:border-[#263D2C] hover:bg-[#263D2C]/5`
/** Variações para fundos verdes. */
const BOTAO_SECUNDARIO_ESCURO = `${BASE_BOTAO} border border-white/30 text-white hover:border-white hover:bg-white/10 focus-visible:outline-[#D8A943]`

const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
const ROTULO = 'text-xs font-semibold tracking-[0.14em] text-[#607B55] uppercase'
const TITULO = 'font-heading text-3xl font-medium text-[#263D2C] text-balance sm:text-4xl'

function irPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingPage() {
  const raiz = useRef<HTMLDivElement>(null)
  useAnimacoes(raiz)

  return (
    <div
      ref={raiz}
      className="min-h-svh overflow-x-clip bg-[#F5F3EA] pb-20 font-sans text-[#292B26] selection:bg-[#D8A943] selection:text-[#263D2C] md:pb-0"
    >
      <Cabecalho />
      <main id="topo">
        <Hero />
        <Empresas />
        <Beneficios />
        <Passos />
        <Demonstracao />
        <MapaSecao />
        <Confianca />
        <Perguntas />
        <ChamadaFinal />
      </main>
      <Rodape />
      <BarraWhatsApp />
    </div>
  )
}

const LINKS = [
  { id: 'beneficios', rotulo: 'O que você ganha' },
  { id: 'como-funciona', rotulo: 'Como funciona' },
  { id: 'duvidas', rotulo: 'Dúvidas frequentes' },
]

function Logo({ escuro = false }: { escuro?: boolean }) {
  return (
    <a href="#topo" className="flex items-center gap-2.5" aria-label="FruitVale">
      <img src="/favicon.svg" alt="" className="size-8" />
      <span
        className={`font-heading text-xl font-medium ${escuro ? 'text-white' : 'text-[#263D2C]'}`}
      >
        FruitVale
      </span>
    </a>
  )
}

function Cabecalho() {
  const [aberto, setAberto] = useState(false)

  // Esc fecha o menu do celular
  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  function navegar(id: string) {
    setAberto(false)
    irPara(id)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#263D2C]/10 bg-[#F5F3EA]/95 backdrop-blur">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              className="text-[#292B26]/80 transition-colors hover:text-[#263D2C]"
              onClick={() => irPara(l.id)}
            >
              {l.rotulo}
            </button>
          ))}
          <Link
            to={ROUTES.mapaPublico}
            className="text-[#292B26]/80 transition-colors hover:text-[#263D2C]"
          >
            Mapa
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to={ROUTES.login} className={`${BOTAO_SECUNDARIO} hidden h-10 px-4 text-sm sm:inline-flex`}>
            Entrar na plataforma
          </Link>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BOTAO_PRINCIPAL} hidden h-10 px-4 text-sm md:inline-flex`}
          >
            Contratar serviço
          </a>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border border-[#263D2C]/30 text-[#263D2C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#263D2C] md:hidden"
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto(!aberto)}
          >
            {aberto ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Menu"
          className="border-t border-[#263D2C]/10 bg-[#F5F3EA] md:hidden"
        >
          <ul className={`${CONTAINER} flex flex-col py-2`}>
            {LINKS.map((l) => (
              <li key={l.id} className="border-b border-[#263D2C]/10">
                <button
                  type="button"
                  className="w-full py-3.5 text-left text-base text-[#263D2C]"
                  onClick={() => navegar(l.id)}
                >
                  {l.rotulo}
                </button>
              </li>
            ))}
            <li className="border-b border-[#263D2C]/10">
              <Link
                to={ROUTES.mapaPublico}
                className="block py-3.5 text-base text-[#263D2C]"
                onClick={() => setAberto(false)}
              >
                Mapa
              </Link>
            </li>
            <li className="py-3">
              <Link to={ROUTES.login} className={`${BOTAO_SECUNDARIO} h-11 w-full text-base`}>
                Entrar na plataforma
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}

const PROMESSAS = [
  'Veja a umidade do solo sem sair de casa',
  'Seja avisado antes de perder a fruta',
  'Saiba o dia certo de colher',
]

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#263D2C]">
      <img
        src={campoImg}
        width={1600}
        height={732}
        alt=""
        className="absolute inset-0 -z-20 size-full object-cover"
        fetchPriority="high"
      />
      {/* tom único sobre a foto, só para dar leitura ao texto */}
      <div className="absolute inset-0 -z-10 bg-[#1d2f22]/70" />

      <div className={`${CONTAINER} grid items-center gap-8 pt-8 pb-8 sm:pt-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:pt-10 lg:pb-8`}>
        <div className="text-white">
          <h1
            data-hero
            className="font-heading text-4xl leading-[1.08] font-medium text-balance sm:text-5xl"
          >
            Cuide da sua plantação com informações,{' '}
            <span className="text-[#D8A943]">não com suposições.</span>
          </h1>
          <p data-hero className="mt-4 max-w-xl text-lg leading-relaxed text-white/85">
            Acompanhe as condições da sua plantação pelo celular, receba alertas e saiba o momento
            certo de agir, sem precisar estar no campo.
          </p>

          <ul data-hero className="mt-5 space-y-2 text-base font-medium">
            {PROMESSAS.map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#D8A943] text-[#263D2C]">
                  <CheckIcon className="size-4" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div data-hero className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BOTAO_PRINCIPAL} h-12 px-6 text-base focus-visible:outline-[#D8A943]`}
            >
              <MessageCircleIcon className="size-5" aria-hidden />
              Quero conhecer o FruitVale
            </a>
            <Link to={ROUTES.login} className={`${BOTAO_SECUNDARIO_ESCURO} h-12 px-6 text-base`}>
              Já sou cliente
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <CardRotativo />
      </div>
    </section>
  )
}

/* ---------- card rotativo do hero ---------- */

const INTERVALO_MS = 14000

function SlideLeituras() {
  return (
    <>
      <p className="font-heading text-lg text-[#263D2C]">Manga · Área 3</p>
      <dl className="mt-4 grid grid-cols-3 divide-x divide-[#263D2C]/15">
        <Leitura rotulo="Temperatura" valor="28 °C" />
        <Leitura rotulo="Umidade do ar" valor="64 %" />
        <Leitura rotulo="Umidade do solo" valor="22 %" atencao />
      </dl>
      <p data-entra className="mt-4 border-t border-[#263D2C]/15 pt-3 text-sm font-medium text-[#8a6410]">
        Atenção: a umidade do solo está abaixo do ideal na Área 3.
      </p>
    </>
  )
}

const ALERTAS = [
  { titulo: 'Umidade do solo abaixo do ideal', detalhe: 'Manga · Área 3 · agora' },
  { titulo: 'Temperatura acima do ideal', detalhe: 'Uva · Área 1 · 14:20' },
  { titulo: 'Umidade do solo em queda', detalhe: 'Manga · Área 3 · ontem' },
]

function SlideAlertas() {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg text-[#263D2C]">Alertas no seu celular</p>
        <span className="flex items-center gap-1.5 rounded-full bg-[#D8A943] px-2.5 py-0.5 text-xs font-semibold text-[#263D2C]">
          <BellIcon className="size-3.5" aria-hidden />
          {ALERTAS.length} novos
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {ALERTAS.map((a) => (
          <li key={a.titulo} data-entra className="border-l-4 border-[#D8A943] bg-white px-3 py-2">
            <p className="text-sm font-semibold text-[#263D2C]">{a.titulo}</p>
            <p className="text-xs text-[#292B26]/65">{a.detalhe}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function SlideColheita() {
  return (
    <>
      <p className="font-heading text-lg text-[#263D2C]">Previsão de colheita</p>
      <p className="mt-3 font-heading text-5xl text-[#263D2C]">
        18 <span className="text-2xl text-[#292B26]/60">dias</span>
      </p>
      <p className="mt-1 text-sm text-[#292B26]/70">Manga · Área 3</p>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#263D2C]/12">
        <div data-prog="68" className="h-full w-[68%] rounded-full bg-[#607B55]" />
      </div>
      <p data-entra className="mt-2 text-sm text-[#292B26]/75">
        A fruta está 68% do caminho até o ponto de colher.
      </p>
    </>
  )
}

function SlideHistorico() {
  return (
    <>
      <p className="font-heading text-lg text-[#263D2C]">Umidade do solo · 7 dias</p>
      <svg
        viewBox="0 0 300 140"
        className="mt-3 w-full"
        role="img"
        aria-label="Gráfico de exemplo: a umidade do solo cai de 41% para 22% em sete dias."
      >
        {[0, 40, 80, 120].map((y) => (
          <line key={y} x1="0" x2="300" y1={y + 10} y2={y + 10} stroke="#263D2C" strokeOpacity="0.12" />
        ))}
        <g transform="translate(0 10)" fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d={linha(SERIE_SOLO, 15, 45)} stroke="#D8A943" data-tracado />
        </g>
      </svg>
      <p data-entra className="mt-1 text-sm text-[#292B26]/75">
        Caiu de 41% para 22%: hora de olhar a irrigação.
      </p>
    </>
  )
}

const SLIDES = [
  { id: 'leituras', rotulo: 'Leituras', Conteudo: SlideLeituras },
  { id: 'alertas', rotulo: 'Alertas', Conteudo: SlideAlertas },
  { id: 'colheita', rotulo: 'Colheita', Conteudo: SlideColheita },
  { id: 'historico', rotulo: 'Histórico', Conteudo: SlideHistorico },
]

/** Alterna exemplos do que o produtor vê no celular; a troca de tela usa anime.js. */
function CardRotativo() {
  const raiz = useRef<HTMLDivElement>(null)
  const anterior = useRef(0)
  const iniciou = useRef(false)
  const [indice, setIndice] = useState(0)
  const [pausado, setPausado] = useState(false)
  const reduzido = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // passa sozinho; o clique nos pontos reinicia a contagem
  useEffect(() => {
    if (reduzido || pausado) return
    const t = window.setTimeout(() => setIndice((i) => (i + 1) % SLIDES.length), INTERVALO_MS)
    return () => window.clearTimeout(t)
  }, [indice, pausado, reduzido])

  useLayoutEffect(() => {
    const el = raiz.current
    if (!el) return
    const telas = Array.from(el.querySelectorAll<HTMLElement>('[data-slide]'))
    const entra = telas[indice]
    const sai = telas[anterior.current]
    const primeira = !iniciou.current
    iniciou.current = true
    anterior.current = indice
    if (primeira || !entra) return

    if (reduzido) {
      telas.forEach((t) => (t.style.opacity = t === entra ? '1' : '0'))
      return
    }

    const internos = Array.from(entra.querySelectorAll<HTMLElement>('[data-entra]'))
    const barra = entra.querySelector<HTMLElement>('[data-prog]')
    const traco = entra.querySelectorAll('[data-tracado]')

    for (const i of internos) i.style.opacity = '0'
    if (sai && sai !== entra) animate(sai, { opacity: [1, 0], duration: 250, ease: 'outQuad' })
    animate(entra, { opacity: [0, 1], y: [14, 0], delay: 200, duration: 500, ease: 'outExpo' })
    if (internos.length)
      animate(internos, {
        opacity: [0, 1],
        x: [-14, 0],
        delay: stagger(160, { start: 450 }),
        duration: 500,
        ease: 'outExpo',
      })
    if (barra)
      animate(barra, { width: ['0%', `${barra.dataset.prog}%`], delay: 450, duration: 1100, ease: 'outExpo' })
    if (traco.length)
      animate(svg.createDrawable(traco), { draw: ['0 0', '0 1'], delay: 450, duration: 1200, ease: 'inOutQuad' })
  }, [indice, reduzido])

  return (
    <figure
      data-hero
      className="mx-auto w-full max-w-md lg:max-w-none"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div ref={raiz} className="rounded-md bg-[#F5F3EA] p-5 shadow-[0_2px_0_0_#D8A943]">
        {/* todas as telas ocupam o mesmo lugar: o card não muda de altura */}
        <div className="grid">
          {SLIDES.map(({ id, Conteudo }, i) => (
            <div
              key={id}
              data-slide
              aria-hidden={i !== indice}
              style={{ opacity: i === 0 ? 1 : 0, gridArea: '1 / 1' }}
              className={i === indice ? '' : 'pointer-events-none'}
            >
              <Conteudo />
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-3 text-xs text-white/75">
        <span>Exemplo ilustrativo do que chega ao seu celular.</span>
        <div className="flex gap-1.5">
          {SLIDES.map(({ id, rotulo }, i) => (
            <button
              key={id}
              type="button"
              aria-label={`Mostrar exemplo: ${rotulo}`}
              aria-current={i === indice}
              onClick={() => setIndice(i)}
              className={`h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8A943] ${
                i === indice ? 'w-6 bg-[#D8A943]' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  )
}

function Leitura({ rotulo, valor, atencao = false }: { rotulo: string; valor: string; atencao?: boolean }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <dt className="text-[11px] leading-tight text-[#292B26]/60">{rotulo}</dt>
      <dd className="mt-1 font-heading text-xl text-[#263D2C]">{valor}</dd>
      {atencao && <p className="mt-0.5 text-[11px] font-semibold text-[#8a6410]">Abaixo do ideal</p>}
    </div>
  )
}

/** Faixa contínua com o nome das empresas cadastradas; some se não houver nenhuma. */
function Empresas() {
  const [nomes, setNomes] = useState<string[]>([])

  useEffect(() => {
    const controle = new AbortController()
    mapaPublicoService
      .listarEmpresas(controle.signal)
      .then((lista) => setNomes([...new Set(lista)]))
      // sem a lista a faixa simplesmente não aparece
      .catch(() => undefined)
    return () => controle.abort()
  }, [])

  // cada metade precisa ser mais larga que a tela para o laço não mostrar vazio
  const metade = useMemo(
    () => (nomes.length ? Array.from({ length: Math.ceil(8 / nomes.length) }, () => nomes).flat() : []),
    [nomes],
  )
  if (!nomes.length) return null

  return (
    <section
      aria-label="Empresas que usam o FruitVale"
      className="border-y border-[#263D2C]/10 bg-white/50 py-5"
    >
      <p className={`${ROTULO} mb-3 text-center`}>Quem já usa o FruitVale</p>
      <div className="marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="marquee__trilho flex w-max">
          {[0, 1].map((copia) => (
            <li key={copia} aria-hidden={copia === 1} className="flex shrink-0">
              <ul className="flex shrink-0">
                {metade.map((nome, i) => (
                  <li
                    key={i}
                    className="flex shrink-0 items-center gap-8 pr-8 font-heading text-lg whitespace-nowrap text-[#263D2C]"
                  >
                    {nome}
                    <span className="size-1.5 rounded-full bg-[#D8A943]" aria-hidden />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Beneficios() {
  return (
    <section id="beneficios" className="scroll-mt-16 py-16 sm:py-24">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20`}>
        <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className={ROTULO}>O que você ganha</p>
          <h2 className={`${TITULO} mt-3`}>Saber o que acontece na terra, mesmo à distância</h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#292B26]/75">
            O FruitVale reúne em um só painel o que antes dependia de ir até o campo conferir.
          </p>
        </div>

        <ol data-reveal className="border-t border-[#263D2C]/20">
          {BENEFICIOS.map((b, i) => (
            <li
              key={b.titulo}
              data-item
              className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-[#263D2C]/20 py-7"
            >
              <span className="font-heading text-2xl text-[#D8A943]" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-heading text-xl font-medium text-[#263D2C]">{b.titulo}</h3>
                <p className="mt-2 leading-relaxed text-[#292B26]/75">{b.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Ilustrações de traço, uma por etapa. */
const ILUSTRACOES = [
  // sensor fincado na terra
  <svg key="a" viewBox="0 0 120 80" className="h-20 w-full" fill="none" stroke="#263D2C" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M6 62h108" />
    <path d="M14 70h24M52 72h30M92 69h20" stroke="#607B55" />
    <path d="M60 62V26" />
    <rect x="50" y="12" width="20" height="14" rx="2" />
    <circle cx="60" cy="19" r="2.5" fill="#D8A943" stroke="none" />
    <path d="M60 62l-6 8M60 62l6 8" />
  </svg>,
  // sinal saindo do sensor
  <svg key="b" viewBox="0 0 120 80" className="h-20 w-full" fill="none" stroke="#263D2C" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="14" y="40" width="22" height="22" rx="2" />
    <circle cx="25" cy="51" r="3" fill="#D8A943" stroke="none" />
    <path d="M50 51c6-8 6-16 0-24M60 55c10-12 10-28 0-40" stroke="#607B55" />
    <path d="M70 59c14-16 14-40 0-56" stroke="#607B55" />
    <path d="M92 34v34M84 34h16" />
  </svg>,
  // celular com gráfico
  <svg key="c" viewBox="0 0 120 80" className="h-20 w-full" fill="none" stroke="#263D2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="42" y="6" width="36" height="68" rx="5" />
    <path d="M50 54l8-10 7 5 8-14" stroke="#607B55" />
    <path d="M50 24h20M50 32h12" />
    <circle cx="73" cy="35" r="2.5" fill="#D8A943" stroke="none" />
    <path d="M57 68h6" />
  </svg>,
]

function Passos() {
  return (
    <section id="como-funciona" className="scroll-mt-16 border-y border-[#263D2C]/10 bg-white/50 py-16 sm:py-24">
      <div className={CONTAINER}>
        <div data-reveal className="max-w-2xl">
          <p className={ROTULO}>Como funciona</p>
          <h2 className={`${TITULO} mt-3`}>Da instalação ao acompanhamento, em três etapas</h2>
        </div>

        <ol data-reveal className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} data-item>
              <div className="rounded-md border border-[#263D2C]/15 bg-[#F5F3EA] px-6 py-5">
                {ILUSTRACOES[i]}
              </div>
              <p className="mt-5 text-sm font-semibold text-[#607B55]">Etapa {i + 1}</p>
              <h3 className="mt-1 font-heading text-xl font-medium text-[#263D2C]">{p.titulo}</h3>
              <p className="mt-2 leading-relaxed text-[#292B26]/75">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Histórico ilustrativo de uma semana: temperatura e umidade do solo. */
const SERIE_TEMP = [27, 29, 31, 30, 28, 29, 28]
const SERIE_SOLO = [41, 38, 34, 31, 28, 25, 22]

function linha(serie: number[], min: number, max: number) {
  const L = 300
  const A = 120
  return serie
    .map((v, i) => {
      const x = (i / (serie.length - 1)) * L
      const y = A - ((v - min) / (max - min)) * A
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function Demonstracao() {
  return (
    <section className="bg-[#263D2C] py-16 text-white sm:py-24" aria-labelledby="titulo-demo">
      <div className={CONTAINER}>
        <div data-reveal className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#D8A943] uppercase">
            Na prática
          </p>
          <h2 id="titulo-demo" className="mt-3 font-heading text-3xl font-medium text-balance sm:text-4xl">
            O painel que você vai abrir no celular
          </h2>
          <p className="mt-4 leading-relaxed text-white/75">
            Tela de exemplo com valores ilustrativos, para mostrar como as informações aparecem.
          </p>
        </div>

        <div data-reveal className="mt-10 overflow-hidden rounded-md border border-white/15 bg-[#F5F3EA] text-[#292B26]">
          {/* barra da janela */}
          <div className="flex items-center justify-between border-b border-[#263D2C]/15 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="size-5" />
              <span className="text-sm font-semibold text-[#263D2C]">Leituras e alertas</span>
            </div>
            <span className="text-xs text-[#292B26]/60">Manga · Área 3 · Fazenda Exemplo</span>
          </div>

          <div className="grid gap-px bg-[#263D2C]/15 lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-[#F5F3EA] p-5">
              <dl className="grid grid-cols-3 gap-4">
                <Indicador rotulo="Temperatura" valor="28" unidade="°C" estado="Dentro do ideal" />
                <Indicador rotulo="Umidade do ar" valor="64" unidade="%" estado="Dentro do ideal" />
                <Indicador rotulo="Umidade do solo" valor="22" unidade="%" estado="Abaixo do ideal" atencao />
              </dl>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#263D2C]">Histórico dos últimos 7 dias</p>
                  <ul className="flex gap-4 text-xs text-[#292B26]/70">
                    <li className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 bg-[#263D2C]" aria-hidden /> Temperatura
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 bg-[#D8A943]" aria-hidden /> Umidade do solo
                    </li>
                  </ul>
                </div>
                <svg
                  viewBox="0 0 300 140"
                  className="mt-3 w-full"
                  role="img"
                  aria-label="Gráfico de exemplo: a temperatura fica estável perto de 28 graus e a umidade do solo cai de 41% para 22% em sete dias."
                >
                  {[0, 40, 80, 120].map((y) => (
                    <line key={y} x1="0" x2="300" y1={y + 10} y2={y + 10} stroke="#263D2C" strokeOpacity="0.12" />
                  ))}
                  <g transform="translate(0 10)" fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                    <path d={linha(SERIE_TEMP, 15, 35)} stroke="#263D2C" data-linha />
                    <path d={linha(SERIE_SOLO, 15, 45)} stroke="#D8A943" data-linha />
                  </g>
                </svg>
                <div className="mt-1 flex justify-between text-[11px] text-[#292B26]/55" aria-hidden>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-px bg-[#263D2C]/15">
              <div className="flex-1 bg-white p-5">
                <p className="text-sm font-semibold text-[#263D2C]">Alertas</p>
                <ul className="mt-3 divide-y divide-[#263D2C]/10 text-sm">
                  <li className="py-3">
                    <p className="font-medium text-[#8a6410]">Umidade do solo abaixo do ideal</p>
                    <p className="mt-0.5 text-[#292B26]/65">Área 3 · hoje, 06:40 · 22% (mínimo 30%)</p>
                  </li>
                  <li className="py-3">
                    <p className="font-medium text-[#8a6410]">Umidade do solo em queda</p>
                    <p className="mt-0.5 text-[#292B26]/65">Área 3 · ontem, 17:10 · 25%</p>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-[#263D2C]">Previsão de colheita</p>
                  <p className="font-heading text-lg text-[#263D2C]">em 18 dias</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#263D2C]/12">
                  <div data-barra="68" className="h-full w-[68%] rounded-full bg-[#607B55]" />
                </div>
                <p className="mt-2 text-xs text-[#292B26]/65">68% do caminho até o ponto de colher.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Indicador({
  rotulo,
  valor,
  unidade,
  estado,
  atencao = false,
}: {
  rotulo: string
  valor: string
  unidade: string
  estado: string
  atencao?: boolean
}) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: atencao ? '#D8A943' : '#607B55' }}>
      <dt className="text-xs text-[#292B26]/65">{rotulo}</dt>
      <dd className="mt-1 font-heading text-3xl text-[#263D2C]">
        {valor}
        <span className="ml-0.5 text-base text-[#292B26]/60">{unidade}</span>
      </dd>
      <p className={`mt-0.5 text-xs font-semibold ${atencao ? 'text-[#8a6410]' : 'text-[#607B55]'}`}>
        {estado}
      </p>
    </div>
  )
}

function MapaSecao() {
  const [propriedades, setPropriedades] = useState<PropriedadePublica[]>([])

  useEffect(() => {
    const controle = new AbortController()
    mapaPublicoService
      .listar(controle.signal)
      .then(setPropriedades)
      .catch(() => undefined)
    return () => controle.abort()
  }, [])

  const pontos = useMemo(
    () =>
      propriedades.map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        titulo: p.nome,
        subtitulo: `${p.empresa} · ${p.municipio}/${p.estado}`,
        poligono: p.geometria,
      })),
    [propriedades],
  )
  const empresas = new Set(propriedades.map((p) => p.empresa)).size
  const estados = new Set(propriedades.map((p) => p.estado)).size

  // sem propriedades cadastradas, a seção não aparece: nada de mapa vazio
  if (!propriedades.length) return null

  return (
    <section id="mapa" className="scroll-mt-16 py-16 sm:py-24">
      <div className={CONTAINER}>
        <div data-reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className={ROTULO}>Mapa</p>
            <h2 className={`${TITULO} mt-3`}>Plantações monitoradas pelo FruitVale</h2>
            <p className="mt-4 leading-relaxed text-[#292B26]/75">
              {propriedades.length} propriedade(s) de {empresas} empresa(s) em {estados} estado(s),
              marcadas no mapa com a área de cada uma.
            </p>
          </div>
          <Link to={ROUTES.mapaPublico} className={`${BOTAO_SECUNDARIO} h-11 shrink-0 px-5 text-sm`}>
            Abrir mapa completo
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>

        <div data-reveal className="mt-8">
          <Suspense fallback={<div className="h-[420px] rounded-md bg-[#263D2C]/10" />}>
            <MapaNasa
              centro={null}
              poligono={null}
              imagem={null}
              pontos={pontos}
              className="h-[420px] rounded-md border-[#263D2C]/20 sm:h-[480px]"
            />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

function Confianca() {
  return (
    <section className="border-y border-[#263D2C]/10 bg-white/50 py-16 sm:py-24">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20`}>
        <div data-reveal>
          <p className={ROTULO}>Por que o FruitVale</p>
          <h2 className={`${TITULO} mt-3`}>Feito para a rotina de quem cultiva fruta</h2>
        </div>

        <dl data-reveal className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {DIFERENCIAIS.map((d) => (
            <div key={d.titulo} data-item className="border-t-2 border-[#607B55] pt-4">
              <dt className="font-heading text-lg font-medium text-[#263D2C]">{d.titulo}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-[#292B26]/75">{d.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Perguntas() {
  return (
    <section id="duvidas" className="mx-auto w-full max-w-3xl scroll-mt-16 px-5 py-16 sm:px-8 sm:py-24">
      <div data-reveal>
        <p className={ROTULO}>Dúvidas frequentes</p>
        <h2 className={`${TITULO} mt-3`}>Perguntas que todo produtor faz</h2>
      </div>

      <div data-reveal className="mt-8 border-t border-[#263D2C]/20">
        {PERGUNTAS.map((p) => (
          <details key={p.pergunta} data-item className="group border-b border-[#263D2C]/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-[#263D2C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#263D2C] [&::-webkit-details-marker]:hidden">
              {p.pergunta}
              <ChevronDownIcon className="size-5 shrink-0 text-[#607B55] transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="max-w-2xl pb-5 leading-relaxed text-[#292B26]/75">{p.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function ChamadaFinal() {
  return (
    <section id="contratar" className="scroll-mt-16 bg-[#263D2C] text-white">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div data-reveal className="px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="font-heading text-3xl font-medium text-balance sm:text-4xl">
            Sua plantação merece decisões melhores.
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/75">
            Conheça o FruitVale e acompanhe sua produção com mais informação e tranquilidade.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BOTAO_PRINCIPAL} h-12 px-6 text-base focus-visible:outline-[#D8A943]`}
            >
              <MessageCircleIcon className="size-5" aria-hidden />
              Falar com um especialista
            </a>
            <Link to={ROUTES.login} className={`${BOTAO_SECUNDARIO_ESCURO} h-12 px-6 text-base`}>
              Já sou cliente
            </Link>
          </div>
        </div>
        <img
          src={heroImg}
          width={900}
          height={1125}
          alt="Pomar de uvas e mangas ao entardecer"
          loading="lazy"
          className="h-64 w-full object-cover lg:h-full"
        />
      </div>
    </section>
  )
}

function Rodape() {
  return (
    <footer className="bg-[#1d2f22] text-white/75">
      <div className={`${CONTAINER} grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]`}>
        <div>
          <Logo escuro />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Monitoramento da plantação por sensores, alertas e previsão de colheita para quem
            cultiva fruta.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <p className="text-xs font-semibold tracking-[0.14em] text-[#D8A943] uppercase">Navegação</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button type="button" className="hover:text-white" onClick={() => irPara(l.id)}>
                  {l.rotulo}
                </button>
              </li>
            ))}
            <li>
              <Link to={ROUTES.mapaPublico} className="hover:text-white">
                Mapa
              </Link>
            </li>
            <li>
              <Link to={ROUTES.login} className="hover:text-white">
                Entrar na plataforma
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[#D8A943] uppercase">Contato</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            </li>
            <li>
              <Link to={ROUTES.termos} className="hover:text-white">
                Termos de Uso e Privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} FruitVale. Todos os direitos reservados.
      </div>
    </footer>
  )
}

/** No celular, o botão de contratar fica sempre à mão. */
function BarraWhatsApp() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#263D2C]/15 bg-[#F5F3EA]/95 p-3 backdrop-blur md:hidden">
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BOTAO_PRINCIPAL} h-12 w-full text-base`}
      >
        <MessageCircleIcon className="size-5" aria-hidden />
        Contratar pelo WhatsApp
      </a>
    </div>
  )
}
