import { useState } from 'react'
import { SensorChart } from '@/components/charts/SensorChart'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { SelectField } from '@/components/shared/SelectField'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { contarForaDaFaixa, faixaDaCultura, mediaPorInstante, resumir } from '@/lib/estatisticas'
import { formatarData } from '@/lib/format'
import { hojeIso, limitarPeriodo } from '@/lib/periodo'
import { lotesService, painelService } from '@/services'
import { nomeCultura } from '@/types/cultura'
import type { Safra } from '@/types/lote'
import type { Serie } from '@/types/painel'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from '@/types/sensor'
import { fmt, unidadeDo, type DadosAnalise } from './contexto'

/** A safra em andamento (ou a última) e a anterior a ela, ambas com plantio. */
function escolherSafras(safras: Safra[]) {
  const comPlantio = safras.filter((s) => s.data_plantio)
  const atual = comPlantio.find((s) => s.em_andamento) ?? comPlantio[0] ?? null
  const anterior =
    atual &&
    comPlantio
      .filter((s) => s.id !== atual.id && s.data_colheita && s.data_plantio! < atual.data_plantio!)
      .sort((a, b) => b.data_plantio!.localeCompare(a.data_plantio!))[0]
  return { atual, anterior: anterior ?? null }
}

const periodoDa = (s: Safra) => limitarPeriodo(s.data_plantio!, s.data_colheita ?? hojeIso())

/** Desloca a série no tempo, para as duas safras começarem no mesmo plantio. */
function deslocar(serie: Serie, ms: number, nome: string): Serie {
  return {
    sensor: nome,
    lote: null,
    pontos: serie.pontos.map((p) => ({
      instante: new Date(new Date(p.instante).getTime() + ms).toISOString(),
      valor: p.valor,
    })),
  }
}

