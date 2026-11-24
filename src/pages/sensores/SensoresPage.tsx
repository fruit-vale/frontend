import { useMemo, useState } from 'react'
import {
  ActivityIcon,
  BuildingIcon,
  CircleCheckIcon,
  FilterXIcon,
  KeyRoundIcon,
  ListChecksIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PowerIcon,
  RadioTowerIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { Dados, EntityCard } from '@/components/shared/EntityCard'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PageHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { formatarData, plural } from '@/lib/format'
import { lotesService, sensoresService } from '@/services'
import {
  ACESSO_MQTT_LABELS,
  STATUS_SENSOR_LABELS,
  TIPO_MEDIDA_LABELS,
  type Credenciais,
  type LoteResumo,
  type Medida,
  type Sensor,
  type StatusSensor,
  type TipoMedida,
} from '@/types/sensor'
import { CredenciaisSensor } from './CredenciaisSensor'
import { EditarMedidasForm } from './EditarMedidasForm'
import { GuiaArduino } from './GuiaArduino'
import { MoverLoteForm } from './MoverLoteForm'
import { NovoSensorForm } from './NovoSensorForm'

type Dialogo =
  | { tipo: 'fechado' }
  | { tipo: 'novo' }
  | { tipo: 'credenciais'; titulo: string; credenciais: Credenciais; medidas: Medida[] }
  /** passo seguinte às credenciais: gravar a placa com a biblioteca */
  | { tipo: 'arduino'; titulo: string; credenciais: Credenciais; medidas: Medida[] }
  | { tipo: 'medidas'; sensor: Sensor }
  | { tipo: 'lote'; sensor: Sensor }

const porCodigo = (a: Sensor, b: Sensor) =>
  a.codigo_sensor.localeCompare(b.codigo_sensor, 'pt-BR')

const STATUS_TONE: Record<StatusSensor, Tone> = {
  ATIVO: 'success',
  INATIVO: 'danger',
  MANUTENCAO: 'warning',
}

const TODOS = 'todos'

type Filtros = {
  status: string
  empresa: string
  propriedade: string
  lote: string
  dado: string
  mqtt: string
  leituras: string
}

const SEM_FILTROS: Filtros = {
  status: TODOS,
  empresa: TODOS,
  propriedade: TODOS,
  lote: TODOS,
  dado: TODOS,
  mqtt: TODOS,
  leituras: TODOS,
}

type Dados = { sensores: Sensor[]; lotes: LoteResumo[] }

export default function SensoresPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const admin = user?.role === 'administrador'

  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const [dialogo, setDialogo] = useState<Dialogo>({ tipo: 'fechado' })

  const { data, error, loading, setData } = useRequest<Dados>(
    async (signal) => {
      const [sensores, lotes] = await Promise.all([
        sensoresService.listar(signal),
        lotesService.listar(signal),
      ])
      return { sensores: sensores.sort(porCodigo), lotes }
    },
    { errorPrefix: 'Não foi possível carregar os sensores', cacheKey: 'pagina-sensores' },
  )
  const sensores = useMemo(() => data?.sensores ?? [], [data])
  const lotes = data?.lotes ?? []

  const atualizarSensores = (fn: (atuais: Sensor[]) => Sensor[]) =>
    setData((atual) => ({ lotes: atual?.lotes ?? [], sensores: fn(atual?.sensores ?? []) }))
  const substituir = (sensor: Sensor) =>
    atualizarSensores((atuais) => atuais.map((s) => (s.id === sensor.id ? sensor : s)))


  const mudar = (campo: keyof Filtros, valor: string) =>
    setFiltros((atual) => ({
      ...atual,
      [campo]: valor,
      // o lote escolhido pode ser de outra propriedade ou empresa
      ...(campo === 'propriedade' || campo === 'empresa' ? { lote: TODOS } : {}),
    }))
  const filtrosAtivos = Object.values(filtros).filter((v) => v !== TODOS).length

  // opções de cada filtro, tiradas dos próprios sensores
  const opcoes = useMemo(() => {
    const unicos = <T extends { id: number }>(itens: T[]) => [
      ...new Map(itens.map((i) => [i.id, i])).values(),
    ]
    const empresas = unicos(sensores.map((s) => s.empresa)).sort((a, b) =>
      a.razao_social.localeCompare(b.razao_social, 'pt-BR'),
    )
    const propriedades = unicos(
      sensores
        .filter((s) => filtros.empresa === TODOS || s.empresa.id === Number(filtros.empresa))
        .map((s) => s.propriedade),
    ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    const lotesDisponiveis = unicos(
      sensores
        .filter(
          (s) =>
            (filtros.empresa === TODOS || s.empresa.id === Number(filtros.empresa)) &&
            (filtros.propriedade === TODOS || s.propriedade.id === Number(filtros.propriedade)),
        )
        .flatMap((s) => (s.lote ? [s.lote] : [])),
    ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    const dados = [...new Set(sensores.flatMap((s) => s.medidas.map((m) => m.tipo)))].sort(
      (a, b) => TIPO_MEDIDA_LABELS[a].localeCompare(TIPO_MEDIDA_LABELS[b], 'pt-BR'),
    )
    return { empresas, propriedades, lotes: lotesDisponiveis, dados }
  }, [sensores, filtros.empresa, filtros.propriedade])

  const visiveis = sensores.filter(
    (s) =>
      (filtros.status === TODOS || s.status === filtros.status) &&
      (filtros.empresa === TODOS || s.empresa.id === Number(filtros.empresa)) &&
      (filtros.propriedade === TODOS || s.propriedade.id === Number(filtros.propriedade)) &&
      (filtros.lote === TODOS ||
        (filtros.lote === 'sem' ? s.lote === null : s.lote?.id === Number(filtros.lote))) &&
      (filtros.dado === TODOS || s.medidas.some((m) => m.tipo === filtros.dado)) &&
      (filtros.mqtt === TODOS || (s.acesso_mqtt ?? 'desconhecido') === filtros.mqtt) &&
      (filtros.leituras === TODOS ||
        (filtros.leituras === 'com' ? s.total_leituras > 0 : s.total_leituras === 0)),
  )

  const ativos = sensores.filter((s) => s.status === 'ATIVO').length
  const atencao = sensores.filter((s) => s.status !== 'ATIVO').length
  const leituras = sensores.reduce((soma, s) => soma + s.total_leituras, 0)

  const fechar = () => setDialogo({ tipo: 'fechado' })

  /** Roda uma ação sobre um sensor, bloqueando a linha e avisando se falhar. */
  async function executar(id: number, acao: () => Promise<void>) {
    setEmAndamento(id)
    try {
      await acao()
    } catch (e) {
      toast.error(getErrorMessage(e, 'Erro na operação.'))
    } finally {
      setEmAndamento(null)
    }
  }

  function cadastrado(sensor: Sensor, credenciais: Credenciais) {
    atualizarSensores((atuais) => [...atuais, sensor].sort(porCodigo))
    setDialogo({
      tipo: 'credenciais',
      titulo: 'Sensor cadastrado',
      credenciais,
      medidas: sensor.medidas,
    })
  }

  async function novaSenha(sensor: Sensor) {
    const semAcesso = sensor.acesso_mqtt === 'sem_acesso'
    const confirmado = await confirm({
      title: semAcesso
        ? `Criar o acesso MQTT de ${sensor.codigo_sensor}?`
        : `Gerar uma nova senha para ${sensor.codigo_sensor}?`,
      description: semAcesso ? undefined : 'A senha atual deixa de funcionar imediatamente.',
      confirmLabel: semAcesso ? 'Criar acesso' : 'Gerar nova senha',
    })
    if (!confirmado) return

    void executar(sensor.id, async () => {
      const credenciais = await sensoresService.gerarSenha(sensor.id)
      substituir({ ...sensor, acesso_mqtt: sensor.status === 'INATIVO' ? 'inativo' : 'ativo' })
      setDialogo({
        tipo: 'credenciais',
        titulo: semAcesso ? 'Acesso MQTT criado' : 'Nova senha gerada',
        credenciais,
        medidas: sensor.medidas,
      })
    })
  }

  async function alterarStatus(sensor: Sensor, status: StatusSensor) {
    if (status === 'INATIVO') {
      const confirmado = await confirm({
        title: `Desativar ${sensor.codigo_sensor}?`,
        description: 'Ele será desconectado e não poderá mais enviar leituras.',
        confirmLabel: 'Desativar',
        destructive: true,
      })
      if (!confirmado) return
    }

    void executar(sensor.id, async () => {
      substituir(await sensoresService.alterarStatus(sensor.id, status))
    })
  }

  async function excluir(sensor: Sensor) {
    const confirmado = await confirm({
      title: `Excluir ${sensor.codigo_sensor}?`,
      description: 'O sensor e o acesso MQTT dele serão removidos.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!confirmado) return

    void executar(sensor.id, async () => {
      await sensoresService.excluir(sensor.id)
      atualizarSensores((atuais) => atuais.filter((s) => s.id !== sensor.id))
      toast.success('Sensor excluído.')
    })
  }

  const tituloDialogo =
    dialogo.tipo === 'credenciais'
      ? dialogo.titulo
      : dialogo.tipo === 'arduino'
        ? 'Configurar a placa no Arduino IDE'
        : dialogo.tipo === 'medidas'
          ? `Dados de ${dialogo.sensor.codigo_sensor}`
          : dialogo.tipo === 'lote'
            ? `Mudar ${dialogo.sensor.codigo_sensor} de lote`
            : 'Cadastrar sensor'

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Monitoramento"
        title="Sensores"
        description={
          admin
            ? 'Sensores de todas as empresas e seus acessos ao broker MQTT.'
            : `Sensores de ${user?.empresa?.razao_social ?? 'sua empresa'} e seus acessos ao broker MQTT.`
        }
        actions={
          <Button
            size="lg"
            onClick={() => setDialogo({ tipo: 'novo' })}
            disabled={loading || !!error}
          >
            <PlusIcon />
            Cadastrar sensor
          </Button>
        }
      />

      <AppDialog
        open={dialogo.tipo !== 'fechado'}
        onClose={fechar}
        title={tituloDialogo}
        size={dialogo.tipo === 'credenciais' ? 'md' : 'lg'}
      >
        {dialogo.tipo === 'novo' && (
          <NovoSensorForm lotes={lotes} onCriado={cadastrado} onCancelar={fechar} />
        )}
        {dialogo.tipo === 'credenciais' && (
          <CredenciaisSensor
            credenciais={dialogo.credenciais}
            medidas={dialogo.medidas}
            onConcluir={() => setDialogo({ ...dialogo, tipo: 'arduino' })}
          />
        )}
        {dialogo.tipo === 'arduino' && (
          <GuiaArduino
            credenciais={dialogo.credenciais}
            medidas={dialogo.medidas}
            onVoltar={() => setDialogo({ ...dialogo, tipo: 'credenciais' })}
            onConcluir={fechar}
          />
        )}
        {dialogo.tipo === 'lote' && (
          <MoverLoteForm
            key={dialogo.sensor.id}
            sensor={dialogo.sensor}
            lotes={lotes}
            onSalvo={(salvo) => {
              substituir(salvo)
              fechar()
              toast.success(`${salvo.codigo_sensor} agora está em ${salvo.lote?.nome}.`)
            }}
            onCancelar={fechar}
          />
        )}
        {dialogo.tipo === 'medidas' && (
          <EditarMedidasForm
            key={dialogo.sensor.id}
            sensor={dialogo.sensor}
            onSalvo={(salvo) => {
              substituir(salvo)
              fechar()
              toast.success('Dados do sensor salvos.')
            }}
            onCancelar={fechar}
          />
        )}
      </AppDialog>

      <ErrorMessage message={error} />

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<RadioTowerIcon />}
          label="Total de sensores"
          value={sensores.length}
          loading={loading}
        />
        <StatCard icon={<CircleCheckIcon />} label="Ativos" value={ativos} loading={loading} />
        <StatCard
          icon={<TriangleAlertIcon />}
          label="Inativos ou em manutenção"
          value={atencao}
          loading={loading}
        />
        <StatCard
          icon={<ActivityIcon />}
          label="Leituras registradas"
          value={leituras.toLocaleString('pt-BR')}
          loading={loading}
        />
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : (
        <ListaPaginada
          itens={visiveis}
          campos={(x) => [
            x.codigo_sensor,
            x.tipo,
            x.lote?.nome,
            x.propriedade.nome,
            x.empresa.razao_social,
            ...x.medidas.map((m) => m.nome),
          ]}
          rotuloBusca="Buscar por código, tipo, lote ou dado"
          vazio={
            sensores.length === 0
              ? 'Nenhum sensor cadastrado ainda.'
              : 'Nenhum sensor encontrado com esses filtros.'
          }
          porPagina={9}
          listaClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          filtros={
            <>
              <Button
                type="button"
                variant="outline"
                aria-expanded={filtrosAbertos}
                onClick={() => setFiltrosAbertos((v) => !v)}
                className="h-9"
              >
                <SlidersHorizontalIcon />
                Filtros
                {filtrosAtivos > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {filtrosAtivos}
                  </span>
                )}
              </Button>
              {filtrosAbertos && (
                <div className="flex basis-full flex-wrap items-center gap-2">
                  <SelectField
                    aria-label="Status"
                    value={filtros.status}
                    onValueChange={(v) => mudar('status', v)}
                    options={[
                      { value: TODOS, label: 'Todos os status' },
                      ...(Object.keys(STATUS_SENSOR_LABELS) as StatusSensor[]).map((s) => ({
                        value: s,
                        label: STATUS_SENSOR_LABELS[s],
                      })),
                    ]}
                    className="h-9 w-44"
                  />
                  {admin && opcoes.empresas.length > 1 && (
                    <SelectField
                      aria-label="Empresa"
                      value={filtros.empresa}
                      onValueChange={(v) => mudar('empresa', v)}
                      options={[
                        { value: TODOS, label: 'Todas as empresas' },
                        ...opcoes.empresas.map((e) => ({
                          value: String(e.id),
                          label: e.razao_social,
                        })),
                      ]}
                      className="h-9 w-52"
                    />
                  )}
                  <SelectField
                    aria-label="Propriedade"
                    value={filtros.propriedade}
                    onValueChange={(v) => mudar('propriedade', v)}
                    options={[
                      { value: TODOS, label: 'Todas as propriedades' },
                      ...opcoes.propriedades.map((p) => ({ value: String(p.id), label: p.nome })),
                    ]}
                    className="h-9 w-52"
                  />
                  <SelectField
                    aria-label="Lote"
                    value={filtros.lote}
                    onValueChange={(v) => mudar('lote', v)}
                    options={[
                      { value: TODOS, label: 'Todos os lotes' },
                      { value: 'sem', label: 'Sem lote' },
                      ...opcoes.lotes.map((l) => ({ value: String(l.id), label: l.nome })),
                    ]}
                    className="h-9 w-44"
                  />
                  <SelectField
                    aria-label="Dado medido"
                    value={filtros.dado}
                    onValueChange={(v) => mudar('dado', v)}
                    options={[
                      { value: TODOS, label: 'Todos os dados' },
                      ...opcoes.dados.map((d: TipoMedida) => ({
                        value: d,
                        label: TIPO_MEDIDA_LABELS[d],
                      })),
                    ]}
                    className="h-9 w-44"
                  />
                  <SelectField
                    aria-label="Acesso MQTT"
                    value={filtros.mqtt}
                    onValueChange={(v) => mudar('mqtt', v)}
                    options={[
                      { value: TODOS, label: 'Qualquer acesso MQTT' },
                      ...Object.entries(ACESSO_MQTT_LABELS).map(([value, label]) => ({
                        value,
                        label,
                      })),
                    ]}
                    className="h-9 w-52"
                  />
                  <SelectField
                    aria-label="Leituras"
                    value={filtros.leituras}
                    onValueChange={(v) => mudar('leituras', v)}
                    options={[
                      { value: TODOS, label: 'Com ou sem leituras' },
                      { value: 'com', label: 'Com leituras' },
                      { value: 'sem', label: 'Sem leituras' },
                    ]}
                    className="h-9 w-48"
                  />
                  {filtrosAtivos > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFiltros(SEM_FILTROS)}>
                      <FilterXIcon />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </>
          }
          renderItem={(sensor) => {
            const ocupado = emAndamento === sensor.id
            const temLeituras = sensor.total_leituras > 0
            return (
              <EntityCard
                icon={<RadioTowerIcon />}
                title={sensor.codigo_sensor}
                subtitle={sensor.tipo}
                badge={
                  <StatusBadge tone={STATUS_TONE[sensor.status]}>
                    {STATUS_SENSOR_LABELS[sensor.status]}
                  </StatusBadge>
                }
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={ocupado}
                      onClick={() => setDialogo({ tipo: 'medidas', sensor })}
                    >
                      <ListChecksIcon />
                      Dados
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={ocupado}
                            aria-label={`Mais ações de ${sensor.codigo_sensor}`}
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => setDialogo({ tipo: 'lote', sensor })}>
                          <MapPinIcon />
                          Mudar de lote
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => novaSenha(sensor)}>
                          <KeyRoundIcon />
                          {sensor.acesso_mqtt === 'sem_acesso' ? 'Criar acesso' : 'Nova senha'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            alterarStatus(sensor, sensor.status === 'INATIVO' ? 'ATIVO' : 'INATIVO')
                          }
                        >
                          <PowerIcon />
                          {sensor.status === 'INATIVO' ? 'Reativar' : 'Desativar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={temLeituras}
                          title={
                            temLeituras
                              ? 'Sensor com leituras registradas não pode ser excluído; desative-o.'
                              : undefined
                          }
                          onClick={() => excluir(sensor)}
                        >
                          <Trash2Icon />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              >
                <div className="flex flex-col gap-1 text-xs text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon />
                    <span className="truncate">
                      {sensor.lote?.nome ?? 'Sem lote'} · {sensor.propriedade.nome}
                    </span>
                  </span>
                  {admin && (
                    <span className="flex items-center gap-1.5">
                      <BuildingIcon />
                      <span className="truncate">{sensor.empresa.razao_social}</span>
                    </span>
                  )}
                </div>
                {sensor.medidas.length > 0 && (
                  <ul className="flex flex-wrap gap-1">
                    {sensor.medidas.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {m.nome}
                        {m.unidade && ` (${m.unidade})`}
                      </li>
                    ))}
                  </ul>
                )}
                <Dados
                  itens={[
                    [
                      'Leituras',
                      `${sensor.total_leituras.toLocaleString('pt-BR')} ${plural(sensor.total_leituras, 'leitura', 'leituras')}`,
                    ],
                    ['Instalação', formatarData(sensor.data_instalacao)],
                    [
                      'Acesso MQTT',
                      sensor.acesso_mqtt ? ACESSO_MQTT_LABELS[sensor.acesso_mqtt] : '—',
                    ],
                  ]}
                />
              </EntityCard>
            )
          }}
        />
      )}
    </section>
  )
}
