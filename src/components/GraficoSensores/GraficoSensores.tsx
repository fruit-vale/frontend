import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import './GraficoSensores.css'

export type Serie = {
  sensor: string
  lote: string | null
  pontos: { instante: string; valor: number }[]
}

type Props = {
  series: Serie[]
  unidade: string | null
  /** agregação dos pontos: por hora ou por dia */
  intervalo: 'hour' | 'day'
  /** nome do dado, para o título acessível (ex.: "Temperatura") */
  titulo: string
}

// paleta categórica em ordem fixa (validada p/ daltonismo nos pares vizinhos);
// a cor segue o sensor pela posição da série, nunca é gerada
const MAX_SERIES = 8
const ALTURA = 280
const MARGEM = { topo: 20, direita: 150, baixo: 28, esquerda: 48 }
// acima disso os rótulos no fim das linhas se atropelam: fica só a legenda
const ROTULOS_DIRETOS_MAX = 4
// abaixo dessa largura os rótulos diretos roubam espaço demais do gráfico
const LARGURA_ROTULOS_MIN = 560
// espaço mínimo entre marcas do eixo x, para as datas não se sobreporem
const ESPACO_MARCA_X = 48
const HORA = 3_600_000
const DIA = 24 * HORA

const nomeSerie = (s: Serie) => (s.lote ? `${s.sensor} · ${s.lote}` : s.sensor)
const fmtValor = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Divisões "redondas" para o eixo y (1, 2, 2,5 ou 5 × 10^n). */
function escalaY(min: number, max: number) {
  if (min === max) {
    min -= 1
    max += 1
  }
  const bruto = (max - min) / 4
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto)!
  const inicio = Math.floor(min / passo) * passo
  const fim = Math.ceil(max / passo) * passo
  const marcas: number[] = []
  for (let v = inicio; v <= fim + passo / 2; v += passo) marcas.push(Number(v.toFixed(6)))
  return { inicio, fim, marcas }
}