/** Esta safra contra a anterior, no mesmo lote, alinhadas pelo dia do plantio. */
export function ComparacaoSafras({ dados }: { dados: DadosAnalise }) {
  const tipos = dados.tipos.map((t) => t.tipo)
  const [tipo, setTipo] = useState<TipoMedida | null>(
    tipos.includes('TEMPERATURA') ? 'TEMPERATURA' : (tipos[0] ?? null),
  )
  const [loteId, setLoteId] = useState(
    String(dados.lotes.find((l) => l.total_safras > 1)?.id ?? dados.lotes[0]?.id ?? ''),
  )
  const lote = dados.lotes.find((l) => l.id === Number(loteId))

  const { data, error, loading } = useRequest(
    async (signal) => {
      const safras = await lotesService.listarSafras(lote!.id, signal)
      const { atual, anterior } = escolherSafras(safras)
      if (!atual || !anterior) return { atual, anterior, series: null }
      const [a, b] = await Promise.all(
        [atual, anterior].map((s) => {
          const p = periodoDa(s)
          return painelService.serie(tipo!, { desde: p.desde, ate: p.ate }, { loteId: lote!.id }, signal)
        }),
      )
      return { atual, anterior, series: { a, b } }
    },
    {
      key: `${loteId}-${tipo}`,
      enabled: !!lote && tipo !== null,
      errorPrefix: 'Não foi possível carregar as safras',
    },
  )

  if (!tipo) return <EmptyState>Nenhum sensor enviou leituras ainda.</EmptyState>
  if (dados.lotes.length === 0) return <EmptyState>Nenhum lote cadastrado na empresa ainda.</EmptyState>

  const unidade = unidadeDo(dados, tipo)
  const faixa = lote ? faixaDaCultura(dados.culturas.get(lote.cultura.id), tipo) : null

  let conteudo
  if (loading && !data) conteudo = <Skeleton className="h-80" />
  else if (data && (!data.atual || !data.anterior))
    conteudo = (
      <EmptyState>
        {data.atual
          ? 'Este lote ainda não tem uma safra anterior colhida para comparar. Registre a colheita em Cultivos e Lotes → Histórico.'
          : 'Este lote não tem safras com data de plantio.'}
      </EmptyState>
    )
  else if (data?.series && data.atual && data.anterior) {
    const { atual, anterior } = data
    const a = mediaPorInstante(data.series.a.series, 'Safra atual')
    // a anterior no calendário da atual: dia 10 do ciclo cai no dia 10 da atual
    const deslocamento =
      new Date(`${atual.data_plantio}T12:00:00`).getTime() -
      new Date(`${anterior.data_plantio}T12:00:00`).getTime()
    const b = deslocar(
      mediaPorInstante(data.series.b.series, 'x'),
      deslocamento,
      'Safra anterior (alinhada pelo plantio)',
    )
    const linhas = [
      { nome: 'Safra atual', safra: atual, serie: a },
      { nome: 'Safra anterior', safra: anterior, serie: b },
    ].map((l) => {
      const valores = l.serie.pontos.map((p) => p.valor)
      return { ...l, resumo: resumir(valores), fora: faixa ? contarForaDaFaixa(valores, faixa) : null }
    })
    const series = [a, b].filter((s) => s.pontos.length)
    const cortada = [atual, anterior].some((s) => periodoDa(s).cortado)

    conteudo = (
      <>
        <Card>
          <CardContent>
            {series.length === 0 ? (
              <EmptyState>
                Nenhuma leitura de {TIPO_MEDIDA_LABELS[tipo].toLowerCase()} nas duas safras deste lote.
              </EmptyState>
            ) : (
              <SensorChart
                series={series}
                unidade={unidade}
                intervalo={data.series.a.intervalo}
                titulo={`${TIPO_MEDIDA_LABELS[tipo]}: safra atual e anterior`}
              />
            )}
          </CardContent>
        </Card>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">Comparação das duas safras</caption>
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Safra</th>
                <th className="px-3 py-2 font-medium">Período</th>
                <th className="px-3 py-2 text-right font-medium">Média</th>
                <th className="px-3 py-2 text-right font-medium">Mínima</th>
                <th className="px-3 py-2 text-right font-medium">Máxima</th>
                <th className="px-3 py-2 font-medium">Fora da faixa</th>
                <th className="px-3 py-2 text-right font-medium">Produtividade</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.nome} className="border-t">
                  <td className="px-3 py-2">
                    <strong className="block">{l.nome}</strong>
                    <small className="text-muted-foreground">{nomeCultura(l.safra.cultura)}</small>
                  </td>
                  <td className="px-3 py-2">
                    {formatarData(l.safra.data_plantio)} a{' '}
                    {l.safra.data_colheita ? formatarData(l.safra.data_colheita) : 'hoje'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(l.resumo?.media, unidade)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(l.resumo?.min, unidade)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(l.resumo?.max, unidade)}</td>
                  <td className="px-3 py-2">
                    {!faixa ? '—' : l.fora ? `${l.fora.percentual.toLocaleString('pt-BR')}%` : 'Sem leituras'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {l.safra.produtividade !== null
                      ? `${fmt(l.safra.produtividade)} ${l.safra.unidade_producao ?? ''}/ha`
                      : l.safra.em_andamento
                        ? 'Em andamento'
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Hint>
          A safra anterior foi deslocada no tempo para começar no mesmo dia do plantio da atual: o
          gráfico compara dia do ciclo com dia do ciclo. As leituras são dos sensores ligados ao
          lote hoje; sensores retirados na colheita e não religados ao lote não entram na safra
          anterior.
          {cortada && ' Uma das safras passa de 400 dias: entram só os últimos 400.'}
        </Hint>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          aria-label="Lote"
          value={loteId}
          onValueChange={setLoteId}
          options={dados.lotes.map((l) => ({
            value: String(l.id),
            label: `${l.nome_identificacao} — ${l.propriedade.nome} (${l.total_safras} ${l.total_safras === 1 ? 'safra' : 'safras'})`,
          }))}
          className="w-80"
        />
        <SelectField
          aria-label="Dado"
          value={tipo}
          onValueChange={(v) => setTipo(v as TipoMedida)}
          options={tipos.map((t) => ({ value: t, label: TIPO_MEDIDA_LABELS[t] }))}
          className="w-44"
        />
      </div>
      <ErrorMessage message={error} />
      {conteudo}
    </div>
  )
}
