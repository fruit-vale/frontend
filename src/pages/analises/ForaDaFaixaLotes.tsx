import { useState } from 'react'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { SelectField } from '@/components/shared/SelectField'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import {
  contarForaDaFaixa,
  faixaDaCultura,
  mediaPorInstante,
  type ForaDaFaixa,
} from '@/lib/estatisticas'
import { painelService } from '@/services'
import { nomeCultura } from '@/types/cultura'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from '@/types/sensor'
import type { DadosAnalise } from './contexto'

// até 7 dias a API devolve média por hora: dá para contar horas fora da faixa
const PERIODOS = [
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Últimos 7 dias' },
]
const DADOS_COM_FAIXA: TipoMedida[] = ['TEMPERATURA', 'UMIDADE']
// cada lote custa uma consulta por dado
const LOTES_MAX = 20

const tom = (p: number) => (p >= 25 ? 'danger' : p >= 5 ? 'warning' : 'success')

function Celula({ fora }: { fora: ForaDaFaixa | null | undefined }) {
  if (fora === undefined) return <span className="text-muted-foreground">Sem faixa na cultura</span>
  if (fora === null) return <span className="text-muted-foreground">Sem leituras</span>
  const horas = fora.acima + fora.abaixo
  return (
    <span className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={tom(fora.percentual)}>{fora.percentual.toLocaleString('pt-BR')}%</StatusBadge>
      <span className="text-xs text-muted-foreground">
        {horas} h de {fora.total} h · {fora.acima} acima, {fora.abaixo} abaixo
      </span>
    </span>
  )
}

/** Quanto tempo cada lote em cultivo passou fora da faixa ideal de temperatura e umidade. */
export function ForaDaFaixaLotes({ dados }: { dados: DadosAnalise }) {
  const [dias, setDias] = useState('7')
  const medidos = DADOS_COM_FAIXA.filter((t) => dados.tipos.some((x) => x.tipo === t))
  const lotes = dados.lotes
    .filter((l) => l.situacao === 'EM_CULTIVO')
    .filter((l) => medidos.some((t) => faixaDaCultura(dados.culturas.get(l.cultura.id), t)))
  const consultados = lotes.slice(0, LOTES_MAX)

  const { data, error, loading } = useRequest(
    (signal) =>
      Promise.all(
        consultados.map(async (lote) => {
          const cultura = dados.culturas.get(lote.cultura.id)
          const porDado = await Promise.all(
            medidos.map(async (tipo) => {
              const faixa = faixaDaCultura(cultura, tipo)
              if (!faixa) return [tipo, undefined] as const
              const r = await painelService.serie(tipo, Number(dias), { loteId: lote.id }, signal)
              const valores = mediaPorInstante(r.series, '').pontos.map((p) => p.valor)
              return [tipo, contarForaDaFaixa(valores, faixa)] as const
            }),
          )
          return { lote, porDado: new Map<TipoMedida, ForaDaFaixa | null | undefined>(porDado) }
        }),
      ),
    {
      key: `${dias}-${consultados.map((l) => l.id).join(',')}`,
      enabled: consultados.length > 0,
      errorPrefix: 'Não foi possível carregar as leituras',
    },
  )

  if (medidos.length === 0)
    return (
      <EmptyState>
        Nenhum sensor mede temperatura ou umidade do ar ainda. São esses os dados com faixa ideal
        na cultura.
      </EmptyState>
    )
  if (lotes.length === 0)
    return (
      <EmptyState>
        Nenhum lote em cultivo tem cultura com faixa ideal. Cadastre a temperatura e a umidade
        mínimas e máximas em Culturas.
      </EmptyState>
    )

  // os que mais passaram tempo fora primeiro
  const pior = (m: Map<TipoMedida, ForaDaFaixa | null | undefined>) =>
    Math.max(0, ...[...m.values()].map((f) => f?.percentual ?? 0))
  const linhas = [...(data ?? [])].sort((a, b) => pior(b.porDado) - pior(a.porDado))

  return (
    <div className="space-y-4">
      <SelectField
        aria-label="Período"
        value={dias}
        onValueChange={setDias}
        options={PERIODOS}
        className="w-44"
      />
      <ErrorMessage message={error} />
      {loading && !data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">Tempo fora da faixa ideal por lote</caption>
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Lote</th>
                {medidos.map((t) => (
                  <th key={t} className="px-3 py-2 font-medium">
                    {TIPO_MEDIDA_LABELS[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ lote, porDado }) => (
                <tr key={lote.id} className="border-t">
                  <td className="px-3 py-2">
                    <strong className="block">{lote.nome_identificacao}</strong>
                    <small className="text-muted-foreground">
                      {nomeCultura(lote.cultura)} · {lote.propriedade.nome}
                    </small>
                  </td>
                  {medidos.map((t) => (
                    <td key={t} className="px-3 py-2">
                      <Celula fora={porDado.get(t)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Hint>
        Cada hora conta pela média dos sensores do lote naquela hora, comparada com a faixa ideal da
        cultura. Até 5% em verde, até 25% em amarelo, acima disso em vermelho.
        {lotes.length > LOTES_MAX && ` Mostrando os primeiros ${LOTES_MAX} de ${lotes.length} lotes.`}
      </Hint>
    </div>
  )
}