/** Gráfico de linhas, uma por sensor, com linha-guia + dica ao passar o mouse. */
function GraficoSensores({ series: todas, unidade, intervalo, titulo }: Props) {
  const series = useMemo(() => todas.slice(0, MAX_SERIES), [todas])
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [foco, setFoco] = useState<number | null>(null)
  const [tabela, setTabela] = useState(false)

  // largura real do contêiner: o texto do SVG fica nítido, sem esticar
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const dados = useMemo(() => {
    const instantes = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.instante)))].sort()
    if (!instantes.length) return null
    const valores = series.flatMap((s) => s.pontos.map((p) => p.valor))
    return {
      instantes,
      tempos: instantes.map((i) => new Date(i).getTime()),
      y: escalaY(Math.min(...valores), Math.max(...valores)),
      porSerie: series.map((s) => new Map(s.pontos.map((p) => [p.instante, p.valor]))),
    }
  }, [series])

  if (!dados) return <p className="empty-state">Sem leituras neste período.</p>

  const t0 = dados.tempos[0]
  const t1 = dados.tempos[dados.tempos.length - 1]
  const w = Math.max(largura, 240)
  const diretos = series.length <= ROTULOS_DIRETOS_MAX && w >= LARGURA_ROTULOS_MIN
  const margemDireita = diretos ? MARGEM.direita : 20
  const plotW = w - MARGEM.esquerda - margemDireita
  const plotH = ALTURA - MARGEM.topo - MARGEM.baixo
  const x = (t: number) => MARGEM.esquerda + (t1 === t0 ? plotW / 2 : ((t - t0) / (t1 - t0)) * plotW)
  const y = (v: number) => MARGEM.topo + plotH - ((v - dados.y.inicio) / (dados.y.fim - dados.y.inicio)) * plotH

  // marcas do eixo x: o menor passo "redondo" que cabe na largura disponível
  const maxMarcas = Math.max(2, Math.floor(plotW / ESPACO_MARCA_X))
  const passos = [HORA, 3 * HORA, 6 * HORA, 12 * HORA, DIA, 2 * DIA, 7 * DIA, 14 * DIA]
  const passoX = passos.find((p) => (t1 - t0) / p <= maxMarcas) ?? 30 * DIA
  const marcasX: number[] = []
  for (let t = Math.ceil(t0 / passoX) * passoX; t <= t1; t += passoX) marcasX.push(t)
  const fmtX = (t: number) =>
    new Date(t).toLocaleString(
      'pt-BR',
      passoX < DIA ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' },
    )
  const fmtInstante = (i: string) =>
    new Date(i).toLocaleString(
      'pt-BR',
      intervalo === 'hour'
        ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' },
    )

  // quebra a linha onde faltam pontos, em vez de ligar por cima da lacuna
  const passoDados = intervalo === 'hour' ? HORA : DIA
  const caminho = (s: Serie) => {
    let d = ''
    let anterior: number | null = null
    for (const p of s.pontos) {
      const t = new Date(p.instante).getTime()
      const liga = anterior !== null && t - anterior <= passoDados * 1.5
      d += `${liga ? 'L' : 'M'}${x(t).toFixed(1)},${y(p.valor).toFixed(1)}`
      anterior = t
    }
    return d
  }

  // rótulos no fim das linhas: afasta verticalmente os que se sobrepõem
  const fins = series
    .map((s, i) => ({ i, p: s.pontos[s.pontos.length - 1] }))
    .filter((f) => f.p)
    .map((f) => ({ ...f, yy: y(f.p.valor) }))
    .sort((a, b) => a.yy - b.yy)
  for (let k = 1; k < fins.length; k++) fins[k].yy = Math.max(fins[k].yy, fins[k - 1].yy + 15)

  function mover(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const t = t0 + ((event.clientX - box.left) / box.width) * (t1 - t0)
    let melhor = 0
    for (let k = 1; k < dados!.tempos.length; k++)
      if (Math.abs(dados!.tempos[k] - t) < Math.abs(dados!.tempos[melhor] - t)) melhor = k
    setFoco(melhor)
  }

  const instanteFoco = foco !== null ? dados.instantes[foco] : null
  const xFoco = foco !== null ? x(dados.tempos[foco]) : 0
  const un = unidade ? ` ${unidade}` : ''

  return (
    <div className="grafico-sensores">
      {series.length > 1 && (
        <ul className="grafico-sensores__legenda">
          {series.map((s, i) => (
            <li key={s.sensor}>
              <span className="grafico-sensores__chave" style={{ background: `var(--serie-${i + 1})` }} />
              {nomeSerie(s)}
            </li>
          ))}
        </ul>
      )}
      {todas.length > MAX_SERIES && (
        <p className="form-hint">
          Mostrando os {MAX_SERIES} sensores com mais leituras, de {todas.length}.
        </p>
      )}

      <div ref={caixa} className="grafico-sensores__area">
        {largura > 0 && (
          <svg
            width={w}
            height={ALTURA}
            role="img"
            aria-label={`${titulo} de ${series.length} sensor(es), de ${fmtInstante(dados.instantes[0])} a ${fmtInstante(dados.instantes[dados.instantes.length - 1])}. Os valores estão na tabela abaixo.`}
          >
            {dados.y.marcas.map((v) => (
              <g key={v}>
                <line className="grafico-sensores__grade" x1={MARGEM.esquerda} x2={MARGEM.esquerda + plotW} y1={y(v)} y2={y(v)} />
                <text className="grafico-sensores__eixo" x={MARGEM.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {fmtValor(v)}
                </text>
              </g>
            ))}
            {marcasX.map((t) => (
              <text key={t} className="grafico-sensores__eixo" x={x(t)} y={ALTURA - 8} textAnchor="middle">
                {fmtX(t)}
              </text>
            ))}
            {unidade && (
              <text className="grafico-sensores__eixo" x={MARGEM.esquerda - 8} y={MARGEM.topo - 8} textAnchor="end">
                {unidade}
              </text>
            )}

            {series.map((s, i) => (
              <path key={s.sensor} d={caminho(s)} className="grafico-sensores__linha" style={{ stroke: `var(--serie-${i + 1})` }} />
            ))}

            {/* ponto final de cada linha, com anel da cor da superfície */}
            {fins.map(({ i, p }) => (
              <circle
                key={i}
                className="grafico-sensores__ponto"
                cx={x(new Date(p.instante).getTime())}
                cy={y(p.valor)}
                r={4}
                style={{ fill: `var(--serie-${i + 1})` }}
              />
            ))}
            {diretos &&
              fins.map(({ i, p, yy }) => (
                <text key={i} className="grafico-sensores__rotulo" x={x(new Date(p.instante).getTime()) + 10} y={yy} dy="0.32em">
                  {fmtValor(p.valor)}
                  {un}
                  <tspan className="grafico-sensores__rotulo-nome"> {series[i].sensor}</tspan>
                </text>
              ))}

            {instanteFoco && (
              <g>
                <line className="grafico-sensores__guia" x1={xFoco} x2={xFoco} y1={MARGEM.topo} y2={MARGEM.topo + plotH} />
                {series.map((s, i) => {
                  const v = dados.porSerie[i].get(instanteFoco)
                  return v === undefined ? null : (
                    <circle key={s.sensor} className="grafico-sensores__ponto" cx={xFoco} cy={y(v)} r={4} style={{ fill: `var(--serie-${i + 1})` }} />
                  )
                })}
              </g>
            )}

            {/* área de captura do tamanho do gráfico: hover e toque fáceis */}
            <rect
              className="grafico-sensores__captura"
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

        {instanteFoco && (
          <div className="grafico-sensores__dica" role="status" style={{
              left: Math.max(0, Math.min(xFoco + 272 > w ? xFoco - 272 : xFoco + 12, w - 260)),
              top: MARGEM.topo,
            }}>
            <strong>{fmtInstante(instanteFoco)}</strong>
            {series.map((s, i) => {
              const v = dados.porSerie[i].get(instanteFoco)
              return (
                <span key={s.sensor}>
                  <i className="grafico-sensores__chave" style={{ background: `var(--serie-${i + 1})` }} />
                  <em title={nomeSerie(s)}>{nomeSerie(s)}</em>
                  <b>{v === undefined ? '—' : `${fmtValor(v)}${un}`}</b>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <button type="button" className="grafico-sensores__alternar" onClick={() => setTabela((t) => !t)}>
        {tabela ? 'Ocultar tabela' : 'Ver dados em tabela'}
      </button>
      {tabela && (
        <div className="grafico-sensores__tabela">
          <table>
            <thead>
              <tr>
                <th>{intervalo === 'hour' ? 'Hora' : 'Dia'}</th>
                {series.map((s) => (
                  <th key={s.sensor}>{nomeSerie(s)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...dados.instantes].reverse().map((instante) => (
                <tr key={instante}>
                  <td>{fmtInstante(instante)}</td>
                  {series.map((s, i) => {
                    const v = dados.porSerie[i].get(instante)
                    return <td key={s.sensor}>{v === undefined ? '—' : `${fmtValor(v)}${un}`}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default GraficoSensores
