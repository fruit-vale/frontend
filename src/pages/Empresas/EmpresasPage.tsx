import { useState } from 'react'
import {
  BuildingIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
  MailIcon,
  SendIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
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
import { useAction } from '@/hooks/use-action'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { plural, porTexto } from '@/lib/format'
import { limparCache } from '@/lib/request-cache'
import { empresasService } from '@/services'
import type { Empresa, EmpresaCriada } from '@/types/empresa'
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

function ContratoBadge({ empresa }: { empresa: Empresa }) {
  return empresa.contrato_status === 'ACEITO' ? (
    <StatusBadge tone="success">
      <CheckCircle2Icon />
      Contrato aceito
    </StatusBadge>
  ) : (
    <StatusBadge tone="warning">
      <ClockIcon />
      Contrato pendente
    </StatusBadge>
  )
}

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null

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
            <ContratoBadge empresa={empresa} />
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

function Detalhes({
  empresa,
  onReenviado,
  onEditar,
  onExcluida,
}: {
  empresa: Empresa
  onReenviado: (atualizada: Empresa) => void
  onEditar: () => void
  onExcluida: (id: number) => void
}) {
  const { run, pending, error } = useAction()
  const exclusao = useAction()
  const confirm = useConfirm()

  async function excluir() {
    const confirmado = await confirm({
      title: `Excluir ${empresa.razao_social}?`,
      description:
        `Serão apagados de forma definitiva: ${empresa.total_usuarios} ${plural(empresa.total_usuarios, 'usuário', 'usuários')}, ` +
        'todas as propriedades, lotes, culturas, sensores (inclusive o acesso deles ao broker) e leituras da empresa. ' +
        'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir empresa e todos os dados',
      destructive: true,
    })
    if (!confirmado) return
    const feito = await exclusao.run(async () => {
      await empresasService.excluir(empresa.id)
      return true
    }, 'Não foi possível excluir a empresa.')
    if (feito) onExcluida(empresa.id)
  }

  async function reenviar() {
    const envio = await run(
      () => empresasService.reenviarContrato(empresa.id),
      'Não foi possível reenviar o contrato.',
    )
    if (!envio) return
    onReenviado({ ...empresa, contrato_enviado_em: new Date().toISOString() })
    if (envio.enviado) toast.success(`Contrato reenviado para ${envio.email}.`)
    else
      toast.warning(
        'O e-mail não pôde ser enviado agora. Confira a configuração de SMTP da API e tente de novo.',
      )
  }

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
  const aceito = empresa.contrato_status === 'ACEITO'

  return (
    <div className="space-y-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{rotulo}</dt>
            <dd className="truncate text-sm font-medium">{valor || '—'}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm">Contrato de serviço</strong>
          <ContratoBadge empresa={empresa} />
        </div>
        {aceito ? (
          <p className="text-sm text-muted-foreground">
            {empresa.contrato_aceito_em
              ? `Aceito em ${dataHora(empresa.contrato_aceito_em)}.`
              : 'Empresa anterior ao contrato eletrônico: acesso liberado.'}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {empresa.contrato_enviado_em
                ? `Enviado para ${empresa.email ?? 'o e-mail cadastrado'} em ${dataHora(empresa.contrato_enviado_em)}. `
                : ''}
              Os usuários desta empresa só conseguem entrar depois do aceite.
            </p>
            <ErrorMessage message={error} />
            <Button type="button" variant="outline" onClick={reenviar} disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
              Reenviar contrato
            </Button>
          </>
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <ErrorMessage message={exclusao.error} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onEditar} disabled={exclusao.pending}>
            <PencilIcon />
            Editar dados
          </Button>
          <Button type="button" variant="destructive" onClick={excluir} disabled={exclusao.pending}>
            {exclusao.pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
            Excluir empresa
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function EmpresasPage() {
  const [nova, setNova] = useState(false)
  const [editando, setEditando] = useState<Empresa | null>(null)
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

  function adicionar({ contrato_envio, ...criada }: EmpresaCriada) {
    setData((atuais = []) => [...atuais, criada])
    setNova(false)
    if (contrato_envio.enviado)
      toast.success(`${criada.razao_social} cadastrada. Contrato enviado para ${contrato_envio.email}.`)
    else
      toast.warning(
        `${criada.razao_social} cadastrada, mas o e-mail do contrato não pôde ser enviado. Abra a empresa e use “Reenviar contrato”.`,
        { duration: 10000 },
      )
  }

  function atualizar(atualizada: Empresa) {
    setData((atuais = []) => atuais.map((e) => (e.id === atualizada.id ? atualizada : e)))
    setDetalhe(atualizada)
  }

  function salva(atualizada: Empresa) {
    atualizar(atualizada)
    setEditando(null)
    toast.success(`${atualizada.razao_social} atualizada.`)
  }

  function excluida(id: number) {
    const nome = empresas.find((e) => e.id === id)?.razao_social ?? 'Empresa'
    setData((atuais = []) => atuais.filter((e) => e.id !== id))
    setDetalhe(null)
    // usuários, propriedades e demais listas guardadas deixam de valer
    limparCache()
    toast.success(`${nome} e todos os dados dela foram excluídos.`)
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
        {detalhe && (
          <Detalhes
            empresa={detalhe}
            onReenviado={atualizar}
            onEditar={() => setEditando(detalhe)}
            onExcluida={excluida}
          />
        )}
      </AppDialog>

      <AppDialog
        open={editando !== null}
        onClose={() => setEditando(null)}
        title="Editar empresa"
        size="lg"
      >
        {editando && (
          <NovaEmpresaForm
            key={editando.id}
            empresa={editando}
            onSalva={salva}
            onCancelar={() => setEditando(null)}
          />
        )}
      </AppDialog>
    </section>
  )
}
