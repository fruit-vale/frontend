import { useState } from 'react'
import { PencilIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { DataCard, NoResults } from '@/components/shared/DataCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useRequest } from '@/hooks/use-request'
import { useSearch } from '@/hooks/use-search'
import { porTexto, substituirPorId } from '@/lib/format'
import { empresasService, usuariosService } from '@/services'
import { ROLE_LABELS, type Role } from '@/types/auth'
import type { Usuario } from '@/types/usuario'
import { UsuarioForm } from './UsuarioForm'

type Dialogo =
  | { modo: 'fechado' }
  | { modo: 'novo' }
  | { modo: 'editar'; usuario: Usuario }

const ROLE_TONE: Record<Role, Tone> = {
  administrador: 'primary',
  produtor: 'success',
  analista: 'warning',
}

export default function UsuariosPage() {
  const [dialogo, setDialogo] = useState<Dialogo>({ modo: 'fechado' })

  const { data, error, loading, setData } = useRequest(
    async (signal) => {
      const [usuarios, empresas] = await Promise.all([
        usuariosService.listar(signal),
        empresasService.listar(signal),
      ])
      return { usuarios, empresas }
    },
    { errorPrefix: 'Não foi possível carregar os usuários' },
  )
  const usuarios = data?.usuarios ?? []
  const empresas = data?.empresas ?? []

  const { query, setQuery, filtrados } = useSearch(usuarios, (u) => [
    u.nome,
    u.email,
    u.empresa?.razao_social,
  ])

  function salvo(usuario: Usuario, novo: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      usuarios: substituirPorId(atual?.usuarios ?? [], usuario).sort(
        porTexto((u) => u.nome),
      ),
    }))
    setDialogo({ modo: 'fechado' })
    toast.success(novo ? `${usuario.nome} cadastrado.` : 'Alterações salvas.')
  }

  const fechar = () => setDialogo({ modo: 'fechado' })

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Cadastre contas, defina o perfil e vincule cada usuário à sua empresa."
        actions={
          <Button size="lg" onClick={() => setDialogo({ modo: 'novo' })} disabled={loading || !!error}>
            <PlusIcon />
            Novo usuário
          </Button>
        }
      />

      <AppDialog
        open={dialogo.modo !== 'fechado'}
        onClose={fechar}
        title={dialogo.modo === 'editar' ? `Editar ${dialogo.usuario.nome}` : 'Novo usuário'}
        size="lg"
      >
        {dialogo.modo !== 'fechado' && (
          <UsuarioForm
            key={dialogo.modo === 'editar' ? dialogo.usuario.id : 'novo'}
            usuario={dialogo.modo === 'editar' ? dialogo.usuario : undefined}
            empresas={empresas}
            onSalvo={salvo}
            onCancelar={fechar}
          />
        )}
      </AppDialog>

      <ErrorMessage message={error} />
      {loading && <Skeleton className="h-48 w-full" />}

      {!loading && !error && usuarios.length === 0 && (
        <EmptyState>Nenhum usuário cadastrado.</EmptyState>
      )}

      {usuarios.length > 0 && (
        <DataCard
          title="Usuários"
          shown={filtrados.length}
          total={usuarios.length}
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por nome, e-mail ou empresa"
        >
          {filtrados.length === 0 ? (
            <NoResults>Nenhum usuário encontrado para “{query}”.</NoResults>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-semibold">
                            {usuario.nome}
                          </strong>
                          <span className="block truncate text-xs text-muted-foreground">
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-0.5">
                        <StatusBadge tone={usuario.role ? ROLE_TONE[usuario.role] : 'neutral'}>
                          {usuario.role ? ROLE_LABELS[usuario.role] : 'Sem perfil'}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {usuario.empresa?.razao_social ?? 'Plataforma'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${usuario.nome}`}
                        title="Editar"
                        onClick={() => setDialogo({ modo: 'editar', usuario })}
                      >
                        <PencilIcon />
                      </Button>
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
