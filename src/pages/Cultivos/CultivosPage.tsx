import { useState } from 'react'
import {
  HistoryIcon,
  MapIcon,
  PencilIcon,
  PlusIcon,
  SproutIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { EmptyState, ErrorMessage } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarHectares, substituirPorId } from '@/lib/format'
import { culturasService, lotesService, propriedadesService } from '@/services'
import { nomeCultura, type CulturaResumo } from '@/types/cultura'
import { SITUACAO_LABELS, type Lote, type SituacaoLote } from '@/types/lote'
import type { Propriedade } from '@/types/propriedade'
import { HistoricoLote } from './HistoricoLote'
import { LoteForm } from './LoteForm'
import { MapaGeral } from './MapaGeral'
import { MapaLote } from './MapaLote'

type Dialogo =
  | { tipo: 'fechado' }
  | { tipo: 'novo' }
  | { tipo: 'editar'; lote: Lote }
  | { tipo: 'mapa'; lote: Lote }
  | { tipo: 'historico'; lote: Lote }

type Visao = 'lista' | 'mapa'

const SITUACAO_TONE: Record<SituacaoLote, Tone> = {
  EM_PREPARO: 'warning',
  EM_CULTIVO: 'success',
  COLHIDO: 'neutral',
}

const porNome = (a: Lote, b: Lote) =>
  a.propriedade.nome.localeCompare(b.propriedade.nome, 'pt-BR') ||
  a.nome_identificacao.localeCompare(b.nome_identificacao, 'pt-BR')

type Dados = {
  lotes: Lote[]
  propriedades: Propriedade[]
  culturas: CulturaResumo[]
}

