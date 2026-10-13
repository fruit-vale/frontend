import { useState } from 'react'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEscopoEmpresa } from '@/hooks/use-escopo-empresa'
import { useRequest } from '@/hooks/use-request'
import { porTexto } from '@/lib/format'
import { lotesService, painelService, sensoresService } from '@/services'
import { AlertasAba } from './AlertasAba'
import { LeiturasAba } from './LeiturasAba'

type Aba = 'alertas' | 'leituras'

export default function LeiturasAlertasPage() {
  const [aba, setAba] = useState<Aba>('alertas')
  const daEmpresa = useEscopoEmpresa()

  const { data, error, loading } = useRequest(
    async (signal) => {
      const [lotes, painel, sensores] = await Promise.all([
        lotesService.listar(signal),
        painelService.obter(signal),
        // versões antigas da API não deixam o analista listar sensores
        sensoresService.listar(signal).catch(() => null),
      ])
      return { lotes, tipos: painel.tipos, sensores, agora: Date.now() }
    },
    { errorPrefix: 'Não foi possível carregar os dados', cacheKey: 'leituras-alertas' },
  )
  const lotes = [...daEmpresa(data?.lotes)].sort(porTexto((l) => l.nome_identificacao))
  const sensores = data?.sensores ? daEmpresa(data.sensores) : null

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Monitoramento"
        title="Leituras e Alertas"
        description="Alertas fora da faixa ideal e as leituras recebidas dos sensores, com exportação."
      />
      <ErrorMessage message={error} />

      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
        <TabsList aria-label="O que ver">
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="leituras">Leituras</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && !data ? (
        <Skeleton className="h-64" />
      ) : data ? (
        aba === 'alertas' ? (
          <AlertasAba lotes={lotes} />
        ) : (
          <LeiturasAba lotes={lotes} tipos={data.tipos} sensores={sensores} agora={data.agora} />
        )
      ) : null}
    </section>
  )
}
