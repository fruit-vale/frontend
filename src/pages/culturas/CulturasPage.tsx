import { useState } from 'react'
import { BuildingIcon, LayersIcon, PencilIcon, PlusIcon, SproutIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { AppDialog } from '@/components/shared/AppDialog'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { Dados, EntityCard } from '@/components/shared/EntityCard'
import { ListaPaginada } from '@/components/shared/ListaPaginada'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
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
    {
      key: String(admin),
      errorPrefix: 'Não foi possível carregar as culturas',
      cacheKey: 'pagina-culturas',
    },
  )
  const culturas = [...(data?.culturas ?? [])].sort(porNome)
  const empresas = data?.empresas ?? []

  const daPlataforma = culturas.filter((c) => c.empresa === null).length
  const emUso = culturas.filter((c) => c.total_lotes > 0).length

  /** Produtor só altera as culturas da própria empresa. */
  const podeAlterar = (c: Cultura) => admin || c.empresa !== null
  const origem = (c: Cultura) =>
    c.empresa === null ? 'Plataforma' : admin ? c.empresa.razao_social : 'Sua empresa'

  const fechar = () => setDialogo({ modo: 'fechado' })

  function salva(cultura: Cultura, nova: boolean) {
    setData((atual) => ({
      empresas: atual?.empresas ?? [],
      culturas: substituirPorId(atual?.culturas ?? [], cultura),
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

      <section aria-label="Resumo" className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Culturas" value={culturas.length} icon={<SproutIcon />} loading={loading} />
        <StatCard
          label="Da plataforma"
          value={daPlataforma}
          icon={<LayersIcon />}
          loading={loading}
        />
        <StatCard
          label="Em uso em lotes"
          value={emUso}
          icon={<BuildingIcon />}
          loading={loading}
        />
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (
        <ListaPaginada
          itens={culturas}
          campos={(c) => [c.nome, c.variedade, c.empresa?.razao_social]}
          rotuloBusca="Buscar por cultura, variedade ou empresa"
          vazio="Nenhuma cultura cadastrada ainda."
          porPagina={9}
          listaClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          renderItem={(cultura) => (
            <EntityCard
              icon={<SproutIcon />}
              title={nomeCultura(cultura)}
              subtitle={origem(cultura)}
              badge={
                cultura.empresa === null ? (
                  <StatusBadge tone="primary">Plataforma</StatusBadge>
                ) : undefined
              }
              actions={
                podeAlterar(cultura) ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar ${nomeCultura(cultura)}`}
                      onClick={() => setDialogo({ modo: 'editar', cultura })}
                    >
                      <PencilIcon />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label={`Excluir ${nomeCultura(cultura)}`}
                      onClick={() => excluir(cultura)}
                      disabled={cultura.total_lotes > 0}
                      title={
                        cultura.total_lotes > 0
                          ? 'Cultura usada em lotes não pode ser excluída.'
                          : undefined
                      }
                    >
                      <Trash2Icon />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <span
                    className="text-xs text-muted-foreground"
                    title="Culturas da plataforma são mantidas pelo administrador."
                  >
                    Só leitura
                  </span>
                )
              }
            >
              <Dados
                itens={[
                  ['Temperatura', faixa(cultura.temp_recomendada_min, cultura.temp_recomendada_max, '°C')],
                  [
                    'Umidade',
                    faixa(cultura.umidade_recomendada_min, cultura.umidade_recomendada_max, '%'),
                  ],
                  ['Ciclo', cultura.ciclo_medio_dias ? `${cultura.ciclo_medio_dias} dias` : '—'],
                  [
                    'Graus-dia',
                    cultura.graus_dia_ciclo && cultura.temp_base_graus_dia !== null
                      ? `${cultura.graus_dia_ciclo.toLocaleString('pt-BR')} (base ${cultura.temp_base_graus_dia} °C)`
                      : '—',
                  ],
                  ['Lotes', cultura.total_lotes],
                ]}
              />
            </EntityCard>
          )}
        />
      )}
    </section>
  )
}
