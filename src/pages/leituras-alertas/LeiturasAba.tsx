import { useState } from 'react'
import { ActivityIcon, CpuIcon, FileSpreadsheetIcon, RadioTowerIcon, WifiOffIcon } from 'lucide-react'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PeriodoFiltro } from '@/components/shared/PeriodoFiltro'
import { SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { baixarCsv } from '@/lib/download'
import { formatarDataHora, formatarNumero, plural } from '@/lib/format'
import { chavePeriodo, descreverPeriodo } from '@/lib/periodo'
import { painelService, type PeriodoPainel } from '@/services/painel.service'
import type { Lote } from '@/types/lote'
import type { Painel } from '@/types/painel'
import { TIPO_MEDIDA_LABELS, type Sensor, type TipoMedida } from '@/types/sensor'

const TODOS = 'todos'
// sem leitura há mais que isso, o sensor ativo pede atenção
const SEM_LEITURA_H = 6
const HORA_MS = 3_600_000

function tempoSemLeitura(ultima: string | null, agora: number) {
  if (!ultima) return 'Nunca enviou leitura'
  const horas = Math.floor((agora - new Date(ultima).getTime()) / HORA_MS)
  if (horas < 48) return `Sem leitura há ${horas} ${plural(horas, 'hora', 'horas')}`
  const dias = Math.floor(horas / 24)
  return `Sem leitura há ${dias} dias`
}

type Props = {
  lotes: Lote[]
  tipos: Painel['tipos']
  /** null: a API não deixou listar (ex.: versão antiga) */
  sensores: Sensor[] | null
  /** hora em que os sensores foram carregados (referência do "sem leitura há") */
  agora: number
}

export function LeiturasAba({ lotes, tipos, sensores, agora }: Props) {
  const [tipo, setTipo] = useState<TipoMedida | null>(
    tipos.some((t) => t.tipo === 'TEMPERATURA') ? 'TEMPERATURA' : (tipos[0]?.tipo ?? null),
  )
  const [periodo, setPeriodo] = useState<PeriodoPainel>(1)
  const [propriedadeId, setPropriedadeId] = useState(TODOS)
  const [loteId, setLoteId] = useState(TODOS)
  const [sensorId, setSensorId] = useState(TODOS)

  const propriedades = [...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values()]
  const lotesDaPropriedade = lotes.filter(
    (l) => propriedadeId === TODOS || l.propriedade.id === Number(propriedadeId),
  )
  const sensoresDoFiltro = (sensores ?? []).filter(
    (s) =>
      (propriedadeId === TODOS || s.propriedade.id === Number(propriedadeId)) &&
      (loteId === TODOS || s.lote?.id === Number(loteId)) &&
      (!tipo || s.medidas.some((m) => m.tipo === tipo)),
  )
  const atrasados = (sensores ?? []).filter(
    (s) =>
      s.status === 'ATIVO' &&
      (!s.ultima_leitura || agora - new Date(s.ultima_leitura).getTime() > SEM_LEITURA_H * HORA_MS),
  )

  const { data, error, loading } = useRequest(
    (signal) =>
      painelService.leituras(
        tipo!,
        periodo,
        {
          propriedadeId: propriedadeId === TODOS ? undefined : Number(propriedadeId),
          loteId: loteId === TODOS ? undefined : Number(loteId),
          sensorId: sensorId === TODOS ? undefined : Number(sensorId),
        },
        signal,
      ),
    {
      key: `${tipo}-${chavePeriodo(periodo)}-${propriedadeId}-${loteId}-${sensorId}`,
      enabled: tipo !== null,
      errorPrefix: 'Não foi possível carregar as leituras',
    },
  )
  // a lista paginada pede um id por item
  const leituras = (data?.leituras ?? []).map((l, i) => ({ ...l, id: i }))
  const sensoresComLeitura = new Set(leituras.map((l) => l.sensor)).size

  function exportar() {
    if (!tipo) return
    baixarCsv(
      `leituras-${tipo.toLowerCase()}-${chavePeriodo(periodo)}.csv`,
      ['Data e hora', 'Sensor', 'Lote', 'Dado', 'Valor', 'Unidade'],
      leituras.map((l) => [formatarDataHora(l.data_hora), l.sensor, l.lote ?? '', l.dado, l.valor, l.unidade ?? '']),
    )
  }

  return (
    <div className="space-y-6">
      {sensores === null ? (
        <Hint>A lista de sensores não está disponível para o seu perfil nesta versão da API.</Hint>
      ) : (
        atrasados.length > 0 && (
          <Card className="border-warning/40">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <WifiOffIcon className="size-5 text-warning" aria-hidden="true" />
                <h3 className="font-semibold">
                  {atrasados.length} {plural(atrasados.length, 'sensor ativo', 'sensores ativos')} sem leitura
                  recente
                </h3>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {atrasados.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">{s.codigo_sensor}</strong>
                      <small className="text-xs text-muted-foreground">
                        {s.lote?.nome ?? 'Sem lote'} · {s.propriedade.nome}
                      </small>
                    </span>
                    <StatusBadge tone="warning">{tempoSemLeitura(s.ultima_leitura, agora)}</StatusBadge>
                  </li>
                ))}
              </ul>
              <Hint>
                Ativos sem enviar nada há mais de {SEM_LEITURA_H} horas: confira a energia e o Wi-Fi da placa.
              </Hint>
            </CardContent>
          </Card>
        )
      )}

      {!tipo ? (
        <EmptyState>
          Nenhum sensor enviou leituras ainda. Assim que um sensor mandar a primeira leitura, ela
          aparece aqui.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              aria-label="Dado"
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as TipoMedida)
                setSensorId(TODOS)
              }}
              options={tipos.map((t) => ({ value: t.tipo, label: TIPO_MEDIDA_LABELS[t.tipo] }))}
              className="w-44"
            />
            <SelectField
              aria-label="Propriedade"
              value={propriedadeId}
              onValueChange={(v) => {
                setPropriedadeId(v)
                setLoteId(TODOS)
                setSensorId(TODOS)
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
              onValueChange={(v) => {
                setLoteId(v)
                setSensorId(TODOS)
              }}
              options={[
                { value: TODOS, label: 'Todos os lotes' },
                ...lotesDaPropriedade.map((l) => ({ value: String(l.id), label: l.nome_identificacao })),
              ]}
              className="w-44"
            />
            {sensores !== null && (
              <SelectField
                aria-label="Sensor"
                value={sensorId}
                onValueChange={setSensorId}
                options={[
                  { value: TODOS, label: 'Todos os sensores' },
                  ...sensoresDoFiltro.map((s) => ({ value: String(s.id), label: s.codigo_sensor })),
                ]}
                className="w-48"
              />
            )}
            <PeriodoFiltro value={periodo} onChange={setPeriodo} atalhos={[1, 7, 30]} />
          </div>

          <ErrorMessage message={error} />

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={<ActivityIcon />}
              label="Leituras no período"
              value={data?.cortado ? `${formatarNumero(leituras.length, 0)}+` : formatarNumero(leituras.length, 0)}
              loading={loading && !data}
            />
            <StatCard icon={<RadioTowerIcon />} label="Sensores com leitura" value={sensoresComLeitura} loading={loading && !data} />
            <StatCard
              icon={<CpuIcon />}
              label="Sensores ativos sem leitura recente"
              value={sensores === null ? '—' : atrasados.length}
            />
          </div>

          <section className="space-y-3">
            <SectionHeader
              title="Leituras"
              description={`${TIPO_MEDIDA_LABELS[tipo]} em ${descreverPeriodo(periodo)}, da mais recente para a mais antiga.`}
              actions={
                <Button variant="outline" onClick={exportar} disabled={!leituras.length}>
                  <FileSpreadsheetIcon />
                  Baixar CSV
                </Button>
              }
            />
            {loading && !data ? (
              <Skeleton className="h-48" />
            ) : leituras.length === 0 ? (
              <EmptyState>
                Nenhuma leitura de {TIPO_MEDIDA_LABELS[tipo].toLowerCase()} com estes filtros. Tente
                um período maior ou outro sensor.
              </EmptyState>
            ) : (
              <>
                {data?.cortado && (
                  <Hint>
                    Mostrando as {formatarNumero(data.limite, 0)} leituras mais recentes. Encurte o
                    período ou escolha um sensor para ver todas.
                  </Hint>
                )}
                <ListaPaginada
                  itens={leituras}
                  campos={(l) => [l.sensor, l.lote, l.dado]}
                  rotuloBusca="Buscar por sensor ou lote"
                  vazio="Nenhuma leitura com esta busca."
                  porPagina={15}
                  renderItem={(l) => (
                    <div className="grid grid-cols-[1fr_auto] gap-x-3 rounded-lg border px-3 py-2 text-sm sm:grid-cols-[11rem_1fr_auto]">
                      <span className="text-muted-foreground tabular-nums">{formatarDataHora(l.data_hora)}</span>
                      <span className="order-3 col-span-2 truncate sm:order-none sm:col-span-1">
                        {l.sensor}
                        {l.lote && <span className="text-muted-foreground"> · {l.lote}</span>}
                        <span className="text-muted-foreground"> · {l.dado}</span>
                      </span>
                      <strong className="text-right tabular-nums">
                        {formatarNumero(l.valor, 2)}
                        {l.unidade ? ` ${l.unidade}` : ''}
                      </strong>
                    </div>
                  )}
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
