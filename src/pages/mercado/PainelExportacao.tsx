import { DollarSignIcon, GlobeIcon, ScaleIcon } from 'lucide-react'
import { SensorChart } from '@/components/charts/SensorChart'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import type { Exportacao } from '@/types/mercado'
import { dolares, mesAno, serieMensal, toneladas } from './formato'

/** Exportações brasileiras da fruta fresca (Comex Stat). */
export function PainelExportacao({ exportacao }: { exportacao: Exportacao }) {
  if (!exportacao.ncm)
    return <EmptyState>Esta fruta não tem código próprio na NCM, então o Comex Stat não separa as exportações dela.</EmptyState>
  if (!exportacao.referencia || !exportacao.total_12_meses)
    return <EmptyState>Os dados de exportação ainda não foram importados do Comex Stat.</EmptyState>

  const total = exportacao.total_12_meses
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<DollarSignIcon />} label="Exportado em 12 meses" value={dolares(total.valor_fob_usd)} hint={`Valor FOB até ${mesAno(exportacao.referencia)}`} />
        <StatCard icon={<ScaleIcon />} label="Volume em 12 meses" value={toneladas(total.peso_kg)} />
        <StatCard
          icon={<GlobeIcon />}
          label="Preço médio exportado"
          value={total.usd_kg === null ? '—' : `US$ ${total.usd_kg.toLocaleString('pt-BR')}/kg`}
          hint={exportacao.paises[0] ? `Maior destino: ${exportacao.paises[0].pais}` : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="min-w-0 space-y-3">
          <SectionHeader title="Exportação mês a mês" description={`Valor FOB em dólares, NCM ${exportacao.ncm}.`} />
          <Card>
            <CardContent>
              <SensorChart
                // em milhões: o eixo não comporta "25.000.000"
                series={[
                  serieMensal(
                    'Exportação (US$ FOB)',
                    exportacao.serie.map((s) => ({ ...s, valor: Math.round(s.valor_fob_usd / 10_000) / 100 })),
                  ),
                ]}
                unidade="US$ mi"
                intervalo="month"
                titulo="Exportação mensal"
              />
            </CardContent>
          </Card>
        </section>
        <section className="min-w-0 space-y-3">
          <SectionHeader title="Principais destinos" description="Últimos 12 meses, por valor." />
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <caption className="sr-only">Países que mais compraram a fruta em 12 meses</caption>
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">País</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-right font-medium">Parte</th>
                </tr>
              </thead>
              <tbody>
                {exportacao.paises.map((p) => (
                  <tr key={p.pais} className="border-t">
                    <td className="px-3 py-2">{p.pais}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{dolares(p.valor_fob_usd)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.participacao.toLocaleString('pt-BR')}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
