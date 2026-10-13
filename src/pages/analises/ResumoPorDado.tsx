import { useState } from 'react'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PeriodoFiltro } from '@/components/shared/PeriodoFiltro'
import { SelectField } from '@/components/shared/SelectField'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { contarForaDaFaixa, faixaDaCultura, resumir, valoresDasSeries } from '@/lib/estatisticas'
import { chavePeriodo, descreverPeriodo } from '@/lib/periodo'
import { painelService, type PeriodoPainel } from '@/services/painel.service'
import { TIPO_MEDIDA_LABELS } from '@/types/sensor'
import { fmt, type DadosAnalise } from './contexto'

const TODOS = 'todos'

/** Média, mínimo e máximo de cada dado medido, num lote, numa propriedade ou em tudo. */
export function ResumoPorDado({ dados }: { dados: DadosAnalise }) {
  const [periodo, setPeriodo] = useState<PeriodoPainel>(7)
  const [propriedadeId, setPropriedadeId] = useState(TODOS)
  const [loteId, setLoteId] = useState(TODOS)

  const propriedades = [...new Map(dados.lotes.map((l) => [l.propriedade.id, l.propriedade])).values()]
  const lotesDaPropriedade = dados.lotes.filter(
    (l) => propriedadeId === TODOS || l.propriedade.id === Number(propriedadeId),
  )
  const lote = dados.lotes.find((l) => l.id === Number(loteId))
  const filtro = {
    propriedadeId: propriedadeId === TODOS ? undefined : Number(propriedadeId),
    loteId: lote?.id,
  }

  const { data, error, loading } = useRequest(
    (signal) =>
      Promise.all(dados.tipos.map((t) => painelService.serie(t.tipo, periodo, filtro, signal))),
    {
      key: `${chavePeriodo(periodo)}-${propriedadeId}-${loteId}`,
      enabled: dados.tipos.length > 0,
      errorPrefix: 'Não foi possível carregar as leituras',
    },
  )

  if (dados.tipos.length === 0)
    return <EmptyState>Nenhum sensor enviou leituras ainda.</EmptyState>

  const cultura = lote ? dados.culturas.get(lote.cultura.id) : undefined
  const intervalo = data?.[0]?.intervalo ?? 'hour'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          aria-label="Propriedade"
          value={propriedadeId}
          onValueChange={(v) => {
            setPropriedadeId(v)
            setLoteId(TODOS)
          }}
          options={[
            { value: TODOS, label: 'Todas as propriedades' },
            ...propriedades.map((p) => ({ value: String(p.id), label: p.nome })),
          ]}
          className="w-52"
        />
        <SelectField
          aria-label="Lote"
          value={loteId}
          onValueChange={setLoteId}
          options={[
            { value: TODOS, label: 'Todos os lotes' },
            ...lotesDaPropriedade.map((l) => ({ value: String(l.id), label: l.nome_identificacao })),
          ]}
          className="w-44"
        />
        <PeriodoFiltro value={periodo} onChange={setPeriodo} />
      </div>

      <ErrorMessage message={error} />

      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : data ? (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <caption className="sr-only">Resumo de cada dado no período</caption>
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Dado</th>
                  <th className="px-3 py-2 text-right font-medium">Média</th>
                  <th className="px-3 py-2 text-right font-medium">Mínima</th>
                  <th className="px-3 py-2 text-right font-medium">Máxima</th>
                  <th className="px-3 py-2 text-right font-medium">Sensores</th>
                  <th className="px-3 py-2 font-medium">Fora da faixa ideal</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => {
                  const unidade = r.unidade ?? dados.tipos[i].unidade
                  const valores = valoresDasSeries(r.series)
                  const resumo = resumir(valores)
                  const faixa = faixaDaCultura(cultura, r.tipo)
                  const fora = faixa ? contarForaDaFaixa(valores, faixa) : null
                  return (
                    <tr key={r.tipo} className="border-t">
                      <td className="px-3 py-2 font-medium">{TIPO_MEDIDA_LABELS[r.tipo]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.media, unidade)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.min, unidade)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.max, unidade)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.series.length}</td>
                      <td className="px-3 py-2">
                        {!resumo
                          ? 'Sem leituras'
                          : !lote
                            ? 'Escolha um lote'
                            : !faixa
                              ? '—'
                              : `${fora?.percentual.toLocaleString('pt-BR')}% do tempo`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Hint>
            Sobre as médias {intervalo === 'hour' ? 'por hora' : 'por dia'} dos sensores em{' '}
            {descreverPeriodo(periodo)}. O tempo fora da faixa usa a faixa da cultura, então só
            aparece com um lote escolhido.
          </Hint>
        </>
      ) : null}
    </div>
  )
}
