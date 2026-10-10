import { useState } from 'react'
import {
  BuildingIcon,
  CpuIcon,
  PencilIcon,
  PlusIcon,
  RulerIcon,
  SproutIcon,
  Trash2Icon,
  WarehouseIcon,
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { formatarHectares, formatarNumero, substituirPorId } from '@/lib/format'
import { empresasService, propriedadesService } from '@/services'
import type { PropriedadeCompleta } from '@/types/propriedade'
import { PropriedadeForm } from './PropriedadeForm'

type Dialogo =
  | { modo: 'fechado' }
  | { modo: 'novo' }
  | { modo: 'editar'; propriedade: PropriedadeCompleta }

const porEmpresaENome = (a: PropriedadeCompleta, b: PropriedadeCompleta) =>
  a.empresa.razao_social.localeCompare(b.empresa.razao_social, 'pt-BR') ||
  a.nome.localeCompare(b.nome, 'pt-BR')

export default function PropriedadesPage() {
  const confirm = useConfirm()
  const [dialogo, setDialogo] = useState<Dialogo>({ modo: 'fechado' })
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')

  const { data, error, loading, setData } = useRequest(
    async (signal) => {
      const [propriedades, empresas] = await Promise.all([
        propriedadesService.listar(signal),
        empresasService.listar(signal),
      ])
      return { propriedades, empresas }
    },
    { errorPrefix: 'Não foi possível carregar as propriedades', cacheKey: 'pagina-propriedades' },
  )
  const propriedades = data?.propriedades ?? []
  const empresas = data?.empresas ?? []

  const visiveis = propriedades
    .filter((p) => filtroEmpresa === 'todas' || p.empresa_id === Number(filtroEmpresa))
    .sort(porEmpresaENome)

  const area = propriedades.reduce((soma, p) => soma + (p.area_total_ha ?? 0), 0)
  const totalLotes = propriedades.reduce((soma, p) => soma + p.total_lotes, 0)
  const totalSensores = propriedades.reduce((soma, p) => soma + p.total_sensores, 0)

  const fechar = () => setDialogo({ modo: 'fechado' })

  function salva(propriedade: PropriedadeCompleta, nova: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      propriedades: substituirPorId(atual?.propriedades ?? [], propriedade),
    }))
    fechar()
    toast.success(nova ? 'Propriedade cadastrada.' : 'Alterações salvas.')
  }

  async function excluir(propriedade: PropriedadeCompleta) {
    const confirmado = await confirm({
      title: `Excluir a propriedade ${propriedade.nome}?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!confirmado) return

    try {
      await propriedadesService.excluir(propriedade.id)
      setData((atual) => ({
        empresas: atual?.empresas ?? [],
        propriedades: (atual?.propriedades ?? []).filter((p) => p.id !== propriedade.id),
      }))
      toast.success('Propriedade excluída.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Erro ao excluir.'))
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Propriedades"
        description="Propriedades de cada empresa, onde ficam os lotes e os sensores."
        actions={
          <Button
            size="lg"
            onClick={() => setDialogo({ modo: 'novo' })}
            disabled={loading || !!error}
          >
            <PlusIcon />
            Nova propriedade
          </Button>
        }
      />

      <AppDialog
        open={dialogo.modo !== 'fechado'}
        onClose={fechar}
        title={
          dialogo.modo === 'editar'
            ? `Editar ${dialogo.propriedade.nome}`
            : 'Nova propriedade'
        }
        size="xl"
      >
        {dialogo.modo !== 'fechado' && (
          <PropriedadeForm
            key={dialogo.modo === 'editar' ? dialogo.propriedade.id : 'nova'}
            empresas={empresas}
            propriedade={dialogo.modo === 'editar' ? dialogo.propriedade : undefined}
            onSalva={salva}
            onCancelar={fechar}
          />
        )}
      </AppDialog>

      <ErrorMessage message={error} />

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Propriedades"
          value={propriedades.length}
          icon={<WarehouseIcon />}
          loading={loading}
        />
        <StatCard
          label="Área total"
          value={`${formatarNumero(area)} ha`}
          icon={<RulerIcon />}
          loading={loading}
        />
        <StatCard label="Lotes" value={totalLotes} icon={<SproutIcon />} loading={loading} />
        <StatCard label="Sensores" value={totalSensores} icon={<CpuIcon />} loading={loading} />
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <ListaPaginada
          itens={visiveis}
          campos={(p) => [p.nome, p.municipio, p.estado, p.empresa.razao_social]}
          rotuloBusca="Buscar por nome, município ou empresa"
          vazio={
            empresas.length === 0
              ? 'Cadastre uma empresa antes de cadastrar propriedades.'
              : 'Nenhuma propriedade encontrada.'
          }
          porPagina={9}
          listaClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          filtros={
            empresas.length > 1 && (
              <SelectField
                aria-label="Filtrar por empresa"
                value={filtroEmpresa}
                onValueChange={setFiltroEmpresa}
                options={[
                  { value: 'todas', label: 'Todas as empresas' },
                  ...empresas.map((e) => ({ value: String(e.id), label: e.razao_social })),
                ]}
                className="h-9 w-56"
              />
            )
          }
          renderItem={(p) => {
            const emUso = p.total_lotes > 0 || p.total_sensores > 0
            return (
              <EntityCard
                icon={<WarehouseIcon />}
                title={p.nome}
                subtitle={`${p.municipio}/${p.estado}`}
                badge={
                  <StatusBadge tone={p.status === 'ATIVA' ? 'success' : 'neutral'}>
                    {p.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                  </StatusBadge>
                }
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar ${p.nome}`}
                      onClick={() => setDialogo({ modo: 'editar', propriedade: p })}
                    >
                      <PencilIcon />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label={`Excluir ${p.nome}`}
                      onClick={() => excluir(p)}
                      disabled={emUso}
                      title={
                        emUso
                          ? 'Propriedade com lotes ou sensores não pode ser excluída; marque-a como inativa.'
                          : undefined
                      }
                    >
                      <Trash2Icon />
                      Excluir
                    </Button>
                  </>
                }
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
                  <BuildingIcon />
                  <span className="truncate">{p.empresa.razao_social}</span>
                </span>
                <Dados
                  itens={[
                    ['Área', formatarHectares(p.area_total_ha)],
                    ['Lotes', p.total_lotes],
                    ['Sensores', p.total_sensores],
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
