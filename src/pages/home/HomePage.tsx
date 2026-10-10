import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckIcon,
  InfoIcon,
  MinusIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { SensorChart } from '@/components/charts/SensorChart'
import { SensorDataDialog } from '@/components/charts/SensorDataDialog'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { PrimeirosPassos } from '@/components/onboarding/PrimeirosPassos'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarNumero, plural } from '@/lib/format'
import { lotesService, painelService } from '@/services'
import type { StatusCultivo } from '@/types/painel'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from '@/types/sensor'

// status sempre com ícone + texto, nunca só a cor
const STATUS: Record<StatusCultivo, { rotulo: string; icone: LucideIcon; tom: Tone }> = {
  normal: { rotulo: 'Normal', icone: CheckIcon, tom: 'success' },
  atencao: { rotulo: 'Atenção', icone: TriangleAlertIcon, tom: 'warning' },
  sem_dados: { rotulo: 'Sem leituras recentes', icone: MinusIcon, tom: 'neutral' },
  sem_faixa: { rotulo: 'Sem faixa ideal', icone: InfoIcon, tom: 'primary' },
}

const PERIODOS = [
  { dias: 1, rotulo: 'Últimas 24 horas' },
  { dias: 7, rotulo: 'Últimos 7 dias' },
  { dias: 30, rotulo: 'Últimos 30 dias' },
]

const EMOJIS: [RegExp, string][] = [
  [/uva/i, '🍇'],
  [/manga/i, '🥭'],
  [/melancia/i, '🍉'],
  [/mel[aã]o/i, '🍈'],
  [/banana/i, '🍌'],
  [/coco/i, '🥥'],
  [/lim[aã]o/i, '🍋'],
  [/acerola|cereja/i, '🍒'],
  [/tomate/i, '🍅'],
]
const emoji = (nome: string) => EMOJIS.find(([re]) => re.test(nome))?.[1] ?? '🌱'

function quando(dias: number) {
  if (dias < 0) return `atrasada há ${-dias} ${plural(-dias, 'dia', 'dias')}`
  if (dias === 0) return 'prevista para hoje'
  if (dias === 1) return 'prevista para amanhã'
  return `em ${dias} dias`
}

