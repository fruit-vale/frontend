import { useState } from 'react'
import {
  CpuIcon,
  HistoryIcon,
  LayersIcon,
  RulerIcon,
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
import { Dados, EntityCard } from '@/components/shared/EntityCard'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PageHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarHectares, formatarNumero, substituirPorId } from '@/lib/format'
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
  const [situacao, setSituacao] = useState('todas')

  const { data, error, loading, setData } = useRequest<Dados>(
    async (signal) => {
      const [lotes, propriedades, culturas] = await Promise.all([
        lotesService.listar(signal),
        podeEditar ? propriedadesService.listar(signal) : Promise.resolve([]),
        podeEditar ? culturasService.listar(signal) : Promise.resolve([]),
      ])
      return { lotes, propriedades, culturas }
    },
    {
      key: String(podeEditar),
      errorPrefix: 'Não foi possível carregar os lotes',
      cacheKey: 'pagina-cultivos',
    },
  )
  const lotes = data?.lotes ?? []
  const propriedades = data?.propriedades ?? []
  const culturas = data?.culturas ?? []

  const visiveis = lotes.filter((l) => situacao === 'todas' || l.situacao === situacao)
  const emCultivo = lotes.filter((l) => l.situacao === 'EM_CULTIVO').length
  const area = lotes.reduce((soma, l) => soma + (l.area_ha ?? 0), 0)
  const sensores = lotes.reduce((soma, l) => soma + l.total_sensores, 0)

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
        size={dialogo.tipo === 'historico' ? 'lg' : 'xl'}
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

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lotes" value={lotes.length} icon={<LayersIcon />} loading={loading} />
        <StatCard label="Em cultivo" value={emCultivo} icon={<SproutIcon />} loading={loading} />
        <StatCard
          label="Área cadastrada"
          value={`${formatarNumero(area)} ha`}
          icon={<RulerIcon />}
          loading={loading}
        />
        <StatCard label="Sensores" value={sensores} icon={<CpuIcon />} loading={loading} />
      </section>

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
        <ListaPaginada
          itens={visiveis}
          campos={(l) => [
            l.nome_identificacao,
            l.cultura.nome,
            l.cultura.variedade,
            l.propriedade.nome,
            l.empresa.razao_social,
          ]}
          rotuloBusca="Buscar por lote, cultura ou propriedade"
          vazio="Nenhum lote encontrado."
          porPagina={9}
          listaClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          filtros={
            <SelectField
              aria-label="Filtrar por situação"
              value={situacao}
              onValueChange={setSituacao}
              options={[
                { value: 'todas', label: 'Todas as situações' },
                ...(Object.keys(SITUACAO_LABELS) as SituacaoLote[]).map((s) => ({
                  value: s,
                  label: SITUACAO_LABELS[s],
                })),
              ]}
              className="h-9 w-48"
            />
          }
          renderItem={(lote) => (
            <EntityCard
              icon={<SproutIcon />}
              title={lote.nome_identificacao}
              subtitle={`${nomeCultura(lote.cultura)} · ${lote.propriedade.nome}${
                user?.role === 'administrador' ? ` · ${lote.empresa.razao_social}` : ''
              }`}
              badge={
                <StatusBadge tone={SITUACAO_TONE[lote.situacao]}>
                  {SITUACAO_LABELS[lote.situacao]}
                </StatusBadge>
              }
              actions={
                <>
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
                </>
              }
            >
              <Dados
                itens={[
                  ['Área', formatarHectares(lote.area_ha)],
                  ['Plantio', formatarData(lote.data_plantio)],
                  ['Colheita prevista', formatarData(lote.previsao_colheita)],
                  ['Sensores', lote.total_sensores],
                  ['Safras', lote.total_safras],
                ]}
              />
            </EntityCard>
          )}
        />
      )}
    </section>
  )
}
