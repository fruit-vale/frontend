import { useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon, WarehouseIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { DataCard, EntityCell, NoResults } from '@/components/shared/DataCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatusBadge } from '@/components/shared/StatusBadge'
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
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { useSearch } from '@/hooks/use-search'
import { formatarHectares, plural, substituirPorId } from '@/lib/format'
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
    { errorPrefix: 'Não foi possível carregar as propriedades' },
  )
  const propriedades = data?.propriedades ?? []
  const empresas = data?.empresas ?? []

  const visiveis =
    filtroEmpresa === 'todas'
      ? propriedades
      : propriedades.filter((p) => p.empresa_id === Number(filtroEmpresa))

  const { query, setQuery, filtrados: buscadas } = useSearch(visiveis, (p) => [
    p.nome,
    p.municipio,
    p.estado,
    p.empresa.razao_social,
  ])

  const fechar = () => setDialogo({ modo: 'fechado' })

  function salva(propriedade: PropriedadeCompleta, nova: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      propriedades: substituirPorId(atual?.propriedades ?? [], propriedade).sort(
        porEmpresaENome,
      ),
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

  const opcoesEmpresa = [
    { value: 'todas', label: 'Todas as empresas' },
    ...empresas.map((e) => ({ value: String(e.id), label: e.razao_social })),
  ]

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
      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && !error && visiveis.length === 0 && (
        <EmptyState>
          {empresas.length === 0
            ? 'Cadastre uma empresa antes de cadastrar propriedades.'
            : 'Nenhuma propriedade cadastrada ainda.'}
        </EmptyState>
      )}

      {propriedades.length > 0 && (
        <DataCard
          title="Propriedades"
          shown={buscadas.length}
          total={propriedades.length}
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por nome ou município"
          filters={
            empresas.length > 1 && (
              <SelectField
                aria-label="Filtrar por empresa"
                value={filtroEmpresa}
                onValueChange={setFiltroEmpresa}
                options={opcoesEmpresa}
                className="h-9 w-56"
              />
            )
          }
        >
          {buscadas.length === 0 ? (
            <NoResults>Nenhuma propriedade encontrada com esses filtros.</NoResults>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriedade</TableHead>
                  <TableHead className="hidden sm:table-cell">Resumo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {buscadas.map((p) => {
                  const emUso = p.total_lotes > 0 || p.total_sensores > 0
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <EntityCell
                          icon={<WarehouseIcon />}
                          title={p.nome}
                          subtitle={`${p.municipio}/${p.estado} · ${p.empresa.razao_social}`}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="block text-sm tabular-nums">
                          {formatarHectares(p.area_total_ha)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.total_lotes} {plural(p.total_lotes, 'lote', 'lotes')} ·{' '}
                          {p.total_sensores} {plural(p.total_sensores, 'sensor', 'sensores')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={p.status === 'ATIVA' ? 'success' : 'neutral'}>
                          {p.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${p.nome}`}
                            title="Editar"
                            onClick={() => setDialogo({ modo: 'editar', propriedade: p })}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            aria-label={`Excluir ${p.nome}`}
                            onClick={() => excluir(p)}
                            disabled={emUso}
                            title={
                              emUso
                                ? 'Propriedade com lotes ou sensores não pode ser excluída; marque-a como inativa.'
                                : 'Excluir'
                            }
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
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
