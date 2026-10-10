import { useState } from 'react'
import {
  BuildingIcon,
  PhoneIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  SproutIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppDialog } from '@/components/shared/AppDialog'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { EntityCard } from '@/components/shared/EntityCard'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PageHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { porTexto, substituirPorId } from '@/lib/format'
import { empresasService, usuariosService } from '@/services'
import { ROLE_LABELS, ROLES, type Role } from '@/types/auth'
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

const ROLE_ICONE: Record<Role, React.ReactNode> = {
  administrador: <ShieldCheckIcon />,
  produtor: <SproutIcon />,
  analista: <UserIcon />,
}

const ROLE_PLURAL: Record<Role, string> = {
  administrador: 'Administradores',
  produtor: 'Produtores',
  analista: 'Analistas',
}

export default function UsuariosPage() {
  const [dialogo, setDialogo] = useState<Dialogo>({ modo: 'fechado' })
  const [perfil, setPerfil] = useState('todos')

  const { data, error, loading, setData } = useRequest(
    async (signal) => {
      const [usuarios, empresas] = await Promise.all([
        usuariosService.listar(signal),
        empresasService.listar(signal),
      ])
      return { usuarios, empresas }
    },
    { errorPrefix: 'Não foi possível carregar os usuários', cacheKey: 'pagina-usuarios' },
  )
  const usuarios = data?.usuarios ?? []
  const empresas = data?.empresas ?? []

  const contar = (role: Role) => usuarios.filter((u) => u.role === role).length
  const visiveis = usuarios
    .filter((u) => perfil === 'todos' || u.role === perfil)
    .sort(porTexto((u) => u.nome))

  function salvo(usuario: Usuario, novo: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      usuarios: substituirPorId(atual?.usuarios ?? [], usuario),
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

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuários" value={usuarios.length} icon={<UsersIcon />} loading={loading} />
        {ROLES.map((role) => (
          <StatCard
            key={role}
            label={ROLE_PLURAL[role]}
            value={contar(role)}
            icon={ROLE_ICONE[role]}
            loading={loading}
          />
        ))}
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <ListaPaginada
          itens={visiveis}
          campos={(u) => [u.nome, u.email, u.empresa?.razao_social]}
          rotuloBusca="Buscar por nome, e-mail ou empresa"
          vazio="Nenhum usuário encontrado."
          porPagina={9}
          listaClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          filtros={
            <SelectField
              aria-label="Filtrar por perfil"
              value={perfil}
              onValueChange={setPerfil}
              options={[
                { value: 'todos', label: 'Todos os perfis' },
                ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              ]}
              className="h-9 w-48"
            />
          }
          renderItem={(usuario) => (
            <EntityCard
              icon={<span className="text-base font-semibold">{usuario.nome.charAt(0).toUpperCase()}</span>}
              title={usuario.nome}
              subtitle={usuario.email}
              badge={
                <StatusBadge tone={usuario.role ? ROLE_TONE[usuario.role] : 'neutral'}>
                  {usuario.role ? ROLE_LABELS[usuario.role] : 'Sem perfil'}
                </StatusBadge>
              }
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar ${usuario.nome}`}
                  onClick={() => setDialogo({ modo: 'editar', usuario })}
                >
                  <PencilIcon />
                  Editar
                </Button>
              }
            >
              <div className="flex flex-col gap-1 text-xs text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
                <span className="flex items-center gap-1.5">
                  <BuildingIcon />
                  <span className="truncate">{usuario.empresa?.razao_social ?? 'Plataforma'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon />
                  <span className="truncate">{usuario.telefone || 'Sem telefone'}</span>
                </span>
              </div>
            </EntityCard>
          )}
        />
      )}
    </section>
  )
}
