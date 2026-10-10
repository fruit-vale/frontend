import { useState } from 'react'
import { PencilIcon, PlusIcon, SproutIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { DataCard, EntityCell, NoResults } from '@/components/shared/DataCard'
import { PageHeader } from '@/components/shared/PageHeader'
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
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { useSearch } from '@/hooks/use-search'
import { substituirPorId } from '@/lib/format'
import { culturasService, empresasService } from '@/services'
import { nomeCultura, type Cultura } from '@/types/cultura'
import { CulturaForm } from './CulturaForm'

type Dialogo =
  | { modo: 'fechado' }
  | { modo: 'novo' }
  | { modo: 'editar'; cultura: Cultura }

function faixa(min: number | null, max: number | null, unidade: string) {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) return `${min} a ${max} ${unidade}`
  return min !== null ? `a partir de ${min} ${unidade}` : `até ${max} ${unidade}`
}

const porNome = (a: Cultura, b: Cultura) =>
  a.nome.localeCompare(b.nome, 'pt-BR') ||
  (a.variedade ?? '').localeCompare(b.variedade ?? '', 'pt-BR')

export default function CulturasPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const admin = user?.role === 'administrador'
  const [dialogo, setDialogo] = useState<Dialogo>({ modo: 'fechado' })

  const { data, error, loading, setData } = useRequest(
    async (signal) => {
      const [culturas, empresas] = await Promise.all([
        culturasService.listar(signal),
        admin ? empresasService.listar(signal) : Promise.resolve([]),
      ])
      return { culturas, empresas }
    },
    { key: String(admin), errorPrefix: 'Não foi possível carregar as culturas' },
  )
  const culturas = data?.culturas ?? []
  const empresas = data?.empresas ?? []

  const { query, setQuery, filtrados: filtradas } = useSearch(culturas, (c) => [
    c.nome,
    c.variedade,
    c.empresa?.razao_social,
  ])

  /** Produtor só altera as culturas da própria empresa. */
  const podeAlterar = (c: Cultura) => admin || c.empresa !== null
  const origem = (c: Cultura) =>
    c.empresa === null ? 'Plataforma' : admin ? c.empresa.razao_social : 'Sua empresa'

  const fechar = () => setDialogo({ modo: 'fechado' })

  function salva(cultura: Cultura, nova: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      culturas: substituirPorId(atual?.culturas ?? [], cultura).sort(porNome),
    }))
    fechar()
    toast.success(nova ? 'Cultura cadastrada.' : 'Alterações salvas.')
  }

  async function excluir(cultura: Cultura) {
    const confirmado = await confirm({
      title: `Excluir a cultura ${nomeCultura(cultura)}?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!confirmado) return

    try {
      await culturasService.excluir(cultura.id)
      setData((atual) => ({
        empresas: atual?.empresas ?? [],
        culturas: (atual?.culturas ?? []).filter((c) => c.id !== cultura.id),
      }))
      toast.success('Cultura excluída.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Erro ao excluir.'))
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={admin ? 'Administração' : 'Gestão agrícola'}
        title="Culturas"
        description={
          admin
            ? 'Culturas da plataforma e de cada empresa, com as condições ideais usadas nos alertas.'
            : `Culturas de ${user?.empresa?.razao_social ?? 'sua empresa'} e da plataforma, disponíveis para os seus lotes.`
        }
        actions={
          <Button size="lg" onClick={() => setDialogo({ modo: 'novo' })}>
            <PlusIcon />
            Nova cultura
          </Button>
        }
      />

      <AppDialog
        open={dialogo.modo !== 'fechado'}
        onClose={fechar}
        title={dialogo.modo === 'editar' ? 'Editar cultura' : 'Nova cultura'}
        size="lg"
      >
        {dialogo.modo !== 'fechado' && (
          <CulturaForm
            key={dialogo.modo === 'editar' ? dialogo.cultura.id : 'nova'}
            cultura={dialogo.modo === 'editar' ? dialogo.cultura : undefined}
            empresas={empresas}
            onSalva={salva}
            onCancelar={fechar}
          />
        )}
      </AppDialog>

      <ErrorMessage message={error} />
      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && !error && culturas.length === 0 && (
        <EmptyState>Nenhuma cultura cadastrada ainda.</EmptyState>
      )}

      {culturas.length > 0 && (
        <DataCard
          title="Culturas"
          shown={filtradas.length}
          total={culturas.length}
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por cultura ou variedade"
        >
          {filtradas.length === 0 ? (
            <NoResults>Nenhuma cultura encontrada para “{query}”.</NoResults>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cultura</TableHead>
                  <TableHead className="hidden sm:table-cell">Condições ideais</TableHead>
                  <TableHead className="text-right">Lotes</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((cultura) => (
                  <TableRow key={cultura.id}>
                    <TableCell>
                      <EntityCell
                        icon={<SproutIcon />}
                        title={cultura.variedade ? `${cultura.nome} — ${cultura.variedade}` : cultura.nome}
                        subtitle={origem(cultura)}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="block text-sm">
                        {faixa(cultura.temp_recomendada_min, cultura.temp_recomendada_max, '°C')}
                        {' · '}
                        {faixa(cultura.umidade_recomendada_min, cultura.umidade_recomendada_max, '%')}
                      </span>
                      {cultura.ciclo_medio_dias && (
                        <span className="text-xs text-muted-foreground">
                          Ciclo de {cultura.ciclo_medio_dias} dias
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{cultura.total_lotes}</TableCell>
                    <TableCell>
                      {podeAlterar(cultura) ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${nomeCultura(cultura)}`}
                            title="Editar"
                            onClick={() => setDialogo({ modo: 'editar', cultura })}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            aria-label={`Excluir ${nomeCultura(cultura)}`}
                            onClick={() => excluir(cultura)}
                            disabled={cultura.total_lotes > 0}
                            title={
                              cultura.total_lotes > 0
                                ? 'Cultura usada em lotes não pode ser excluída.'
                                : 'Excluir'
                            }
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="block text-right text-xs text-muted-foreground"
                          title="Culturas da plataforma são mantidas pelo administrador."
                        >
                          Só leitura
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DataCard>
      )}
    </section>
  )
}
