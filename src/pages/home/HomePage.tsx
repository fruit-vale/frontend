import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BellIcon,
  CloudSunIcon,
  CpuIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { SensorChart } from '@/components/charts/SensorChart'
import { SensorDataDialog } from '@/components/charts/SensorDataDialog'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { PrimeirosPassos } from '@/components/onboarding/PrimeirosPassos'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/use-auth'
import { useRequest } from '@/hooks/use-request'
import { formatarData, plural } from '@/lib/format'
import { lotesService, painelService } from '@/services'
import { TIPO_MEDIDA_LABELS, type TipoMedida } from '@/types/sensor'
import { EmpresaMapa, EmpresaPainel } from './EmpresaPainel'
import { EstruturaCard } from './EstruturaCard'
import { GraficoVazio } from './GraficoVazio'

const PERIODOS = [
  { dias: 1, rotulo: 'Últimas 24 horas' },
  { dias: 7, rotulo: 'Últimos 7 dias' },
  { dias: 30, rotulo: 'Últimos 30 dias' },
]

function quando(dias: number) {
  if (dias < 0) return `atrasada há ${-dias} ${plural(-dias, 'dia', 'dias')}`
  if (dias === 0) return 'prevista para hoje'
  if (dias === 1) return 'prevista para amanhã'
  return `em ${dias} dias`
}

export default function HomePage() {
  const { user } = useAuth()
  const [tipoEscolhido, setTipoEscolhido] = useState<TipoMedida | null>(null)
  const [dias, setDias] = useState(7)
  const [tabelaAberta, setTabelaAberta] = useState(false)
  const [propriedadeId, setPropriedadeId] = useState('todas')
  const [loteId, setLoteId] = useState('todos')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const { data: painel, error, loading } = useRequest(
    (signal) => painelService.obter(signal),
    { errorPrefix: 'Não foi possível carregar o painel', cacheKey: 'home-painel' },
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
  const { data: todosLotes = [] } = useRequest((signal) => lotesService.listar(signal), {
    cacheKey: 'lotes',
  })
  // só o administrador vê várias empresas; os demais, apenas a própria
  const lotes =
    user?.role === 'administrador'
      ? todosLotes
      : todosLotes.filter((l) => l.empresa.id === user?.empresa?.id)
  const propriedades = [
    ...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const lotesDaPropriedade = lotes
    .filter((l) => propriedadeId === 'todas' || l.propriedade.id === Number(propriedadeId))
    .sort((a, b) => a.nome_identificacao.localeCompare(b.nome_identificacao, 'pt-BR'))
  // quantos filtros fogem do padrão (aparece no botão enquanto ocultos)
  const filtrosAtivos =
    Number(propriedadeId !== 'todas') + Number(loteId !== 'todos') + Number(dias !== 7)
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
      cacheKey: 'home-serie',
    },
  )

  if (!user) return null
  const gestor = user.role === 'administrador' || user.role === 'produtor'
  const periodo = PERIODOS.find((p) => p.dias === dias)?.rotulo.toLowerCase() ?? ''
  const semSensor = !painel || painel.tipos.length === 0
  const alertas = painel?.alertas ?? { nao_lidos: 0, recentes: [] }
  const acoes = (
    <>
        {gestor && (
          <Link to={ROUTES.cultivos} className={buttonVariants({ size: 'lg' })}>
            <PlusIcon />
            Novo lote
          </Link>
        )}
        <Link to={ROUTES.previsao} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          <CloudSunIcon />
          Previsão do tempo
        </Link>

    </>
  )

  return (
    <section className="space-y-8">
      <ErrorMessage message={error} />

      {user.role === 'administrador' ? (
        <>
          {/* guia de configuração: só o administrador cadastra empresas e propriedades */}
          <PrimeirosPassos acoes={acoes} />
          <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2">
            <EstruturaCard lotes={lotes} />
          </section>
        </>
      ) : (
        // produtor e analista: só a própria empresa
        <EmpresaPainel
          empresa={user.empresa?.razao_social ?? 'Sem empresa vinculada'}
          painel={painel ?? null}
          loading={loading}
          acoes={acoes}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-3">
          <SectionHeader
            eyebrow="Monitoramento"
            title="Comportamento dos sensores"
            description={`Média ${serie?.intervalo === 'day' ? 'diária' : 'por hora'} de cada sensor.`}
            actions={
              painel &&
              painel.tipos.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  aria-expanded={filtrosAbertos}
                  onClick={() => setFiltrosAbertos((v) => !v)}
                >
                  <SlidersHorizontalIcon />
                  {filtrosAbertos ? 'Ocultar filtros' : 'Filtros'}
                  {filtrosAtivos > 0 && !filtrosAbertos && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {filtrosAtivos}
                    </span>
                  )}
                </Button>
              )
            }
          />

          {filtrosAbertos && painel && painel.tipos.length > 0 && (
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
          )}

          <Card>
            <CardContent>
              {loading ? (
                <Hint>Carregando painel...</Hint>
              ) : semSensor ? (
                <GraficoVazio>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Seus sensores vão aparecer aqui</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Assim que um sensor enviar a primeira leitura, o gráfico mostra temperatura,
                      umidade e outros dados em tempo real.
                    </p>
                  </div>
                  {gestor && (
                    <Link to={ROUTES.sensores} className={buttonVariants()}>
                      <CpuIcon />
                      Cadastrar um sensor
                    </Link>
                  )}
                </GraficoVazio>
              ) : erroSerie ? (
                <ErrorMessage message={erroSerie} />
              ) : carregandoSerie || !serie ? (
                <Hint>Carregando leituras...</Hint>
              ) : (
                <SensorChart
                  series={serie.series}
                  unidade={serie.unidade}
                  intervalo={serie.intervalo}
                  dias={dias}
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

        <aside className="min-w-0 space-y-3">
          <Card>
            <CardContent className="flex gap-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5 ${
                  alertas.nao_lidos ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'
                }`}
                aria-hidden="true"
              >
                {alertas.nao_lidos ? <TriangleAlertIcon /> : <BellIcon />}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Alertas
                </span>
                {alertas.nao_lidos === 0 ? (
                  <>
                    <h3 className="font-semibold">Tudo tranquilo por aqui</h3>
                    <p className="text-sm text-muted-foreground">
                      Nenhum alerta não lido. Os alertas climáticos dos lotes aparecem aqui.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">
                      {alertas.nao_lidos}{' '}
                      {plural(alertas.nao_lidos, 'alerta não lido', 'alertas não lidos')}
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {alertas.recentes.map((a) => (
                        <li key={a.id}>
                          <strong className="text-foreground">{a.lote}:</strong> {a.mensagem}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <Link
                  to={ROUTES.leiturasAlertas}
                  className="inline-block pt-1 text-sm text-primary underline"
                >
                  Ver leituras e alertas
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-xl"
                aria-hidden="true"
              >
                🌾
              </span>
              <div className="min-w-0 space-y-1">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Próxima colheita
                </span>
                {painel?.proxima_colheita ? (
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
                      Informe a data prevista ao cadastrar um lote para acompanhar a colheita.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {user.role !== 'administrador' && <EmpresaMapa lotes={lotes} />}
    </section>
  )
}
