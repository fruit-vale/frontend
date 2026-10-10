import { useState, type ReactNode } from 'react'
import { BuildingIcon, ChevronRightIcon, CpuIcon, MapPinIcon, SproutIcon } from 'lucide-react'
import { AppDialog } from '@/components/shared/AppDialog'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useRequest } from '@/hooks/use-request'
import { plural, porTexto } from '@/lib/format'
import { empresasService, propriedadesService, sensoresService } from '@/services'
import { SITUACAO_LABELS, type Lote } from '@/types/lote'
import { STATUS_SENSOR_LABELS, type Sensor } from '@/types/sensor'
import { ListaPaginada } from '@/components/shared/ListaPaginada'

const TOM_SENSOR = { ATIVO: 'success', INATIVO: 'neutral', MANUTENCAO: 'warning' } as const

function SensorLinha({ sensor }: { sensor: Sensor }) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-1 text-sm">
      <CpuIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{sensor.codigo_sensor}</span>
      <span className="text-xs text-muted-foreground">{sensor.tipo}</span>
      <StatusBadge tone={TOM_SENSOR[sensor.status]} className="h-auto py-0.5">
        {STATUS_SENSOR_LABELS[sensor.status]}
      </StatusBadge>
    </li>
  )
}

function Grupo({
  icone,
  titulo,
  detalhe,
  children,
}: {
  icone: ReactNode
  titulo: string
  detalhe?: string
  children: ReactNode
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        {icone}
        <strong className="min-w-0 truncate text-sm">{titulo}</strong>
        {detalhe && <small className="shrink-0 text-xs text-muted-foreground">{detalhe}</small>}
      </summary>
      <div className="ml-4 border-l pl-3">{children}</div>
    </details>
  )
}

type Aberto = 'propriedades' | 'empresas' | null

type EmpresaLinha = {
  id: number
  razao_social: string
  detalhe: string
  propriedades: number
}

/**
 * Cards com o total de propriedades e de empresas. Cada um abre um modal com
 * busca e paginação; o de propriedades detalha lote → sensores.
 */
