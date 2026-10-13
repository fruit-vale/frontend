import { MapPinIcon, ScaleIcon, StoreIcon, TractorIcon } from 'lucide-react'
import { SensorChart } from '@/components/charts/SensorChart'
import { EmptyState, Hint } from '@/components/shared/EmptyState'
import { SectionHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import type { Lote } from '@/types/lote'
import type { Atacado, Produtor } from '@/types/mercado'
import { MESES, mesAno, mesLongo, reais, serieMensal, toneladas, variacao } from './formato'

type Props = {
  atacado: Atacado
  produtor: Produtor | null
  /** lotes desta cultura com colheita prevista */
  lotes: Lote[]
}

/** Preço no atacado (Ceasas) e na porteira (produtor), onde vender e quando. */
export function PainelPrecos({ atacado, produtor, lotes }: Props) {
  if (!atacado.referencia)
    return (
      <EmptyState>
        A Conab ainda não tem preços de atacado desta fruta, ou os dados ainda não foram
        importados. Os preços aparecem depois da próxima atualização.
      </EmptyState>
    )

  const [penultimo, ultimo] = atacado.serie.slice(-2)
  const atual = ultimo ?? penultimo
  const mudou = penultimo && ultimo ? variacao(ultimo.preco_kg, penultimo.preco_kg) : null
  const produtorAtual = produtor?.serie.at(-1)
  const mediaAno = atacado.sazonalidade.length
    ? atacado.sazonalidade.reduce((s, m) => s + m.preco_kg, 0) / atacado.sazonalidade.length
    : null
  const maiorSazonal = Math.max(...atacado.sazonalidade.map((s) => s.preco_kg), 0)

  const series = [
    serieMensal(
      'Atacado (Ceasas)',
      atacado.serie.map((s) => ({ ...s, valor: s.preco_kg })),
    ),
    ...(produtor?.serie.length
      ? [serieMensal('Produtor (média dos estados)', produtor.serie.map((s) => ({ ...s, valor: s.preco_kg })))]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<StoreIcon />}
          label={`Atacado · ${mesAno(atual)}`}
          value={`${reais(atual.preco_kg)}/kg`}
          hint={
            mudou === null
              ? 'Média das Ceasas, ponderada pelo volume'
              : `${mudou > 0 ? '+' : ''}${mudou.toLocaleString('pt-BR')}% em relação ao mês anterior`
          }
        />
        <StatCard
          icon={<TractorIcon />}
          label={produtorAtual ? `Produtor · ${mesAno(produtorAtual)}` : 'Produtor'}
          value={produtorAtual ? `${reais(produtorAtual.preco_kg)}/kg` : '—'}
          hint={produtorAtual ? 'Preço recebido, média dos estados' : 'Sem preço ao produtor nesta fruta'}
        />
        <StatCard
          icon={<ScaleIcon />}
          label={`Vendido nas Ceasas · ${mesAno(atual)}`}
          value={toneladas(atual.quantidade_kg)}
        />
        <StatCard
          icon={<MapPinIcon />}
          label="Maior origem no período"
          value={atacado.origens[0] ? `${atacado.origens[0].participacao.toLocaleString('pt-BR')}%` : '—'}
          hint={atacado.origens[0]?.municipio}
        />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Preço por quilo"
          description="Atacado: valor vendido ÷ quilos nas Ceasas. Produtor: preço recebido na porteira."
        />
        <Card>
          <CardContent>
            <SensorChart series={series} unidade="R$/kg" intervalo="month" titulo="Preço por quilo" />
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 space-y-3">
          <SectionHeader title="Onde vender" description={`Preço por Ceasa em ${mesAno(atual)}, do maior para o menor.`} />
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <caption className="sr-only">Preço por Ceasa no último mês</caption>
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Ceasa</th>
                  <th className="px-3 py-2 text-right font-medium">R$/kg</th>
                  <th className="px-3 py-2 text-right font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {atacado.ceasas.slice(0, 10).map((c, i) => (
                  <tr key={`${c.ceasa}-${c.uf}`} className="border-t">
                    <td className="px-3 py-2">
                      {c.ceasa} <span className="text-muted-foreground">· {c.uf}</span>
                      {i === 0 && atacado.ceasas.length > 1 && (
                        <StatusBadge tone="success" className="ml-2">
                          Maior preço
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{reais(c.preco_kg)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{toneladas(c.quantidade_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <SectionHeader title="De onde vem a fruta" description="Municípios que mais abasteceram as Ceasas no período." />
          <Card>
            <CardContent>
              <ol className="space-y-3">
                {atacado.origens.map((o) => (
                  <li key={`${o.municipio}-${o.uf}`} className="space-y-1">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate">{o.municipio}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {o.participacao.toLocaleString('pt-BR')}% · {toneladas(o.quantidade_kg)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, o.participacao)}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Melhor época de vender"
          description="Preço típico de cada mês do ano no atacado, em todo o histórico da Conab."
        />
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12" role="list" aria-label="Preço típico por mês">
              {MESES.map((nome, i) => {
                const s = atacado.sazonalidade.find((x) => x.mes === i + 1)
                const pct = s && maiorSazonal ? (s.preco_kg / maiorSazonal) * 100 : 0
                return (
                  <div key={nome} role="listitem" className="flex flex-col items-center gap-1 text-xs">
                    <div className="flex h-24 w-full items-end rounded bg-muted/60">
                      <div className="w-full rounded bg-primary/80" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="font-medium">{nome}</span>
                    <span className="tabular-nums text-muted-foreground">{s ? reais(s.preco_kg) : '—'}</span>
                  </div>
                )
              })}
            </div>
            {lotes.length > 0 && mediaAno !== null && (
              <ul className="space-y-1 border-t pt-3 text-sm">
                {lotes.map((l) => {
                  const mes = Number(l.previsao_colheita!.slice(5, 7))
                  const tipico = atacado.sazonalidade.find((s) => s.mes === mes)?.preco_kg
                  const dif = tipico ? variacao(tipico, mediaAno) : null
                  return (
                    <li key={l.id}>
                      <strong>{l.nome_identificacao}</strong>: colheita prevista em {mesLongo(mes)}.{' '}
                      {tipico ? (
                        <>
                          Preço típico do mês: {reais(tipico)}/kg
                          {dif !== null && (
                            <span className={dif >= 0 ? 'text-success' : 'text-warning'}>
                              {' '}
                              ({dif >= 0 ? '+' : ''}
                              {dif.toLocaleString('pt-BR')}% em relação à média do ano)
                            </span>
                          )}
                        </>
                      ) : (
                        'Sem preço histórico para esse mês.'
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <Hint>
              Preços de atacado (Ceasas). O produtor costuma receber menos que isso: compare com a
              linha do produtor no gráfico.
            </Hint>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
