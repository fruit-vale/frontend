import { useState } from 'react'
import { BellIcon, LandPlotIcon, TriangleAlertIcon } from 'lucide-react'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PeriodoFiltro } from '@/components/shared/PeriodoFiltro'
import { SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { formatarDataHora, plural } from '@/lib/format'
import { chavePeriodo, descreverPeriodo, periodoEmDatas } from '@/lib/periodo'
import { alertasService } from '@/services'
import type { PeriodoPainel } from '@/services/painel.service'
import type { Lote } from '@/types/lote'

const TODOS = 'todos'
const SITUACOES = [
  { value: TODOS, label: 'Lidos e não lidos' },
  { value: 'nao_lidos', label: 'Só não lidos' },
  { value: 'lidos', label: 'Só lidos' },
]
const RANKING = 5

export function AlertasAba({ lotes }: { lotes: Lote[] }) {
  const [propriedadeId, setPropriedadeId] = useState(TODOS)
  const [loteId, setLoteId] = useState(TODOS)
  const [periodo, setPeriodo] = useState<PeriodoPainel>(30)
  const [situacao, setSituacao] = useState(TODOS)

  const propriedades = [...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values()]
  const lotesDaPropriedade = lotes.filter(
    (l) => propriedadeId === TODOS || l.propriedade.id === Number(propriedadeId),
  )
  const { desde, ate } = periodoEmDatas(periodo)

  const { data, error, loading } = useRequest(
    (signal) =>
      alertasService.listar(
        {
          propriedadeId: propriedadeId === TODOS ? undefined : Number(propriedadeId),
          loteId: loteId === TODOS ? undefined : Number(loteId),
          desde,
          ate,
          lido: situacao === TODOS ? undefined : situacao === 'lidos',
          limite: 500,
        },
        signal,
      ),
    {
      key: `${propriedadeId}-${loteId}-${chavePeriodo(periodo)}-${situacao}`,
      errorPrefix: 'Não foi possível carregar os alertas',
    },
  )

  const naoLidos = data?.por_lote.reduce((s, l) => s + l.nao_lidos, 0) ?? 0
  const maior = data?.por_lote[0]?.total ?? 0

  return (
    <div className="space-y-6">
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
        <SelectField
          aria-label="Situação"
          value={situacao}
          onValueChange={setSituacao}
          options={SITUACOES}
          className="w-48"
        />
        <PeriodoFiltro value={periodo} onChange={setPeriodo} atalhos={[7, 30]} />
      </div>

      <ErrorMessage message={error} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<BellIcon />} label="Alertas no período" value={data?.total ?? 0} loading={loading && !data} />
        <StatCard icon={<TriangleAlertIcon />} label="Não lidos" value={naoLidos} loading={loading && !data} />
        <StatCard
          icon={<LandPlotIcon />}
          label="Lotes com alertas"
          value={data?.por_lote.length ?? 0}
          loading={loading && !data}
        />
      </div>

      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : data && data.total === 0 ? (
        <EmptyState>
          Nenhum alerta em {descreverPeriodo(periodo)} com estes filtros. Os alertas são criados
          quando a temperatura ou a umidade do ar medidas pelos sensores saem da faixa ideal
          cadastrada na cultura do lote.
        </EmptyState>
      ) : data ? (
        <>
          <section className="space-y-3">
            <SectionHeader title="Lotes que mais geram alertas" description={`Em ${descreverPeriodo(periodo)}.`} />
            <Card>
              <CardContent>
                <ol className="space-y-3">
                  {data.por_lote.slice(0, RANKING).map((l, i) => (
                    <li key={l.lote.id} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          <strong>
                            {i + 1}. {l.lote.nome}
                          </strong>
                          {l.propriedade && <span className="text-muted-foreground"> · {l.propriedade.nome}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">
                            {l.total} {plural(l.total, 'alerta', 'alertas')}
                          </span>
                          {l.nao_lidos > 0 && (
                            <StatusBadge tone="warning">
                              {l.nao_lidos} não {plural(l.nao_lidos, 'lido', 'lidos')}
                            </StatusBadge>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-warning"
                          style={{ width: `${maior ? (l.total / maior) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Alertas"
              description={
                data.total > data.alertas.length
                  ? `Os ${data.alertas.length} mais recentes de ${data.total}.`
                  : 'Do mais recente para o mais antigo.'
              }
            />
            <ListaPaginada
              itens={data.alertas}
              campos={(a) => [a.mensagem, a.lote.nome, a.propriedade.nome, a.sensor]}
              rotuloBusca="Buscar alerta"
              vazio="Nenhum alerta com esta busca."
              porPagina={10}
              renderItem={(a) => (
                <div className="flex flex-wrap items-start gap-3 rounded-lg border px-3 py-2.5">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{a.mensagem}</p>
                    <small className="text-xs text-muted-foreground">
                      {a.data_hora ? formatarDataHora(a.data_hora) : 'sem data'} · {a.lote.nome} ·{' '}
                      {a.propriedade.nome}
                    </small>
                  </div>
                  <StatusBadge tone={a.lido ? 'neutral' : 'warning'}>{a.lido ? 'Lido' : 'Não lido'}</StatusBadge>
                </div>
              )}
            />
          </section>
        </>
      ) : null}
      <Hint>
        Um alerta por dado e por sensor a cada 6 horas, enquanto a leitura continuar fora da faixa.
      </Hint>
    </div>
  )
}
