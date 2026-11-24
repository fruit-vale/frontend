import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { PontoPreco, PrevisaoPonto } from '@/types/previsao-preco'

type Props = {
  historico: PontoPreco[]
  previsoes: PrevisaoPonto[]
  /** ex.: "R$/kg" */
  unidade: string
  titulo: string
  mensal: boolean
}

// Uma série só (o preço da fruta): mesma cor no histórico e na previsão, que se
// distingue pelo traço tracejado e pela faixa de incerteza. Por isso não há
// legenda de cores, só a explicação do traço (a cor nunca é o único sinal).
const COR = 'var(--chart-1)'
const ALTURA = 300
const MARGEM = { topo: 24, direita: 16, baixo: 28, esquerda: 48 }
const ESPACO_MARCA_X = 64
const DIA = 86_400_000

const tempo = (iso: string) => new Date(`${iso}T12:00:00Z`).getTime()
const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Divisões "redondas" para o eixo y (1, 2, 2,5 ou 5 × 10^n). */
function escalaY(min: number, max: number) {
  if (min === max) {
    min -= 1
    max += 1
  }
  const bruto = (max - min) / 4
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto)!
  const inicio = Math.max(0, Math.floor(min / passo) * passo)
  const fim = Math.ceil(max / passo) * passo
  const marcas: number[] = []
  for (let v = inicio; v <= fim + passo / 2; v += passo) marcas.push(Number(v.toFixed(6)))
  return { inicio, fim, marcas }
}

type Ponto = { t: number; data: string; preco: number; minimo?: number; maximo?: number; previsto: boolean }