function Numero({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string
  valor: React.ReactNode
  detalhe?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{rotulo}</span>
        <strong className="text-3xl font-semibold">{valor}</strong>
        {detalhe && <small className="text-xs text-muted-foreground">{detalhe}</small>}
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoMedida | null>(null)
  const [dias, setDias] = useState(7)
  const [tabelaAberta, setTabelaAberta] = useState(false)
  const [propriedadeId, setPropriedadeId] = useState('todas')
  const [loteId, setLoteId] = useState('todos')

  const { data: painel, error, loading } = useRequest(
    (signal) => painelService.obter(signal),
    { errorPrefix: 'Não foi possível carregar o painel' },
  )

  // começa pela temperatura, se algum sensor mede
  const tipos = painel?.tipos.map((t) => t.tipo) ?? []
  const tipo =
    tipoEscolhido && tipos.includes(tipoEscolhido)
      ? tipoEscolhido
      : tipos.includes('TEMPERATURA')
        ? 'TEMPERATURA'
        : (tipos[0] ?? null)

  // lotes do usuário alimentam os filtros de propriedade e lote
  const { data: lotes = [] } = useRequest((signal) => lotesService.listar(signal))
  const propriedades = [
    ...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const lotesDaPropriedade = lotes
    .filter((l) => propriedadeId === 'todas' || l.propriedade.id === Number(propriedadeId))
    .sort((a, b) => a.nome_identificacao.localeCompare(b.nome_identificacao, 'pt-BR'))
  const filtro = {
    propriedadeId: propriedadeId === 'todas' ? undefined : Number(propriedadeId),
    loteId: loteId === 'todos' ? undefined : Number(loteId),
  }

  const {
    data: serie,
    error: erroSerie,
    loading: carregandoSerie,
  } = useRequest(
    (signal) => painelService.serie(tipo!, dias, filtro, signal),
    {
      key: `${tipo}-${dias}-${propriedadeId}-${loteId}`,
      enabled: tipo !== null,
      errorPrefix: 'Não foi possível carregar as leituras',
    },
  )

  if (!user) return null
  const gestor = user.role === 'administrador' || user.role === 'produtor'
  const r = painel?.resumo
  const periodo = PERIODOS.find((p) => p.dias === dias)?.rotulo.toLowerCase() ?? ''

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${user.nome.split(' ')[0]}!`}
        description={
          user.role === 'administrador'
            ? 'Acompanhe as plantações de todas as empresas.'
            : `Acompanhe as plantações de ${user.empresa?.razao_social ?? 'sua empresa'}.`
        }
      />

      {/* guia de configuração: só o administrador cadastra empresas e propriedades */}
      {user.role === 'administrador' && <PrimeirosPassos />}

      <ErrorMessage message={error} />

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {r && (
        <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Numero rotulo="Propriedades ativas" valor={r.propriedades} />
          <Numero
            rotulo="Lotes em cultivo"
            valor={r.lotes_em_cultivo}
            detalhe={`${formatarNumero(r.area_em_cultivo_ha)} ha`}
          />
          <Numero
            rotulo="Sensores ativos"
            valor={r.sensores_ativos}
            detalhe={`de ${r.sensores_total} ${plural(r.sensores_total, 'cadastrado', 'cadastrados')}`}
          />
          <Numero rotulo="Leituras nas últimas 24 h" valor={r.leituras_24h.toLocaleString('pt-BR')} />
        </section>
      )}

      {painel && (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Cultivos"
            title="Culturas em cultivo"
            description="Situação pela leitura mais recente dos sensores, comparada à faixa ideal da cultura."
          />

          {painel.culturas.length === 0 ? (
            <EmptyState>
              Nenhum lote em cultivo.{' '}
              {gestor && (
                <Link to={ROUTES.cultivos} className="text-primary underline">
                  Cadastre um lote em Cultivos e Lotes.
                </Link>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {painel.culturas.map((c) => {
                const status = STATUS[c.status]
                return (
                  <Card key={c.cultura.id} size="sm">
                    <CardContent className="flex items-start gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl"
                        aria-hidden="true"
                      >
                        {emoji(c.cultura.nome)}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <strong className="block">
                          {c.cultura.nome}
                          {c.cultura.variedade && (
                            <span className="font-normal text-muted-foreground">
                              {' '}
                              — {c.cultura.variedade}
                            </span>
                          )}
                        </strong>
                        <small className="block text-xs text-muted-foreground">
                          {c.lotes} {plural(c.lotes, 'lote', 'lotes')}
                          {c.area_ha > 0 && ` · ${formatarNumero(c.area_ha)} ha`}
                        </small>
                        {c.motivo && (
                          <p className="pt-1 text-xs text-muted-foreground">{c.motivo}</p>
                        )}
                      </div>
                      <StatusBadge tone={status.tom} className="h-auto shrink-0 py-0.5">
                        <status.icone />
                        {status.rotulo}
                      </StatusBadge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      {painel && (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Monitoramento"
            title="Comportamento dos sensores"
            description={`Média ${serie?.intervalo === 'day' ? 'diária' : 'por hora'} de cada sensor.`}
            actions={
              painel.tipos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <SelectField
                    aria-label="Dado"
                    value={tipo ?? ''}
                    onValueChange={(v) => setTipoEscolhido(v as TipoMedida)}
                    options={painel.tipos.map((t) => ({
                      value: t.tipo,
                      label: TIPO_MEDIDA_LABELS[t.tipo],
                    }))}
                    className="w-44"
                  />
                  {propriedades.length > 0 && (
                    <>
                      <SelectField
                        aria-label="Propriedade"
                        value={propriedadeId}
                        onValueChange={(v) => {
                          setPropriedadeId(v)
                          setLoteId('todos') // o lote escolhido pode ser de outra propriedade
                        }}
                        options={[
                          { value: 'todas', label: 'Todas as propriedades' },
                          ...propriedades.map((p) => ({ value: String(p.id), label: p.nome })),
                        ]}
                        className="w-52"
                      />
                      <SelectField
                        aria-label="Lote"
                        value={loteId}
                        onValueChange={setLoteId}
                        options={[
                          { value: 'todos', label: 'Todos os lotes' },
                          ...lotesDaPropriedade.map((l) => ({
                            value: String(l.id),
                            label: l.nome_identificacao,
                          })),
                        ]}
                        className="w-44"
                      />
                    </>
                  )}
                  <SelectField
                    aria-label="Período"
                    value={String(dias)}
                    onValueChange={(v) => setDias(Number(v))}
                    options={PERIODOS.map((p) => ({ value: String(p.dias), label: p.rotulo }))}
                    className="w-48"
                  />
                </div>
              )
            }
          />

          <Card>
            <CardContent>
              {painel.tipos.length === 0 ? (
                <EmptyState>
                  Nenhum sensor com dados configurados ainda.{' '}
                  {gestor && (
                    <Link to={ROUTES.sensores} className="text-primary underline">
                      Cadastre um sensor em Sensores.
                    </Link>
                  )}
                </EmptyState>
              ) : erroSerie ? (
                <ErrorMessage message={erroSerie} />
              ) : carregandoSerie || !serie ? (
                <Hint>Carregando leituras...</Hint>
              ) : (
                <SensorChart
                  series={serie.series}
                  unidade={serie.unidade}
                  intervalo={serie.intervalo}
                  titulo={tipo ? TIPO_MEDIDA_LABELS[tipo] : ''}
                  onVerDados={() => setTabelaAberta(true)}
                />
              )}
            </CardContent>
          </Card>

          {serie && tipo && (
            <SensorDataDialog
              open={tabelaAberta}
              onClose={() => setTabelaAberta(false)}
              titulo={`${TIPO_MEDIDA_LABELS[tipo]} — ${periodo}`}
              series={serie.series}
              unidade={serie.unidade}
              intervalo={serie.intervalo}
              chaveLeituras={`${tipo}-${dias}-${propriedadeId}-${loteId}`}
              buscarLeituras={(signal) => painelService.leituras(tipo, dias, filtro, signal)}
            />
          )}
        </section>
      )}

      {painel && (
        <section className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="flex gap-3">
              <span className="text-3xl" aria-hidden="true">
                {painel.alertas.nao_lidos ? '⚠️' : '✅'}
              </span>
              <div className="min-w-0 space-y-1">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Alertas
                </span>
                {painel.alertas.nao_lidos === 0 ? (
                  <>
                    <h3 className="font-semibold">Nenhum alerta não lido</h3>
                    <p className="text-sm text-muted-foreground">
                      Os alertas climáticos dos lotes aparecem aqui.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">
                      {painel.alertas.nao_lidos}{' '}
                      {plural(painel.alertas.nao_lidos, 'alerta não lido', 'alertas não lidos')}
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {painel.alertas.recentes.map((a) => (
                        <li key={a.id}>
                          <strong className="text-foreground">{a.lote}:</strong> {a.mensagem}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-3">
              <span className="text-3xl" aria-hidden="true">
                🌾
              </span>
              <div className="min-w-0 space-y-1">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Próxima colheita
                </span>
                {painel.proxima_colheita ? (
                  <>
                    <h3 className="font-semibold">
                      {painel.proxima_colheita.cultura.nome} • {painel.proxima_colheita.lote.nome}
                    </h3>
                    <p
                      className={
                        painel.proxima_colheita.dias < 0
                          ? 'text-sm text-destructive'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {formatarData(painel.proxima_colheita.previsao)} (
                      {quando(painel.proxima_colheita.dias)}) · {painel.proxima_colheita.propriedade}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">Sem previsão</h3>
                    <p className="text-sm text-muted-foreground">
                      Nenhum lote em cultivo tem previsão de colheita.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </section>
  )
}
