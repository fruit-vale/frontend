import { useState } from 'react'
import {
  CalendarClockIcon,
  MapPinIcon,
  SproutIcon,
  ThermometerSunIcon,
  TrendingUpIcon,
  WheatIcon,
} from 'lucide-react'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarHectares, formatarNumero, plural } from '@/lib/format'
import { lotesService, previsaoService } from '@/services'
import { nomeCultura } from '@/types/cultura'
import type { Lote } from '@/types/lote'
import type { Confianca, MotivoSemGrausDia, PrevisaoLote } from '@/types/previsao'

const DIA_MS = 86_400_000
const TODAS = 'todas'

const JANELAS = [
  { value: TODAS, label: 'Qualquer data' },
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: '7', label: 'Próximos 7 dias' },
  { value: '30', label: 'Próximos 30 dias' },
  { value: 'sem', label: 'Sem previsão' },
]

const CONFIANCA: Record<Confianca, { rotulo: string; tom: Tone }> = {
  alta: { rotulo: 'Confiança alta', tom: 'success' },
  media: { rotulo: 'Confiança média', tom: 'warning' },
  baixa: { rotulo: 'Confiança baixa', tom: 'neutral' },
}

const MOTIVO: Record<MotivoSemGrausDia, string> = {
  sem_parametros:
    'Para prever pela temperatura, informe a temperatura base e os graus-dia da cultura (em Culturas).',
  sem_plantio: 'Para prever pela temperatura, informe a data de plantio do lote.',
  sem_leituras: 'Nenhum sensor deste lote mediu temperatura desde o plantio.',
}

/** "2026-10-09" ao meio-dia local: a diferença em dias não sofre com o fuso. */
const dia = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
const diasEntre = (de: number, ate: number) => Math.round((ate - de) / DIA_MS)

type Previsao = {
  lote: Lote
  temperatura: PrevisaoLote | undefined
  /** data usada na ordem, nos filtros e nos números: a da temperatura, se houver */
  data: string | null
  /** dias até a colheita; negativo = atrasada; null = sem previsão */
  faltam: number | null
  /** ciclo pela data informada no lote (plantio → previsão) */
  progresso: number | null
  diasDeCiclo: number | null
  cicloTotal: number | null
}

function calcular(lote: Lote, temperatura: PrevisaoLote | undefined, hoje: number): Previsao {
  const data = temperatura?.graus_dia?.previsao ?? lote.previsao_colheita
  const faltam = data ? diasEntre(hoje, dia(data)) : null
  const base = { lote, temperatura, data, faltam }
  const previsao = lote.previsao_colheita ? dia(lote.previsao_colheita) : null
  const plantio = lote.data_plantio ? dia(lote.data_plantio) : null
  if (previsao === null || plantio === null || previsao <= plantio)
    return { ...base, progresso: null, diasDeCiclo: null, cicloTotal: null }
  const cicloTotal = diasEntre(plantio, previsao)
  const diasDeCiclo = Math.max(0, diasEntre(plantio, hoje))
  return {
    ...base,
    progresso: Math.min(100, Math.round((diasDeCiclo / cicloTotal) * 100)),
    diasDeCiclo,
    cicloTotal,
  }
}

function situacao(faltam: number | null): { rotulo: string; tom: Tone } {
  if (faltam === null) return { rotulo: 'Sem previsão', tom: 'neutral' }
  if (faltam < 0)
    return { rotulo: `Atrasada há ${-faltam} ${plural(-faltam, 'dia', 'dias')}`, tom: 'danger' }
  if (faltam === 0) return { rotulo: 'Colheita hoje', tom: 'warning' }
  if (faltam <= 7)
    return { rotulo: `Em ${faltam} ${plural(faltam, 'dia', 'dias')}`, tom: 'warning' }
  return { rotulo: `Em ${faltam} dias`, tom: 'primary' }
}

function naJanela(p: Previsao, janela: string) {
  if (janela === TODAS) return true
  if (janela === 'sem') return p.faltam === null
  if (p.faltam === null) return false
  if (janela === 'atrasadas') return p.faltam < 0
  return p.faltam >= 0 && p.faltam <= Number(janela)
}

