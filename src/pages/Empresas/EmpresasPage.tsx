import { useState } from 'react'
import {
  BuildingIcon,
  ChevronRightIcon,
  MailIcon,
  MapPinIcon,
  PlusIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppDialog } from '@/components/shared/AppDialog'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequest } from '@/hooks/use-request'
import { plural, porTexto } from '@/lib/format'
import { empresasService } from '@/services'
import type { Empresa } from '@/types/empresa'
import { NovaEmpresaForm } from './NovaEmpresaForm'

const local = (e: Empresa) => [e.cidade, e.estado].filter(Boolean).join(' / ')

function Linha({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
      {icone}
      <span className="truncate">{children}</span>
    </span>
  )
}

function CartaoEmpresa({ empresa, onAbrir }: { empresa: Empresa; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-haspopup="dialog"
      className="h-full w-full rounded-xl text-left transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card size="sm" className="h-full">
        <CardContent className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
            aria-hidden="true"
          >
            <BuildingIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <strong className="block truncate">{empresa.razao_social}</strong>
            <small className="block text-xs text-muted-foreground">{empresa.cpf_cnpj}</small>
            <div className="flex flex-col gap-0.5 pt-1">
              {local(empresa) && <Linha icone={<MapPinIcon />}>{local(empresa)}</Linha>}
              {empresa.responsavel && <Linha icone={<UserIcon />}>{empresa.responsavel}</Linha>}
              {empresa.email && <Linha icone={<MailIcon />}>{empresa.email}</Linha>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge tone="primary">
              <UsersIcon />
              {empresa.total_usuarios}
            </StatusBadge>
            <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function Detalhes({ empresa }: { empresa: Empresa }) {
  const campos: [string, string | null][] = [
    ['CNPJ', empresa.cpf_cnpj],
    ['Responsável', empresa.responsavel],
    ['E-mail', empresa.email],
    ['Telefone', empresa.telefone],
    ['Cidade / estado', local(empresa) || null],
    [
      'Usuários vinculados',
      `${empresa.total_usuarios} ${plural(empresa.total_usuarios, 'usuário', 'usuários')}`,
    ],
  ]
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {campos.map(([rotulo, valor]) => (
        <div key={rotulo} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{rotulo}</dt>
          <dd className="truncate text-sm font-medium">{valor || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function EmpresasPage() {
  const [nova, setNova] = useState(false)
  const [detalhe, setDetalhe] = useState<Empresa | null>(null)
  const {
    data: empresas = [],
    error,
    loading,
    setData,
  } = useRequest((signal) => empresasService.listar(signal), {
    errorPrefix: 'Não foi possível carregar as empresas',
    cacheKey: 'empresas',
  })

  const ordenadas = [...empresas].sort(porTexto((e) => e.razao_social))
  const usuarios = empresas.reduce((soma, e) => soma + e.total_usuarios, 0)
  const estados = new Set(empresas.map((e) => e.estado).filter(Boolean)).size

  function adicionar(criada: Empresa) {
    setData((atuais = []) => [...atuais, criada])
    setNova(false)
    toast.success(`${criada.razao_social} cadastrada.`)
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Empresas"
        description="Empresas clientes da plataforma e seus usuários vinculados."
        actions={
          <Button size="lg" onClick={() => setNova(true)}>
            <PlusIcon />
            Nova empresa
          </Button>
        }
      />

      <ErrorMessage message={error} />

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Empresas" value={empresas.length} icon={<BuildingIcon />} loading={loading} />
        <StatCard
          label="Usuários vinculados"
          value={usuarios}
          icon={<UsersIcon />}
          loading={loading}
        />
        <StatCard
          label="Estados atendidos"
          value={estados}
          icon={<MapPinIcon />}
          loading={loading}
        />
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <ListaPaginada
          itens={ordenadas}
          campos={(e) => [e.razao_social, e.cpf_cnpj, e.responsavel, e.email, e.cidade, e.estado]}
          rotuloBusca="Buscar por nome, CNPJ, responsável ou cidade"
          vazio="Nenhuma empresa cadastrada ainda. Use “Nova empresa” para começar."
          porPagina={8}
          listaClassName="grid gap-3 md:grid-cols-2"
          renderItem={(e) => <CartaoEmpresa empresa={e} onAbrir={() => setDetalhe(e)} />}
        />
      )}

      <AppDialog open={nova} onClose={() => setNova(false)} title="Nova empresa" size="lg">
        <NovaEmpresaForm onCriada={adicionar} onCancelar={() => setNova(false)} />
      </AppDialog>

      <AppDialog
        open={detalhe !== null}
        onClose={() => setDetalhe(null)}
        title={detalhe?.razao_social ?? ''}
        description="Dados cadastrais da empresa."
      >
        {detalhe && <Detalhes empresa={detalhe} />}
      </AppDialog>
    </section>
  )
}
