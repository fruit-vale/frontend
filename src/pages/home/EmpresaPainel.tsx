import { useState, type ReactNode } from 'react'
import { BuildingIcon, CpuIcon, MapPinIcon, RadioIcon, SproutIcon } from 'lucide-react'
import { AppDialog } from '@/components/shared/AppDialog'
import { Hint } from '@/components/shared/EmptyState'
import { SectionHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge, type Tone } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { formatarHectares, formatarNumero, plural } from '@/lib/format'
import { MapaGeral } from '@/pages/cultivos/MapaGeral'
import { MapaLote } from '@/pages/cultivos/MapaLote'
import type { Lote } from '@/types/lote'
import type { Painel, StatusCultivo } from '@/types/painel'

const STATUS_CULTIVO: Record<StatusCultivo, { rotulo: string; tom: Tone }> = {
  normal: { rotulo: 'Dentro do ideal', tom: 'success' },
  atencao: { rotulo: 'Atenção', tom: 'warning' },
  sem_dados: { rotulo: 'Sem leituras recentes', tom: 'neutral' },
  sem_faixa: { rotulo: 'Sem faixa ideal', tom: 'neutral' },
}

type Props = {
  empresa: string
  painel: Painel | null
  loading: boolean
  /** Botões do cabeçalho (ex.: novo lote, previsão do tempo). */
  acoes?: ReactNode
}

/**
 * Topo da tela inicial de quem pertence a uma empresa (produtor e analista):
 * números e culturas só da própria empresa. A API já devolve /painel e /lotes
 * no escopo do usuário.
 */
export function EmpresaPainel({ empresa, painel, loading, acoes }: Props) {
  const resumo = painel?.resumo
  const culturas = painel?.culturas ?? []

  return (
    <>
      <header className="flex flex-wrap items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground [&_svg]:size-5"
          aria-hidden="true"
        >
          <BuildingIcon />
        </span>
        <div className="min-w-0">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Sua empresa
          </span>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{empresa}</h1>
        </div>
        {acoes && <div className="ml-auto flex flex-wrap gap-2">{acoes}</div>}
      </header>

      <section aria-label="Resumo da empresa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Propriedades ativas"
          value={resumo?.propriedades ?? 0}
          icon={<MapPinIcon />}
          loading={loading}
        />
        <StatCard
          label="Lotes em cultivo"
          value={resumo?.lotes_em_cultivo ?? 0}
          hint={resumo ? `${formatarHectares(resumo.area_em_cultivo_ha)} plantados` : undefined}
          icon={<SproutIcon />}
          loading={loading}
        />
        <StatCard
          label="Sensores ativos"
          value={resumo ? `${resumo.sensores_ativos} de ${resumo.sensores_total}` : 0}
          icon={<CpuIcon />}
          loading={loading}
        />
        <StatCard
          label="Leituras nas últimas 24 h"
          value={formatarNumero(resumo?.leituras_24h ?? 0, 0)}
          icon={<RadioIcon />}
          loading={loading}
        />
      </section>

      <section className="space-y-3" aria-label="Culturas da empresa">
        <SectionHeader
          eyebrow="Cultivo"
          title="Situação das culturas"
          description="Últimas leituras dos sensores comparadas com a faixa ideal de cada cultura."
        />
        {loading ? (
          <Hint>Carregando culturas...</Hint>
        ) : culturas.length === 0 ? (
          <Card>
            <CardContent>
              <Hint>Nenhum lote em cultivo na empresa no momento.</Hint>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {culturas.map((c) => {
              const status = STATUS_CULTIVO[c.status]
              return (
                <Card key={c.cultura.id} size="sm">
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <strong className="block truncate">{c.cultura.nome}</strong>
                        {c.cultura.variedade && (
                          <small className="block truncate text-xs text-muted-foreground">
                            {c.cultura.variedade}
                          </small>
                        )}
                      </div>
                      <StatusBadge tone={status.tom} className="shrink-0">
                        {status.rotulo}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.lotes} {plural(c.lotes, 'lote', 'lotes')} · {formatarHectares(c.area_ha)}
                    </p>
                    {c.motivo && <p className="text-sm text-warning">{c.motivo}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

/** Lotes da empresa no mapa; o clique abre o contorno e as imagens do lote. */
export function EmpresaMapa({ lotes }: { lotes: Lote[] }) {
  const [aberto, setAberto] = useState<Lote | null>(null)
  if (!lotes.some((l) => l.geometria)) return null

  return (
    <section className="space-y-3" aria-label="Lotes da empresa no mapa">
      <SectionHeader
        eyebrow="Mapa"
        title="Lotes da empresa"
        description="Clique num lote para ver o contorno e as imagens de satélite."
      />
      <Card>
        <CardContent>
          <MapaGeral lotes={lotes} onAbrir={setAberto} />
        </CardContent>
      </Card>
      <AppDialog
        open={aberto !== null}
        onClose={() => setAberto(null)}
        size="lg"
        title={aberto ? `${aberto.nome_identificacao} — ${aberto.propriedade.nome}` : ''}
      >
        {aberto && <MapaLote key={aberto.id} lote={aberto} lotes={lotes} />}
      </AppDialog>
    </section>
  )
}