// atrasadas e mais próximas primeiro; sem previsão no fim
const porData = (a: Previsao, b: Previsao) =>
  (a.faltam ?? Infinity) - (b.faltam ?? Infinity) ||
  a.lote.nome_identificacao.localeCompare(b.lote.nome_identificacao, 'pt-BR')

/** "3 dias antes da data informada" / "na data informada". */
function comparar(temperatura: string, informada: string | null) {
  if (!informada) return null
  const d = diasEntre(dia(informada), dia(temperatura))
  if (d === 0) return 'na mesma data informada no lote'
  return `${Math.abs(d)} ${plural(Math.abs(d), 'dia', 'dias')} ${d < 0 ? 'antes' : 'depois'} da data informada no lote`
}

function BlocoTemperatura({ previsao }: { previsao: Previsao }) {
  const { temperatura, lote } = previsao
  if (!temperatura) return null
  const g = temperatura.graus_dia
  if (!g) return <Hint>{MOTIVO[temperatura.motivo ?? 'sem_leituras']}</Hint>

  const confianca = CONFIANCA[g.confianca]
  const comparacao = g.previsao ? comparar(g.previsao, lote.previsao_colheita) : null
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium [&_svg]:size-4">
          <ThermometerSunIcon className="text-warning" />
          {g.atingido
            ? 'Graus-dia já atingidos: pronto para colher'
            : g.previsao
              ? `Pela temperatura: ${formatarData(g.previsao)}`
              : 'Pela temperatura: frio abaixo da base, sem data'}
        </span>
        <StatusBadge tone={confianca.tom}>{confianca.rotulo}</StatusBadge>
      </div>
      {comparacao && !g.atingido && (
        <p className="text-xs text-muted-foreground">{comparacao}</p>
      )}
      <Progress value={g.progresso} aria-label={`${g.progresso}% dos graus-dia`} />
      <p className="text-xs text-muted-foreground">
        {formatarNumero(g.acumulado, 0)} de {formatarNumero(g.necessario, 0)} graus-dia (
        {g.progresso}%) · ritmo de {formatarNumero(g.ritmo, 1)} por dia · {g.dias_medidos} de{' '}
        {g.dias_ciclo} {plural(g.dias_ciclo, 'dia', 'dias')} com leitura
      </p>
    </div>
  )
}

