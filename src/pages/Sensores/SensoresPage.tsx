import { useMemo, useState } from 'react'
import {
  ActivityIcon,
  CircleCheckIcon,
  CircleOffIcon,
  KeyRoundIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PowerIcon,
  RadioTowerIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { DataCard, EntityCell, NoResults } from '@/components/shared/DataCard'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { useSearch } from '@/hooks/use-search'
import { plural } from '@/lib/format'
import { lotesService, sensoresService } from '@/services'
import {
  ACESSO_MQTT_LABELS,
  STATUS_SENSOR_LABELS,
  type Credenciais,
  type LoteResumo,
  type Medida,
  type Sensor,
  type StatusSensor,
} from '@/types/sensor'
import { CredenciaisSensor } from './CredenciaisSensor'
import { EditarMedidasForm } from './EditarMedidasForm'
import { GuiaArduino } from './GuiaArduino'
import { NovoSensorForm } from './NovoSensorForm'

type FiltroStatus = 'todos' | StatusSensor

type Dialogo =
  | { tipo: 'fechado' }
  | { tipo: 'novo' }
  | { tipo: 'credenciais'; titulo: string; credenciais: Credenciais; medidas: Medida[] }
  /** passo seguinte às credenciais: gravar a placa com a biblioteca */
  | { tipo: 'arduino'; titulo: string; credenciais: Credenciais; medidas: Medida[] }
  | { tipo: 'medidas'; sensor: Sensor }

const porCodigo = (a: Sensor, b: Sensor) =>
  a.codigo_sensor.localeCompare(b.codigo_sensor, 'pt-BR')

const STATUS_TONE: Record<StatusSensor, Tone> = {
  ATIVO: 'success',
  INATIVO: 'danger',
  MANUTENCAO: 'warning',
}

const FILTROS_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativos' },
  { value: 'INATIVO', label: 'Inativos' },
  { value: 'MANUTENCAO', label: 'Em manutenção' },
]

type Dados = { sensores: Sensor[]; lotes: LoteResumo[] }

export default function SensoresPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const admin = user?.role === 'administrador'

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')
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
    { errorPrefix: 'Não foi possível carregar os sensores' },
  )
  const sensores = useMemo(() => data?.sensores ?? [], [data])
  const lotes = data?.lotes ?? []

  const atualizarSensores = (fn: (atuais: Sensor[]) => Sensor[]) =>
    setData((atual) => ({ lotes: atual?.lotes ?? [], sensores: fn(atual?.sensores ?? []) }))
  const substituir = (sensor: Sensor) =>
    atualizarSensores((atuais) => atuais.map((s) => (s.id === sensor.id ? sensor : s)))

  // empresas presentes na lista, para o filtro do administrador
  const empresas = useMemo(() => {
    const unicas = new Map(sensores.map((s) => [s.empresa.id, s.empresa]))
    return [...unicas.values()].sort((a, b) =>
      a.razao_social.localeCompare(b.razao_social, 'pt-BR'),
    )
  }, [sensores])

  const daEmpresa =
    filtroEmpresa === 'todas'
      ? sensores
      : sensores.filter((s) => s.empresa.id === Number(filtroEmpresa))
  const ativos = daEmpresa.filter((s) => s.status === 'ATIVO').length
  const inativos = daEmpresa.filter((s) => s.status === 'INATIVO').length
  const visiveis = daEmpresa.filter((s) => filtroStatus === 'todos' || s.status === filtroStatus)

  const { query, setQuery, filtrados: buscados } = useSearch(visiveis, (x) => [
    x.codigo_sensor,
    x.tipo,
    x.lote?.nome,
    x.propriedade.nome,
    x.empresa.razao_social,
  ])

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

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<ActivityIcon />}
          label="Total de sensores"
          value={daEmpresa.length}
          loading={loading}
        />
        <StatCard
          icon={<CircleCheckIcon />}
          label="Sensores ativos"
          value={ativos}
          loading={loading}
        />
        <StatCard
          icon={<CircleOffIcon />}
          label="Sensores inativos"
          value={inativos}
          loading={loading}
        />
      </div>

      <ErrorMessage message={error} />
      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && !error && sensores.length === 0 && (
        <EmptyState>Nenhum sensor cadastrado ainda.</EmptyState>
      )}

      {sensores.length > 0 && (
        <DataCard
          title="Sensores cadastrados"
          shown={buscados.length}
          total={sensores.length}
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por código, tipo ou lote"
          filters={
            <>
              {admin && empresas.length > 1 && (
                <SelectField
                  aria-label="Filtrar por empresa"
                  value={filtroEmpresa}
                  onValueChange={setFiltroEmpresa}
                  className="h-9 w-52"
                  options={[
                    { value: 'todas', label: 'Todas as empresas' },
                    ...empresas.map((e) => ({ value: String(e.id), label: e.razao_social })),
                  ]}
                />
              )}
              <SelectField
                aria-label="Filtrar sensores"
                value={filtroStatus}
                onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}
                options={FILTROS_STATUS}
                className="h-9 w-40"
              />
            </>
          }
        >
          {buscados.length === 0 ? (
            <NoResults>Nenhum sensor encontrado com esses filtros.</NoResults>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead className="hidden sm:table-cell">Lote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {buscados.map((sensor) => {
                  const ocupado = emAndamento === sensor.id
                  const temLeituras = sensor.total_leituras > 0
                  return (
                    <TableRow key={sensor.id}>
                      <TableCell>
                        <EntityCell
                          icon={<RadioTowerIcon />}
                          title={sensor.codigo_sensor}
                          subtitle={`${sensor.tipo} · ${sensor.total_leituras} ${plural(sensor.total_leituras, 'leitura', 'leituras')}`}
                        />
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <strong className="block text-sm font-medium">
                          {sensor.lote?.nome ?? 'Sem lote'}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {sensor.propriedade.nome}
                          {admin && ` · ${sensor.empresa.razao_social}`}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge tone={STATUS_TONE[sensor.status]}>
                            {STATUS_SENSOR_LABELS[sensor.status]}
                          </StatusBadge>
                          {sensor.acesso_mqtt && sensor.acesso_mqtt !== 'ativo' && (
                            <span className="text-xs text-muted-foreground">
                              MQTT: {ACESSO_MQTT_LABELS[sensor.acesso_mqtt]}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={ocupado}
                                aria-label={`Ações de ${sensor.codigo_sensor}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => setDialogo({ tipo: 'medidas', sensor })}
                            >
                              <ListChecksIcon />
                              Dados do sensor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => novaSenha(sensor)}>
                              <KeyRoundIcon />
                              {sensor.acesso_mqtt === 'sem_acesso' ? 'Criar acesso' : 'Nova senha'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                alterarStatus(
                                  sensor,
                                  sensor.status === 'INATIVO' ? 'ATIVO' : 'INATIVO',
                                )
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
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DataCard>
      )}
    </section>
  )
}
