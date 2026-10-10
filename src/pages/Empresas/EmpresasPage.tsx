import { useState } from 'react'
import { BuildingIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { DataCard, EntityCell, NoResults } from '@/components/shared/DataCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { useSearch } from '@/hooks/use-search'
import { porTexto } from '@/lib/format'
import { empresasService } from '@/services'
import type { Empresa } from '@/types/empresa'
import { NovaEmpresaForm } from './NovaEmpresaForm'

export default function EmpresasPage() {
  const [dialogAberto, setDialogAberto] = useState(false)
  const { data: empresas = [], error, loading, setData } = useRequest(
    (signal) => empresasService.listar(signal),
    { errorPrefix: 'Não foi possível carregar as empresas' },
  )

  const { query, setQuery, filtrados: filtradas } = useSearch(empresas, (e) => [
    e.razao_social,
    e.cpf_cnpj,
    e.responsavel,
    e.cidade,
    e.estado,
  ])

  function adicionar(criada: Empresa) {
    setData((atuais = []) =>
      [...atuais, criada].sort(porTexto((e) => e.razao_social)),
    )
    setDialogAberto(false)
    toast.success(`${criada.razao_social} cadastrada.`)
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Empresas"
        description="Empresas clientes da plataforma e seus usuários vinculados."
        actions={
          <Button size="lg" onClick={() => setDialogAberto(true)}>
            <PlusIcon />
            Nova empresa
          </Button>
        }
      />

      <AppDialog
        open={dialogAberto}
        onClose={() => setDialogAberto(false)}
        title="Nova empresa"
        size="lg"
      >
        <NovaEmpresaForm
          onCriada={adicionar}
          onCancelar={() => setDialogAberto(false)}
        />
      </AppDialog>

      <ErrorMessage message={error} />

      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && !error && empresas.length === 0 && (
        <EmptyState>Nenhuma empresa cadastrada ainda.</EmptyState>
      )}

      {empresas.length > 0 && (
        <DataCard
          title="Empresas"
          shown={filtradas.length}
          total={empresas.length}
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por nome, CNPJ ou cidade"
        >
          {filtradas.length === 0 ? (
            <NoResults>Nenhuma empresa encontrada para “{query}”.</NoResults>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">Local</TableHead>
                  <TableHead className="text-right">Usuários</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <EntityCell
                        icon={<BuildingIcon />}
                        title={empresa.razao_social}
                        subtitle={empresa.cpf_cnpj}
                      />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {[empresa.cidade, empresa.estado].filter(Boolean).join(' / ') || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge tone="primary">{empresa.total_usuarios}</StatusBadge>
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
