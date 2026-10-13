import { useState } from 'react'
import { SensorChart } from '@/components/charts/SensorChart'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PeriodoFiltro } from '@/components/shared/PeriodoFiltro'
import { SelectField } from '@/components/shared/SelectField'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import {
  contarForaDaFaixa,
  faixaDaCultura,
  mediaPorInstante,
  resumir,
} from '@/lib/estatisticas'
import { chavePeriodo, descreverPeriodo } from '@/lib/periodo'
import { painelService, type PeriodoPainel } from '@/services/painel.service'
import { nomeCultura } from '@/types/cultura'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from '@/types/sensor'
import { fmt, unidadeDo, type DadosAnalise } from './contexto'

// a paleta do gráfico tem 8 cores
const LOTES_MAX = 8

/** Vários lotes no mesmo gráfico, para um dado; com média, mínimo, máximo e fora da faixa. */
export function ComparacaoLotes({ dados }: { dados: DadosAnalise }) {
  const tipos = dados.tipos.map((t) => t.tipo)
  const [tipo, setTipo] = useState<TipoMedida | null>(
    tipos.includes('TEMPERATURA') ? 'TEMPERATURA' : (tipos[0] ?? null),
  )
  const [periodo, setPeriodo] = useState<PeriodoPainel>(7)
  // começa com até 3 lotes em cultivo
  const [ids, setIds] = useState<number[]>(() =>
    dados.lotes
      .filter((l) => l.situacao === 'EM_CULTIVO')
      .slice(0, 3)
      .map((l) => l.id),
  )
  const escolhidos = dados.lotes.filter((l) => ids.includes(l.id))

  const { data, error, loading } = useRequest(
    async (signal) => {
      const respostas = await Promise.all(
        escolhidos.map((l) => painelService.serie(tipo!, periodo, { loteId: l.id }, signal)),
      )
      return respostas.map((r, i) => ({ lote: escolhidos[i], resposta: r }))
    },
    {
      key: `${tipo}-${chavePeriodo(periodo)}-${ids.join(',')}`,
      enabled: tipo !== null && escolhidos.length > 0,
      errorPrefix: 'Não foi possível carregar as leituras',
    },
  )

  function alternar(id: number, marcado: boolean) {
    setIds((atuais) =>
      marcado ? [...atuais, id].slice(-LOTES_MAX) : atuais.filter((i) => i !== id),
    )
  }

  if (!tipo)
    return (
      <EmptyState>
        Nenhum sensor enviou leituras ainda. Assim que os sensores dos lotes mandarem dados, a
        comparação aparece aqui.
      </EmptyState>
    )
  if (dados.lotes.length === 0)
    return <EmptyState>Nenhum lote cadastrado na empresa ainda.</EmptyState>

  const unidade = unidadeDo(dados, tipo)
  // uma linha por lote: a média dos sensores dele em cada instante
  const linhas =
    data?.map(({ lote, resposta }) => {
      const serie = mediaPorInstante(resposta.series, lote.nome_identificacao)
      const valores = serie.pontos.map((p) => p.valor)
      const faixa = faixaDaCultura(dados.culturas.get(lote.cultura.id), tipo)
      return {
        lote,
        serie,
        resumo: resumir(valores),
        fora: faixa ? contarForaDaFaixa(valores, faixa) : null,
        faixa,
      }
    }) ?? []
  const comPontos = linhas.filter((l) => l.serie.pontos.length > 0)
  const intervalo = data?.[0]?.resposta.intervalo ?? 'hour'
  const porPonto = intervalo === 'hour' ? 'h' : 'dias'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          aria-label="Dado"
          value={tipo}
          onValueChange={(v) => setTipo(v as TipoMedida)}
          options={tipos.map((t) => ({ value: t, label: TIPO_MEDIDA_LABELS[t] }))}
          className="w-44"
        />
        <PeriodoFiltro value={periodo} onChange={setPeriodo} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Lotes no gráfico <span className="text-muted-foreground">(até {LOTES_MAX})</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {dados.lotes.map((l) => (
            <Label key={l.id} className="cursor-pointer text-sm font-normal">
              <Checkbox
                checked={ids.includes(l.id)}
                onCheckedChange={(marcado) => alternar(l.id, marcado)}
              />
              {l.nome_identificacao}
              <span className="text-muted-foreground">· {l.propriedade.nome}</span>
            </Label>
          ))}
        </div>
      </fieldset>

      <ErrorMessage message={error} />

      {escolhidos.length === 0 ? (
        <EmptyState>Marque pelo menos um lote para comparar.</EmptyState>
      ) : loading && !data ? (
        <Skeleton className="h-80" />
      ) : (
        <>
          <Card>
            <CardContent>
              {comPontos.length === 0 ? (
                <EmptyState>
                  Nenhum dos lotes escolhidos tem leituras de {TIPO_MEDIDA_LABELS[tipo].toLowerCase()} em{' '}
                  {descreverPeriodo(periodo)}. Tente um período maior ou outros lotes.
                </EmptyState>
              ) : (
                <SensorChart
                  series={comPontos.map((l) => l.serie)}
                  unidade={unidade}
                  intervalo={intervalo}
                  titulo={`${TIPO_MEDIDA_LABELS[tipo]} por lote`}
                  dias={typeof periodo === 'number' ? periodo : undefined}
                />
              )}
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Média, mínimo, máximo e tempo fora da faixa ideal de cada lote
              </caption>
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Lote</th>
                  <th className="px-3 py-2 font-medium">Cultura</th>
                  <th className="px-3 py-2 text-right font-medium">Média</th>
                  <th className="px-3 py-2 text-right font-medium">Mínima</th>
                  <th className="px-3 py-2 text-right font-medium">Máxima</th>
                  <th className="px-3 py-2 font-medium">Fora da faixa ideal</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ lote, resumo, fora, faixa }) => (
                  <tr key={lote.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{lote.nome_identificacao}</td>
                    <td className="px-3 py-2 text-muted-foreground">{nomeCultura(lote.cultura)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.media, unidade)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.min, unidade)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(resumo?.max, unidade)}</td>
                    <td className="px-3 py-2">
                      {!faixa
                        ? 'Cultura sem faixa ideal'
                        : !fora
                          ? 'Sem leituras'
                          : `${fora.percentual.toLocaleString('pt-BR')}% (${fora.acima + fora.abaixo} de ${fora.total} ${porPonto}; ${fora.acima} acima, ${fora.abaixo} abaixo)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Hint>
            Valores calculados sobre as médias {intervalo === 'hour' ? 'por hora' : 'por dia'} dos
            sensores de cada lote em {descreverPeriodo(periodo)}. A faixa ideal é a cadastrada na
            cultura (temperatura e umidade do ar).
          </Hint>
        </>
      )}
    </div>
  )
}