function LinhaPrevisao({ previsao, mostrarEmpresa }: { previsao: Previsao; mostrarEmpresa: boolean }) {
  const { lote, faltam, progresso, diasDeCiclo, cicloTotal } = previsao
  const estado = situacao(faltam)
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <strong className="block truncate">{lote.nome_identificacao}</strong>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
              <SproutIcon />
              <span className="truncate">{nomeCultura(lote.cultura)}</span>
              <MapPinIcon />
              <span className="truncate">
                {lote.propriedade.nome}
                {mostrarEmpresa && ` · ${lote.empresa.razao_social}`}
              </span>
            </span>
          </div>
          <StatusBadge tone={estado.tom} className="shrink-0">
            {estado.rotulo}
          </StatusBadge>
        </div>

        {progresso !== null && (
          <div className="space-y-1">
            <Progress value={progresso} aria-label={`Ciclo ${progresso}% concluído`} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Dia {diasDeCiclo} · ciclo de {cicloTotal} dias
              </span>
              <span>{progresso}%</span>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Plantio</dt>
            <dd>{formatarData(lote.data_plantio)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Data informada</dt>
            <dd
              className={
                previsao.temperatura?.graus_dia?.previsao === undefined &&
                faltam !== null &&
                faltam < 0
                  ? 'text-destructive'
                  : undefined
              }
            >
              {formatarData(lote.previsao_colheita)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Área</dt>
            <dd>{formatarHectares(lote.area_ha)}</dd>
          </div>
        </dl>

        <BlocoTemperatura previsao={previsao} />
      </CardContent>
    </Card>
  )
}

export default function PrevisaoPage() {
  const { user } = useAuth()
  const [cultura, setCultura] = useState(TODAS)
  const [janela, setJanela] = useState(TODAS)

  const { data: lotes = [], error, loading } = useRequest((signal) => lotesService.listar(signal), {
    errorPrefix: 'Não foi possível carregar os lotes',
    cacheKey: 'lotes',
  })
  // sem a previsão pela temperatura (ex.: API antiga), a tela segue com as datas dos lotes
  const { data: porTemperatura, error: erroTemperatura } = useRequest(
    (signal) => previsaoService.listar(signal),
    { cacheKey: 'previsao' },
  )
  const temperaturas = new Map((porTemperatura ?? []).map((p) => [p.lote_id, p]))

  // meio-dia de hoje, como as datas dos lotes
  const hoje = dia(new Date().toLocaleDateString('sv-SE'))
  const emCultivo = lotes
    .filter((l) => l.situacao === 'EM_CULTIVO')
    .map((l) => calcular(l, temperaturas.get(l.id), hoje))
  const culturas = [...new Map(emCultivo.map((p) => [p.lote.cultura.id, p.lote.cultura])).values()].sort(
    (a, b) => nomeCultura(a).localeCompare(nomeCultura(b), 'pt-BR'),
  )
  const visiveis = emCultivo
    .filter((p) => cultura === TODAS || p.lote.cultura.id === Number(cultura))
    .filter((p) => naJanela(p, janela))
    .sort(porData)

  const comPrevisao = emCultivo.filter((p) => p.faltam !== null).length
  const pelaTemperatura = emCultivo.filter((p) => p.temperatura?.graus_dia?.previsao).length
  const proximos7 = emCultivo.filter((p) => p.faltam !== null && p.faltam >= 0 && p.faltam <= 7).length
  const atrasadas = emCultivo.filter((p) => p.faltam !== null && p.faltam < 0).length
  const comProgresso = emCultivo.filter((p) => p.progresso !== null)
  const progressoMedio = comProgresso.length
    ? Math.round(comProgresso.reduce((s, p) => s + p.progresso!, 0) / comProgresso.length)
    : null

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Planejamento agrícola"
        title="Previsão de Colheita"
        description="Quando cada lote em cultivo deve ser colhido, ajustado pela temperatura medida pelos sensores."
      />

      <ErrorMessage message={error} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<WheatIcon />}
          value={emCultivo.length}
          label="Lotes em cultivo"
          hint={`${comPrevisao} com previsão · ${pelaTemperatura} pela temperatura`}
          loading={loading}
        />
        <StatCard
          icon={<CalendarClockIcon />}
          value={proximos7}
          label="Colheita nos próximos 7 dias"
          hint={
            atrasadas > 0
              ? `${atrasadas} ${plural(atrasadas, 'colheita atrasada', 'colheitas atrasadas')}`
              : undefined
          }
          loading={loading}
        />
        <StatCard
          icon={<TrendingUpIcon />}
          value={progressoMedio === null ? '—' : `${progressoMedio}%`}
          label="Progresso médio do ciclo"
          hint={progressoMedio === null ? 'Informe plantio e previsão nos lotes' : undefined}
          loading={loading}
        />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Próximas colheitas"
          description="Atrasadas e mais próximas primeiro."
          actions={
            <div className="flex flex-wrap gap-2">
              <SelectField
                aria-label="Filtrar por cultura"
                value={cultura}
                onValueChange={setCultura}
                options={[
                  { value: TODAS, label: 'Todas as culturas' },
                  ...culturas.map((c) => ({ value: String(c.id), label: nomeCultura(c) })),
                ]}
                className="w-48"
              />
              <SelectField
                aria-label="Filtrar por data"
                value={janela}
                onValueChange={setJanela}
                options={JANELAS}
                className="w-44"
              />
            </div>
          }
        />

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : emCultivo.length === 0 ? (
          <EmptyState>Nenhum lote em cultivo no momento.</EmptyState>
        ) : visiveis.length === 0 ? (
          <EmptyState>Nenhuma colheita com estes filtros.</EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visiveis.map((p) => (
              <LinhaPrevisao
                key={p.lote.id}
                previsao={p}
                mostrarEmpresa={user?.role === 'administrador'}
              />
            ))}
          </div>
        )}

        <Hint>
          A data informada é a do lote ou, sem ela, o plantio somado ao ciclo médio da cultura.
          Quando a cultura tem temperatura base e graus-dia cadastrados, a previsão usa a
          temperatura dos sensores do lote: cada dia soma (mínima + máxima) ÷ 2 − temperatura
          base, e os dias sem leitura entram pela média dos medidos.
          {erroTemperatura && ' A previsão pela temperatura está indisponível no momento.'}
        </Hint>
      </section>
    </section>
  )
}
