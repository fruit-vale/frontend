import { useState } from 'react'
import {
  CalendarCheckIcon,
  CircleDollarSignIcon,
  Loader2Icon,
  MinusIcon,
  RefreshCwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { PrevisaoPrecoChart } from '@/components/charts/PrevisaoPrecoChart'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarDataHora } from '@/lib/format'
import { culturasService, previsaoPrecoService } from '@/services'
import { nomeCultura } from '@/types/cultura'
import type { SeriePreco, TendenciaPreco } from '@/types/previsao-preco'

/** Frutas que o modelo cobre hoje (o nome da cultura começa com uma delas). */
const FRUTAS = ['manga', 'uva']
const fruta = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0].toLowerCase()

const TENDENCIA: Record<TendenciaPreco, { rotulo: string; tom: Tone; icone: React.ReactNode }> = {
  alta: { rotulo: 'Tendência de alta', tom: 'success', icone: <TrendingUpIcon /> },
  queda: { rotulo: 'Tendência de queda', tom: 'warning', icone: <TrendingDownIcon /> },
  estavel: { rotulo: 'Preço estável', tom: 'neutral', icone: <MinusIcon /> },
}

const reais = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number | null | undefined) =>
  v == null ? '—' : `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export default function PrevisaoPrecoPage() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const [culturaId, setCulturaId] = useState('')
  const [serieId, setSerieId] = useState('')
  const [treinando, setTreinando] = useState(false)

  const culturas = useRequest((s) => culturasService.listar(s), {
    errorPrefix: 'Não foi possível carregar as culturas',
    cacheKey: 'culturas',
  })
  const lista = (culturas.data ?? []).filter((c) => FRUTAS.includes(fruta(c.nome)))
  const cultura = lista.find((c) => c.id === Number(culturaId)) ?? lista[0]
  const id = cultura?.id

  const previsao = useRequest((s) => previsaoPrecoService.daCultura(id!, s), {
    key: id,
    enabled: id !== undefined,
    errorPrefix: 'Não foi possível carregar a previsão de preço',
    cacheKey: 'previsao-preco',
  })
  const series = previsao.data?.series ?? []
  const serie = series.find((s) => s.id === serieId) ?? series[0]

  async function treinar() {
    setTreinando(true)
    try {
      const r = await previsaoPrecoService.treinar()
      toast.success(
        r.iniciado
          ? 'Treino iniciado. Leva cerca de 2 minutos; recarregue a página depois.'
          : 'Já existe um treino em andamento.',
      )
    } catch (e) {
      toast.error(getErrorMessage(e, 'Não foi possível iniciar o treino.'))
    } finally {
      setTreinando(false)
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Inteligência de mercado"
        title="Previsão de Preço"
        description="Para onde o preço da uva e da manga deve ir nas próximas 4 a 12 semanas, para escolher quando colher e vender."
      />

      <ErrorMessage message={culturas.error || previsao.error} />

      {culturas.loading && !culturas.data ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <EmptyState>
          A previsão de preço cobre uva e manga. Cadastre uma cultura dessas frutas (por exemplo,
          Manga Tommy Atkins) para ver a previsão.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              aria-label="Cultura"
              value={String(id ?? '')}
              onValueChange={(v) => {
                setCulturaId(v)
                setSerieId('')
              }}
              options={lista.map((c) => ({ value: String(c.id), label: nomeCultura(c) }))}
              className="w-64"
            />
            {series.length > 1 && (
              <SelectField
                aria-label="Série de preço"
                value={serie?.id ?? ''}
                onValueChange={setSerieId}
                options={series.map((s) => ({ value: s.id, label: s.nome }))}
                className="w-80"
              />
            )}
          </div>

          {previsao.loading && !previsao.data ? (
            <Skeleton className="h-96" />
          ) : !previsao.data ? null : !serie ? (
            <EmptyState>Ainda não há previsão para esta fruta. O modelo treina uma vez por dia.</EmptyState>
          ) : (
            <PainelSerie serie={serie} />
          )}
        </>
      )}

      {admin && (
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-4 text-sm text-muted-foreground">
          <span>O modelo retreina sozinho uma vez por dia, com os dados mais recentes das fontes.</span>
          <Button variant="outline" onClick={treinar} disabled={treinando}>
            {treinando ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
            Retreinar agora
          </Button>
        </footer>
      )}
    </section>
  )
}

function PainelSerie({ serie }: { serie: SeriePreco }) {
  if (!serie.previsoes.length || !serie.ultimo || !serie.tendencia)
    return (
      <EmptyState>
        Sem previsão para "{serie.nome}" no momento
        {serie.erro ? ` (${serie.erro})` : ''}. Isso acontece quando a fonte de preço está fora do
        ar ou ainda não foi importada.
      </EmptyState>
    )

  const mensal = serie.frequencia === 'mensal'
  const t = TENDENCIA[serie.tendencia]
  const primeira = serie.previsoes[0]
  const ultima = serie.previsoes[serie.previsoes.length - 1]
  const unidadeCurta = 'R$/kg'

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={t.tom} className="[&_svg]:size-3.5">
              {t.icone}
              {t.rotulo}
            </StatusBadge>
            <span className="text-sm text-muted-foreground">
              média prevista {pct(serie.variacao_media_pct)} em relação a hoje
            </span>
          </div>
          <p className="text-base">{serie.recomendacao}</p>
          {serie.confiavel === false && (
            <p className="flex items-start gap-2 text-sm text-warning">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Nesta série, o modelo ainda não errou menos que supor o preço parado. Use como referência,
              não como certeza.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CircleDollarSignIcon />}
          label={`Preço atual · ${formatarData(serie.ultimo.data)}`}
          value={`${reais(serie.ultimo.preco)}/kg`}
          hint={serie.unidade}
        />
        <StatCard
          icon={<TrendingUpIcon />}
          label={`Em ${primeira.horizonte_semanas} semanas`}
          value={`${reais(primeira.preco)}/kg`}
          hint={`${pct(primeira.variacao_pct)} · faixa ${reais(primeira.minimo)} a ${reais(primeira.maximo)}`}
        />
        <StatCard
          icon={<TrendingUpIcon />}
          label={`Em ${ultima.horizonte_semanas} semanas`}
          value={`${reais(ultima.preco)}/kg`}
          hint={`${pct(ultima.variacao_pct)} · faixa ${reais(ultima.minimo)} a ${reais(ultima.maximo)}`}
        />
        {serie.melhor_janela && (
          <StatCard
            icon={<CalendarCheckIcon />}
            label="Melhor preço previsto"
            value={`${reais(serie.melhor_janela.preco)}/kg`}
            hint={`por volta de ${formatarData(serie.melhor_janela.data)}`}
          />
        )}
      </div>

      <section className="space-y-3">
        <SectionHeader
          title={serie.nome}
          description={`${mensal ? 'Preço mensal' : 'Preço semanal'} dos últimos 2 anos e a previsão. A faixa mostra onde o preço caiu 80% das vezes no teste com dados passados.`}
        />
        <Card>
          <CardContent>
            <PrevisaoPrecoChart
              historico={serie.historico ?? []}
              previsoes={serie.previsoes}
              unidade={unidadeCurta}
              titulo={serie.nome}
              mensal={mensal}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title={mensal ? 'Previsão mês a mês' : 'Previsão semana a semana'}
          description="Erro médio: quanto o modelo errou, em média, no teste com os 20% mais recentes do histórico (treino com os 80% anteriores)."
        />
        <div className="overflow-x-auto rounded-xl border">
          {/* no celular a tabela rola de lado em vez de quebrar a faixa em 3 linhas */}
          <table className="w-full text-sm whitespace-nowrap">
            <caption className="sr-only">Preço previsto por horizonte</caption>
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Daqui a</th>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 text-right font-medium">Previsto</th>
                <th className="px-3 py-2 text-right font-medium">Faixa provável</th>
                <th className="px-3 py-2 text-right font-medium">Variação</th>
                <th className="px-3 py-2 text-right font-medium">Erro médio</th>
              </tr>
            </thead>
            <tbody>
              {serie.previsoes.map((p) => (
                <tr key={p.data} className="border-t">
                  <td className="px-3 py-2">{p.horizonte_semanas} semanas</td>
                  <td className="px-3 py-2">{formatarData(p.data)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{reais(p.preco)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {reais(p.minimo)} a {reais(p.maximo)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct(p.variacao_pct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {p.erro_medio_pct == null ? '—' : `±${p.erro_medio_pct.toLocaleString('pt-BR')}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Hint>
        Fonte: {serie.fonte} ({serie.unidade}). Modelo XGBoost com preços passados, sazonalidade,
        dólar, volume exportado e, quando há histórico, os sensores.
        {serie.treinado_em && ` Atualizado em ${formatarDataHora(serie.treinado_em)}.`}
      </Hint>
    </div>
  )
}