export function EstruturaCard({ lotes }: { lotes: Lote[] }) {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const [aberto, setAberto] = useState<Aberto>(null)
  const props = useRequest((s) => propriedadesService.listar(s), {
    errorPrefix: 'Não foi possível carregar as propriedades',
    cacheKey: 'propriedades',
  })
  const sens = useRequest((s) => sensoresService.listar(s), {
    errorPrefix: 'Não foi possível carregar os sensores',
    cacheKey: 'sensores',
  })
  // só o administrador lista empresas; os demais veem a(s) das próprias propriedades
  const emps = useRequest((s) => empresasService.listar(s), {
    enabled: admin,
    errorPrefix: 'Não foi possível carregar as empresas',
    cacheKey: 'empresas',
  })

  // só o administrador vê várias empresas; os demais, apenas a própria
  const daEmpresa = <T extends { empresa: { id: number } }>(itens: T[] = []) =>
    admin ? itens : itens.filter((i) => i.empresa.id === user?.empresa?.id)
  const propriedades = daEmpresa(props.data).sort(porTexto((p) => p.nome))
  const sensores = daEmpresa(sens.data)
  const propsPorEmpresa = new Map<number, number>()
  for (const p of propriedades)
    propsPorEmpresa.set(p.empresa_id, (propsPorEmpresa.get(p.empresa_id) ?? 0) + 1)

  const empresas: EmpresaLinha[] = (
    admin
      ? (emps.data ?? []).map((e) => ({
          id: e.id,
          razao_social: e.razao_social,
          detalhe: [e.cidade && e.estado ? `${e.cidade}/${e.estado}` : null, e.responsavel]
            .filter(Boolean)
            .join(' · '),
          propriedades: propsPorEmpresa.get(e.id) ?? 0,
        }))
      : [...new Map(propriedades.map((p) => [p.empresa.id, p.empresa])).values()].map((e) => ({
          id: e.id,
          razao_social: e.razao_social,
          detalhe: '',
          propriedades: propsPorEmpresa.get(e.id) ?? 0,
        }))
  ).sort(porTexto((e) => e.razao_social))

  const carregando = props.loading || (admin && emps.loading)

  const cards = [
    { id: 'propriedades', rotulo: 'Propriedades', valor: propriedades.length, icone: <MapPinIcon /> },
    { id: 'empresas', rotulo: 'Empresas', valor: empresas.length, icone: <BuildingIcon /> },
  ] as const

  return (
    <>
      {cards.map(({ id, rotulo, valor, icone }) => (
        <button
          key={id}
          type="button"
          onClick={() => setAberto(id)}
          aria-haspopup="dialog"
          className="rounded-xl text-left transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Card size="sm" className="h-full">
            <CardContent className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground [&_svg]:size-5"
                aria-hidden="true"
              >
                {icone}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs text-muted-foreground">{rotulo}</span>
                {carregando ? (
                  <Skeleton className="mt-1 h-7 w-10" />
                ) : (
                  <strong className="block text-2xl leading-tight font-semibold">{valor}</strong>
                )}
              </div>
              <ChevronRightIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </CardContent>
          </Card>
        </button>
      ))}

      <AppDialog
        open={aberto === 'empresas'}
        onClose={() => setAberto(null)}
        size="lg"
        title="Empresas"
        description="Empresas cadastradas e quantas propriedades cada uma tem."
      >
        <ErrorMessage message={props.error || emps.error} />
        {carregando ? (
          <Hint>Carregando...</Hint>
        ) : (
          <ListaPaginada
            itens={empresas}
            campos={(e) => [e.razao_social, e.detalhe]}
            rotuloBusca="Buscar empresa"
            vazio="Nenhuma empresa cadastrada."
            renderItem={(e) => (
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <BuildingIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{e.razao_social}</strong>
                  {e.detalhe && (
                    <small className="block truncate text-xs text-muted-foreground">
                      {e.detalhe}
                    </small>
                  )}
                </div>
                <small className="shrink-0 text-xs text-muted-foreground">
                  {e.propriedades} {plural(e.propriedades, 'propriedade', 'propriedades')}
                </small>
              </div>
            )}
          />
        )}
      </AppDialog>

      <AppDialog
        open={aberto === 'propriedades'}
        onClose={() => setAberto(null)}
        size="lg"
        title="Propriedades, lotes e sensores"
        description="Abra cada propriedade para ver os lotes e os sensores instalados."
      >
        <ErrorMessage message={props.error || sens.error} />
        {carregando ? (
          <Hint>Carregando...</Hint>
        ) : (
          <ListaPaginada
            itens={propriedades}
            campos={(p) => [p.nome, p.municipio, p.empresa.razao_social]}
            rotuloBusca="Buscar propriedade"
            vazio="Nenhuma propriedade cadastrada."
            renderItem={(p) => {
              const lotesP = lotes
                .filter((l) => l.propriedade.id === p.id)
                .sort(porTexto((l) => l.nome_identificacao))
              const sensoresP = sensores.filter((s) => s.propriedade.id === p.id)
              const semLote = sensoresP.filter((s) => !s.lote)
              return (
                <Grupo
                  icone={<MapPinIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                  titulo={p.nome}
                  detalhe={`${p.empresa.razao_social} · ${lotesP.length} ${plural(lotesP.length, 'lote', 'lotes')} · ${sensoresP.length} ${plural(sensoresP.length, 'sensor', 'sensores')}`}
                >
                  {lotesP.length === 0 && semLote.length === 0 && (
                    <Hint className="px-2 py-2">Nenhum lote nesta propriedade.</Hint>
                  )}
                  {lotesP.map((l) => {
                    const sensoresL = sensoresP.filter((s) => s.lote?.id === l.id)
                    return (
                      <Grupo
                        key={l.id}
                        icone={
                          <SproutIcon className="size-4 shrink-0 text-success" aria-hidden="true" />
                        }
                        titulo={l.nome_identificacao}
                        detalhe={`${l.cultura.nome} · ${SITUACAO_LABELS[l.situacao]} · ${sensoresL.length} ${plural(sensoresL.length, 'sensor', 'sensores')}`}
                      >
                        {sensoresL.length === 0 ? (
                          <Hint className="px-2 py-2">Nenhum sensor neste lote.</Hint>
                        ) : (
                          <ul className="px-2">
                            {sensoresL.map((s) => (
                              <SensorLinha key={s.id} sensor={s} />
                            ))}
                          </ul>
                        )}
                      </Grupo>
                    )
                  })}
                  {semLote.length > 0 && (
                    <Grupo
                      icone={
                        <CpuIcon
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      }
                      titulo="Sem lote"
                      detalhe={`${semLote.length} ${plural(semLote.length, 'sensor', 'sensores')}`}
                    >
                      <ul className="px-2">
                        {semLote.map((s) => (
                          <SensorLinha key={s.id} sensor={s} />
                        ))}
                      </ul>
                    </Grupo>
                  )}
                </Grupo>
              )
            }}
          />
        )}
      </AppDialog>
    </>
  )
}