/** Preço histórico e previsto, com a faixa de 80% e dica ao passar o mouse. */
export function PrevisaoPrecoChart({ historico, previsoes, unidade, titulo, mensal }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [foco, setFoco] = useState<number | null>(null)

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const pontos = useMemo<Ponto[]>(
    () => [
      ...historico.map((p) => ({ t: tempo(p.data), data: p.data, preco: p.preco, previsto: false })),
      ...previsoes.map((p) => ({
        t: tempo(p.data),
        data: p.data,
        preco: p.preco,
        minimo: p.minimo,
        maximo: p.maximo,
        previsto: true,
      })),
    ],
    [historico, previsoes],
  )

  if (!pontos.length) return null
  const ultimoReal = historico.at(-1)
  const valores = pontos.flatMap((p) => [p.preco, p.minimo ?? p.preco, p.maximo ?? p.preco])
  const escala = escalaY(Math.min(...valores), Math.max(...valores))

  const t0 = pontos[0].t
  const t1 = pontos[pontos.length - 1].t
  const w = Math.max(largura, 240)
  const plotW = w - MARGEM.esquerda - MARGEM.direita
  const plotH = ALTURA - MARGEM.topo - MARGEM.baixo
  const x = (t: number) => MARGEM.esquerda + (t1 === t0 ? plotW / 2 : ((t - t0) / (t1 - t0)) * plotW)
  const y = (v: number) => MARGEM.topo + plotH - ((v - escala.inicio) / (escala.fim - escala.inicio)) * plotH

  // eixo x: um rótulo no dia 1 de cada N meses, conforme a largura
  const maxMarcas = Math.max(2, Math.floor(plotW / ESPACO_MARCA_X))
  const meses = Math.round((t1 - t0) / (30 * DIA)) + 1
  const pulo = Math.max(1, Math.ceil(meses / maxMarcas))
  const inicio = new Date(t0)
  const marcasX: number[] = []
  for (let i = 1; ; i += pulo) {
    const t = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + i, 1)
    if (t > t1) break
    marcasX.push(t)
  }

  const linha = (ps: { t: number; preco: number }[]) =>
    ps.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.preco).toFixed(1)}`).join('')

  // a previsão parte do último preço conhecido, para a linha não ter buraco
  const ancora = ultimoReal ? [{ t: tempo(ultimoReal.data), preco: ultimoReal.preco }] : []
  const futuro = [...ancora, ...pontos.filter((p) => p.previsto)]
  const faixaCima = [...ancora.map((a) => ({ ...a, v: a.preco })), ...previsoes.map((p) => ({ t: tempo(p.data), v: p.maximo }))]
  const faixaBaixo = [...ancora.map((a) => ({ ...a, v: a.preco })), ...previsoes.map((p) => ({ t: tempo(p.data), v: p.minimo }))]
  const faixa =
    faixaCima.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('') +
    [...faixaBaixo]
      .reverse()
      .map((p) => `L${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
      .join('') +
    'Z'
  const xHoje = ultimoReal ? x(tempo(ultimoReal.data)) : null

  function mover(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const t = t0 + ((event.clientX - box.left) / box.width) * (t1 - t0)
    let melhor = 0
    for (let k = 1; k < pontos.length; k++) if (Math.abs(pontos[k].t - t) < Math.abs(pontos[melhor].t - t)) melhor = k
    setFoco(melhor)
  }

  const p = foco !== null ? pontos[foco] : null
  const fmtData = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(
      'pt-BR',
      mensal ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' },
    )

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <svg width="18" height="4" aria-hidden="true">
            <line x1="0" x2="18" y1="2" y2="2" strokeWidth="2" style={{ stroke: COR }} />
          </svg>
          Preço observado
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="18" height="4" aria-hidden="true">
            <line x1="0" x2="18" y1="2" y2="2" strokeWidth="2" strokeDasharray="4 3" style={{ stroke: COR }} />
          </svg>
          Previsão
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ background: COR, opacity: 0.18 }} aria-hidden="true" />
          Faixa provável (80%)
        </li>
      </ul>

      <div ref={caixa} className="relative w-full" style={{ minHeight: ALTURA }}>
        {largura > 0 && (
          <svg
            width={w}
            height={ALTURA}
            className="block overflow-visible"
            role="img"
            aria-label={`${titulo}: ${historico.length} preços observados e ${previsoes.length} previstos. Os valores estão na tabela abaixo.`}
          >
            {escala.marcas.map((v) => (
              <g key={v}>
                <line className="stroke-border" strokeWidth={1} x1={MARGEM.esquerda} x2={MARGEM.esquerda + plotW} y1={y(v)} y2={y(v)} />
                <text className="fill-muted-foreground text-[11px]" x={MARGEM.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </text>
              </g>
            ))}
            <text className="fill-muted-foreground text-[11px]" x={MARGEM.esquerda - 8} y={MARGEM.topo - 10} textAnchor="end">
              {unidade}
            </text>
            {marcasX.map((t) => (
              <text key={t} className="fill-muted-foreground text-[11px]" x={x(t)} y={ALTURA - 8} textAnchor="middle">
                {new Date(t).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })}
              </text>
            ))}

            {xHoje !== null && (
              <g>
                <line className="stroke-muted-foreground" strokeWidth={1} strokeDasharray="2 3" x1={xHoje} x2={xHoje} y1={MARGEM.topo} y2={MARGEM.topo + plotH} />
                <text className="fill-muted-foreground text-[11px]" x={xHoje + 6} y={MARGEM.topo + 10}>
                  previsão →
                </text>
              </g>
            )}

            {previsoes.length > 0 && <path d={faixa} style={{ fill: COR }} opacity={0.18} />}
            <path d={linha(pontos.filter((q) => !q.previsto))} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: COR }} />
            {futuro.length > 1 && (
              <path d={linha(futuro)} fill="none" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" style={{ stroke: COR }} />
            )}

            {p && (
              <g>
                <line className="stroke-muted-foreground" strokeWidth={1} x1={x(p.t)} x2={x(p.t)} y1={MARGEM.topo} y2={MARGEM.topo + plotH} />
                <circle className="stroke-card" strokeWidth={2} cx={x(p.t)} cy={y(p.preco)} r={5} style={{ fill: COR }} />
              </g>
            )}

            <rect
              className="cursor-crosshair"
              fill="transparent"
              style={{ touchAction: 'pan-y' }}
              x={MARGEM.esquerda}
              y={MARGEM.topo}
              width={plotW}
              height={plotH}
              onPointerMove={mover}
              onPointerDown={mover}
              onPointerLeave={() => setFoco(null)}
            />
          </svg>
        )}

        {p && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 flex w-[min(220px,100%)] flex-col gap-1 rounded-lg border bg-popover p-2.5 text-xs text-muted-foreground shadow-lg"
            style={{
              left: Math.max(0, Math.min(x(p.t) + 232 > w ? x(p.t) - 232 : x(p.t) + 12, w - 220)),
              top: MARGEM.topo,
            }}
          >
            <strong className="text-foreground">{fmtData(p.data)}</strong>
            <span>
              {p.previsto ? 'Previsto: ' : 'Observado: '}
              <b className="text-foreground">{reais(p.preco)}</b>
            </span>
            {p.previsto && p.minimo !== undefined && p.maximo !== undefined && (
              <span>
                Faixa provável: {reais(p.minimo)} a {reais(p.maximo)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
