import {
  ChevronRightIcon,
  LockKeyholeIcon,
  MailIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from '@/types/auth'

const ROLE_TONE: Record<Role, Tone> = {
  administrador: 'primary',
  produtor: 'success',
  analista: 'warning',
}

const OPCOES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: UserRoundIcon, title: 'Dados do perfil', description: 'Nome, empresa e informações pessoais' },
  { icon: MailIcon, title: 'Alterar e-mail', description: 'Atualize o e-mail utilizado na sua conta' },
  { icon: LockKeyholeIcon, title: 'Alterar senha', description: 'Mantenha sua conta segura' },
  { icon: SlidersHorizontalIcon, title: 'Preferências', description: 'Personalize sua experiência no FruitVale' },
]

export default function PerfilPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Minha conta"
        title="Perfil"
        description="Gerencie suas informações e preferências da conta."
      />

      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-xl text-primary-foreground">
              {user.nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <h2 className="truncate text-xl font-semibold">{user.nome}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.empresa?.razao_social ?? 'Plataforma FruitVale'}
            </p>
            <StatusBadge tone={ROLE_TONE[user.role]} className="mt-1">
              {ROLE_LABELS[user.role]}
            </StatusBadge>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionHeader
          eyebrow="Configurações da conta"
          title="Preferências e segurança"
          description="Gerencie seus dados e as configurações de acesso à sua conta."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {OPCOES.map(({ icon: Icone, title, description }) => (
            <button
              key={title}
              type="button"
              className="flex items-center gap-3 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Icone className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{title}</strong>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <Card size="sm">
        <CardContent className="space-y-1">
          <h3 className="font-semibold">Permissões do perfil</h3>
          <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[user.role]}</p>
        </CardContent>
      </Card>
    </section>
  )
}
