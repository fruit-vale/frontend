import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  Loader2Icon,
  MapPinIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { getErrorMessage } from '@/api'
import MapaNasa, { type PontoNoMapa } from '@/components/map/MapaNasa'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { ibgeService, mapaPublicoService } from '@/services'
import type { PropriedadePublica } from '@/types/mapa-publico'

const CAIXA = 'rounded-md border border-[#263D2C]/15 bg-white p-4 text-sm'

/** Ignora acentos e maiúsculas na busca. */
const normalizar = (t: string) =>
  t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/** Conta quantas vezes cada chave aparece, em ordem alfabética. */
function contar(lista: PropriedadePublica[], chave: (p: PropriedadePublica) => string) {
  const mapa = new Map<string, number>()
  lista.forEach((p) => mapa.set(chave(p), (mapa.get(chave(p)) ?? 0) + 1))
  return [...mapa].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
}

/** Página pública: onde ficam as propriedades das empresas cadastradas. */
export default function MapaPublicoPage() {
  const [propriedades, setPropriedades] = useState<PropriedadePublica[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [estado, setEstado] = useState<string | null>(null)
  const [empresa, setEmpresa] = useState<string | null>(null)

  // contorno do estado escolhido: o mapa dá zoom nele, como no cadastro de propriedades
  const [malhaEstado, setMalhaEstado] = useState<{ uf: string; malha: GeoJSON.GeoJsonObject } | null>(null)
  useEffect(() => {
    if (!estado) return
    let atual = true
    ibgeService
      .malhaEstado(estado)
      .then((malha) => atual && setMalhaEstado({ uf: estado, malha }))
      // sem o contorno o mapa só não dá zoom no estado
      .catch(() => undefined)
    return () => {
      atual = false
    }
  }, [estado])

  useEffect(() => {
    const controle = new AbortController()
    mapaPublicoService
      .listar(controle.signal)
      .then(setPropriedades)
      .catch((e: unknown) => {
        if (!controle.signal.aborted)
          setErro(getErrorMessage(e, 'Não foi possível carregar o mapa.'))
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false)
      })
    return () => controle.abort()
  }, [])

  // a busca vale para os estados e para as empresas; o estado, para as empresas
  const porBusca = useMemo(() => {
    const termo = normalizar(busca)
    return termo
      ? propriedades.filter((p) => normalizar(p.empresa).includes(termo))
      : propriedades
  }, [propriedades, busca])
  const porEstado = useMemo(
    () => (estado ? porBusca.filter((p) => p.estado === estado) : porBusca),
    [porBusca, estado],
  )
  const visiveis = useMemo(
    () => (empresa ? porEstado.filter((p) => p.empresa === empresa) : porEstado),
    [porEstado, empresa],
  )

  const estados = useMemo(() => contar(porBusca, (p) => p.estado), [porBusca])
  const empresas = useMemo(() => contar(porEstado, (p) => p.empresa), [porEstado])

  // com uma empresa escolhida, o zoom vai para as propriedades dela
  const contorno = estado && !empresa && malhaEstado?.uf === estado ? malhaEstado.malha : null

  const pontos = useMemo<PontoNoMapa[]>(
    () =>
      visiveis.map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        titulo: p.nome,
        subtitulo: `${p.empresa} · ${p.municipio}/${p.estado}`,
        poligono: p.geometria,
      })),
    [visiveis],
  )

  const filtrando = busca !== '' || estado !== null || empresa !== null
  function limpar() {
    setBusca('')
    setEstado(null)
    setEmpresa(null)
  }

  const empresasVisiveis = new Set(visiveis.map((p) => p.empresa)).size
  const estadosVisiveis = new Set(visiveis.map((p) => p.estado)).size

  return (
    <div className="flex min-h-svh flex-col bg-[#F5F3EA] font-sans text-[#292B26] lg:h-svh">
      <header className="shrink-0 bg-[#263D2C]">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
          <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="FruitVale">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-heading text-xl font-medium text-white">FruitVale</span>
          </Link>
          <Link
            to={ROUTES.home}
            className="inline-flex items-center gap-2 rounded-md border border-white/30 px-3 py-1.5 text-sm text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8A943]"
          >
            <ArrowLeftIcon className="size-4" aria-hidden /> Voltar ao site
          </Link>
        </div>
      </header>

      {erro ? (
        <div className="p-4">
          <div role="alert" className={`flex items-center gap-2 ${CAIXA}`}>
            <TriangleAlertIcon className="size-4 shrink-0 text-[#8a6410]" aria-hidden />
            {erro}
          </div>
        </div>
      ) : carregando ? (
        <div className="grid flex-1 place-items-center py-20">
          <Loader2Icon className="size-6 animate-spin text-[#263D2C]" aria-label="Carregando" />
        </div>
      ) : propriedades.length === 0 ? (
        <div className="p-4">
          <div className={`flex items-center gap-2 text-[#292B26]/70 ${CAIXA}`}>
            <MapPinIcon className="size-4 shrink-0" aria-hidden />
            Ainda não há propriedades no mapa.
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* mapa à esquerda */}
          <div className="min-h-[55svh] flex-1 p-3 lg:min-h-0 lg:p-4">
            <MapaNasa
              centro={null}
              poligono={null}
              imagem={null}
              pontos={pontos}
              contorno={contorno}
              className="h-full min-h-[320px] rounded-md border-[#263D2C]/30"
            />
          </div>

          {/* título, números, busca e filtros à direita */}
          <aside
            className="flex w-full shrink-0 flex-col gap-6 overflow-y-auto bg-[#263D2C] p-5 text-white lg:w-[26rem]"
            aria-label="Busca e filtros"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D8A943]">
                Mapa de propriedades
              </p>
              <h1 className="mt-2 font-heading text-2xl leading-tight font-medium text-balance sm:text-3xl">
                Onde o FruitVale já está plantado
              </h1>

              <dl className="mt-5 grid grid-cols-3 divide-x divide-white/15 border-y border-white/15 py-4">
                <Numero valor={visiveis.length} rotulo="propriedades" />
                <Numero valor={empresasVisiveis} rotulo="empresas" />
                <Numero valor={estadosVisiveis} rotulo="estados" />
              </dl>
            </div>

            <div>
              <label htmlFor="busca-empresa" className="sr-only">
                Buscar empresa
              </label>
              <div className="relative">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#292B26]/55"
                  aria-hidden
                />
                <input
                  id="busca-empresa"
                  type="search"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value)
                    setEmpresa(null)
                  }}
                  placeholder="Buscar empresa"
                  autoComplete="off"
                  className="h-12 w-full rounded-md border border-transparent bg-white pl-9 pr-3 text-[#292B26] placeholder:text-[#292B26]/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8A943]"
                />
              </div>
              {filtrando && (
                <button
                  type="button"
                  onClick={limpar}
                  className="mt-2 text-xs text-white/75 underline hover:text-white"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <section aria-labelledby="titulo-estados">
              <h2 id="titulo-estados" className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D8A943]">
                Estados
              </h2>
              {estados.length === 0 ? (
                <p className="text-sm text-white/70">Nenhum estado encontrado.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {estados.map(([uf]) => (
                    <li key={uf}>
                      <button
                        type="button"
                        aria-pressed={estado === uf}
                        onClick={() => {
                          setEstado(estado === uf ? null : uf)
                          setEmpresa(null)
                        }}
                        className={cn(
                          'inline-flex select-none items-center rounded-md border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8A943]',
                          estado === uf
                            ? 'border-[#D8A943] bg-[#D8A943] text-[#263D2C]'
                            : 'border-white/30 text-white hover:border-white hover:bg-white/10',
                        )}
                      >
                        {uf}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="titulo-empresas">
              <h2 id="titulo-empresas" className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D8A943]">
                Empresas
              </h2>
              {empresas.length === 0 ? (
                <p className="text-sm text-white/70">Nenhuma empresa encontrada.</p>
              ) : (
                <ul className="border-t border-white/15">
                  {empresas.map(([nome, total]) => (
                    <li key={nome} className="border-b border-white/15">
                      <button
                        type="button"
                        aria-pressed={empresa === nome}
                        onClick={() => setEmpresa(empresa === nome ? null : nome)}
                        className={cn(
                          'flex w-full select-none items-center gap-3 border-l-4 px-3 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#D8A943]',
                          empresa === nome
                            ? 'border-[#D8A943] bg-white/10'
                            : 'border-transparent hover:bg-white/5',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate font-heading text-lg">{nome}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-[#D8A943]">
                          {total}
                        </span>
                        {empresa === nome && <XIcon className="size-4 shrink-0" aria-hidden />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <dd className="font-heading text-4xl leading-none font-medium text-[#D8A943]">{valor}</dd>
      <dt className="mt-1.5 text-xs text-white/75">{rotulo}</dt>
    </div>
  )
}