export default function CultivosPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const podeEditar = user?.role === 'administrador' || user?.role === 'produtor'

  const [dialogo, setDialogo] = useState<Dialogo>({ tipo: 'fechado' })
  const [visao, setVisao] = useState<Visao>('lista')

  const { data, error, loading, setData } = useRequest<Dados>(
    async (signal) => {
      const [lotes, propriedades, culturas] = await Promise.all([
        lotesService.listar(signal),
        podeEditar ? propriedadesService.listar(signal) : Promise.resolve([]),
        podeEditar ? culturasService.listar(signal) : Promise.resolve([]),
      ])
      return { lotes, propriedades, culturas }
    },
    { key: String(podeEditar), errorPrefix: 'Não foi possível carregar os lotes' },
  )
  const lotes = data?.lotes ?? []
  const propriedades = data?.propriedades ?? []
  const culturas = data?.culturas ?? []

  const fechar = () => setDialogo({ tipo: 'fechado' })

  const atualizarLotes = (fn: (atuais: Lote[]) => Lote[]) =>
    setData((atual) => ({
      propriedades: atual?.propriedades ?? [],
      culturas: atual?.culturas ?? [],
      lotes: fn(atual?.lotes ?? []),
    }))

  /** Colheita ou nova safra mudam cultura/situação: recarrega o lote. */
  function recarregarLote(id: number) {
    lotesService
      .buscar(id)
      .then((lote) => {
        atualizarLotes((atuais) => atuais.map((l) => (l.id === lote.id ? lote : l)))
        setDialogo((atual) => (atual.tipo === 'historico' ? { ...atual, lote } : atual))
      })
      .catch(() => undefined)
  }

  function salvo(lote: Lote, novo: boolean) {
    atualizarLotes((atuais) => substituirPorId(atuais, lote).sort(porNome))
    setDialogo({ tipo: 'mapa', lote })
    toast.success(novo ? 'Lote cadastrado.' : 'Alterações salvas.')
  }

  async function excluir(lote: Lote) {
    const confirmado = await confirm({
      title: `Excluir o lote ${lote.nome_identificacao}?`,
      description: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!confirmado) return

    try {
      await lotesService.excluir(lote.id)
      atualizarLotes((atuais) => atuais.filter((l) => l.id !== lote.id))
      toast.success('Lote excluído.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Erro ao excluir.'))
    }
  }

  const titulo =
    dialogo.tipo === 'novo'
      ? 'Novo lote'
      : dialogo.tipo === 'editar'
        ? `Editar ${dialogo.lote.nome_identificacao}`
        : dialogo.tipo === 'mapa'
          ? `${dialogo.lote.nome_identificacao} — ${dialogo.lote.propriedade.nome}`
          : dialogo.tipo === 'historico'
            ? `Histórico de cultivo — ${dialogo.lote.nome_identificacao}`
            : ''

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Gestão agrícola"
        title="Cultivos e Lotes"
        description="Cadastre os lotes, marque cada um no mapa e acompanhe o cultivo."
        actions={
          podeEditar && (
            <Button
              size="lg"
              onClick={() => setDialogo({ tipo: 'novo' })}
              disabled={loading || !!error}
            >
              <PlusIcon />
              Novo lote
            </Button>
          )
        }
      />

      <AppDialog
        open={dialogo.tipo !== 'fechado'}
        onClose={fechar}
        title={titulo}
        size="xl"
      >
        {(dialogo.tipo === 'novo' || dialogo.tipo === 'editar') && (
          <LoteForm
            // remonta ao trocar de lote, para reiniciar o formulário
            key={dialogo.tipo === 'editar' ? dialogo.lote.id : 'novo'}
            propriedades={propriedades}
            culturas={culturas}
            lotes={lotes}
            lote={dialogo.tipo === 'editar' ? dialogo.lote : undefined}
            onSalvo={salvo}
            onCancelar={fechar}
          />
        )}
        {dialogo.tipo === 'mapa' && (
          <MapaLote key={dialogo.lote.id} lote={dialogo.lote} lotes={lotes} />
        )}
        {dialogo.tipo === 'historico' && (
          <HistoricoLote
            key={dialogo.lote.id}
            lote={dialogo.lote}
            culturas={culturas}
            podeEditar={podeEditar}
            onLoteAlterado={() => recarregarLote(dialogo.lote.id)}
          />
        )}
      </AppDialog>

      <ErrorMessage message={error} />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}

      {!loading && !error && lotes.length === 0 && (
        <EmptyState>Nenhum lote cadastrado ainda.</EmptyState>
      )}

      {lotes.length > 0 && (
        <Tabs value={visao} onValueChange={(v) => setVisao(v as Visao)}>
          <TabsList aria-label="Como ver os lotes">
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {lotes.length > 0 && visao === 'mapa' && (
        <MapaGeral lotes={lotes} onAbrir={(lote) => setDialogo({ tipo: 'mapa', lote })} />
      )}

      {lotes.length > 0 && visao === 'lista' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lotes.map((lote) => (
            <Card key={lote.id}>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                    aria-hidden="true"
                  >
                    <SproutIcon className="size-5" />
                  </span>
                  <StatusBadge tone={SITUACAO_TONE[lote.situacao]}>
                    {SITUACAO_LABELS[lote.situacao]}
                  </StatusBadge>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{lote.nome_identificacao}</h2>
                  <p className="text-sm text-muted-foreground">
                    {nomeCultura(lote.cultura)} · {lote.propriedade.nome}
                    {user?.role === 'administrador' && ` · ${lote.empresa.razao_social}`}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Dado rotulo="Área" valor={formatarHectares(lote.area_ha)} />
                  <Dado rotulo="Plantio" valor={formatarData(lote.data_plantio)} />
                  <Dado rotulo="Colheita prevista" valor={formatarData(lote.previsao_colheita)} />
                  <Dado rotulo="Sensores" valor={lote.total_sensores} />
                  <Dado rotulo="Safras" valor={lote.total_safras} />
                </dl>

                <div className="mt-auto flex flex-wrap gap-1 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogo({ tipo: 'historico', lote })}
                  >
                    <HistoryIcon />
                    Histórico
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogo({ tipo: 'mapa', lote })}
                  >
                    <MapIcon />
                    {lote.geometria ? 'Ver no mapa' : 'Sem mapa'}
                  </Button>
                  {podeEditar && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialogo({ tipo: 'editar', lote })}
                      >
                        <PencilIcon />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => excluir(lote)}
                        disabled={lote.total_alertas > 0}
                        title={
                          lote.total_alertas > 0
                            ? 'Lote com alertas não pode ser excluído; marque-o como colhido.'
                            : undefined
                        }
                      >
                        <Trash2Icon />
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  )
}
