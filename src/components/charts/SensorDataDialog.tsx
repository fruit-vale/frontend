import { useMemo, useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequest } from '@/hooks/use-request'
import { baixarCsv, slug } from '@/lib/download'
import { formatarDataHora, formatarNumero } from '@/lib/format'
import type { IntervaloSerie, RespostaLeituras, Serie } from '@/types/painel'

type Props = {
  open: boolean
  onClose: () => void
  /** ex.: "Temperatura — últimos 7 dias" */
  titulo: string
  /** médias já carregadas pelo gráfico */
  series: Serie[]
  unidade: string | null
  intervalo: IntervaloSerie
  /** busca as leituras individuais do mesmo tipo e período do gráfico */
  buscarLeituras: (signal: AbortSignal) => Promise<RespostaLeituras>
  /** muda quando o tipo/período mudam, para refazer a busca */
  chaveLeituras: string
}

type Aba = 'leituras' | 'medias'

const nomeSensor = (sensor: string, lote: string | null) =>
  lote ? `${sensor} · ${lote}` : sensor

/** Modal com as leituras recebidas (data e hora de cada uma) e as médias do gráfico. */
export function SensorDataDialog({
  open,
  onClose,
  titulo,
  series,
  unidade,
  intervalo,
  buscarLeituras,
  chaveLeituras,
}: Props) {
  const [aba, setAba] = useState<Aba>('leituras')

  // busca só enquanto aberto; reabrir recarrega (o período pode ter leituras novas)
  const { data: resposta, error, loading } = useRequest(buscarLeituras, {
    key: `${chaveLeituras}:${open}`,
    enabled: open,
    errorPrefix: 'Não foi possível carregar as leituras',
  })

  const medias = useMemo(() => {
    const instantes = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.instante)))]
      .sort()
      .reverse()
    const porSerie = series.map((s) => new Map(s.pontos.map((p) => [p.instante, p.valor])))
    return { instantes, porSerie }
  }, [series])

  const un = unidade ? ` ${unidade}` : ''
  const rotuloMedia = intervalo === 'hour' ? 'Médias por hora' : 'Médias por dia'
  const fmtInstante = (iso: string) =>
    new Date(iso).toLocaleString(
      'pt-BR',
      intervalo === 'hour'
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' },
    )

  const leituras = resposta?.leituras ?? []

  function exportar() {
    const base = slug(titulo)
    if (aba === 'leituras' && resposta)
      baixarCsv(
        `leituras-${base}.csv`,
        ['data_hora', 'sensor', 'lote', 'dado', 'valor', 'unidade'],
        resposta.leituras.map((l) => [
          formatarDataHora(l.data_hora),
          l.sensor,
          l.lote ?? '',
          l.dado,
          l.valor,
          l.unidade ?? '',
        ]),
      )
    else
      baixarCsv(
        `medias-${base}.csv`,
        [intervalo === 'hour' ? 'hora' : 'dia', ...series.map((s) => nomeSensor(s.sensor, s.lote))],
        medias.instantes.map((i) => [fmtInstante(i), ...medias.porSerie.map((m) => m.get(i) ?? '')]),
      )
  }

  return (
    <AppDialog open={open} onClose={onClose} title={titulo} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
            <TabsList>
              <TabsTrigger value="leituras">
                Leituras{resposta ? ` (${leituras.length.toLocaleString('pt-BR')})` : ''}
              </TabsTrigger>
              <TabsTrigger value="medias">
                {rotuloMedia} ({medias.instantes.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="outline"
            onClick={exportar}
            disabled={aba === 'leituras' ? !leituras.length : !medias.instantes.length}
          >
            <DownloadIcon />
            Baixar CSV
          </Button>
        </div>

        {aba === 'leituras' && (
          <>
            <ErrorMessage message={error} />
            {loading && <Skeleton className="h-40 w-full" />}
            {resposta?.cortado && (
              <Hint>
                Mostrando as {resposta.limite.toLocaleString('pt-BR')} leituras mais recentes
                do período.
              </Hint>
            )}
            {resposta && leituras.length === 0 && (
              <EmptyState>Nenhuma leitura neste período.</EmptyState>
            )}
            {leituras.length > 0 && (
              <div className="max-h-[50vh] overflow-auto rounded-xl border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Data e hora</TableHead>
                      <TableHead>Sensor</TableHead>
                      <TableHead>Dado</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leituras.map((l, i) => (
                      <TableRow key={`${l.sensor}-${l.data_hora}-${i}`}>
                        <TableCell>{formatarDataHora(l.data_hora)}</TableCell>
                        <TableCell>{nomeSensor(l.sensor, l.lote)}</TableCell>
                        <TableCell>{l.dado}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatarNumero(l.valor)}
                          {l.unidade ? ` ${l.unidade}` : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {aba === 'medias' &&
          (medias.instantes.length === 0 ? (
            <EmptyState>Nenhuma leitura neste período.</EmptyState>
          ) : (
            <div className="max-h-[50vh] overflow-auto rounded-xl border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>{intervalo === 'hour' ? 'Hora' : 'Dia'}</TableHead>
                    {series.map((s) => (
                      <TableHead key={s.sensor} className="text-right">
                        {nomeSensor(s.sensor, s.lote)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medias.instantes.map((instante) => (
                    <TableRow key={instante}>
                      <TableCell>{fmtInstante(instante)}</TableCell>
                      {medias.porSerie.map((m, i) => {
                        const v = m.get(instante)
                        return (
                          <TableCell key={series[i].sensor} className="text-right tabular-nums">
                            {v === undefined ? '—' : `${formatarNumero(v)}${un}`}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
      </div>
    </AppDialog>
  )
}
