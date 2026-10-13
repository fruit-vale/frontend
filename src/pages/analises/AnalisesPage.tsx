import { useState } from 'react'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEscopoEmpresa } from '@/hooks/use-escopo-empresa'
import { useRequest } from '@/hooks/use-request'
import { culturasService, lotesService, painelService } from '@/services'
import { ComparacaoLotes } from './ComparacaoLotes'
import { ComparacaoSafras } from './ComparacaoSafras'
import type { DadosAnalise } from './contexto'
import { ForaDaFaixaLotes } from './ForaDaFaixaLotes'
import { ResumoPorDado } from './ResumoPorDado'

type Aba = 'lotes' | 'safras' | 'resumo' | 'faixa'

export default function AnalisesPage() {
  const [aba, setAba] = useState<Aba>('lotes')
  const daEmpresa = useEscopoEmpresa()

  const { data, error, loading } = useRequest(
    async (signal) => {
      const [lotes, culturas, painel] = await Promise.all([
        lotesService.listar(signal),
        culturasService.listar(signal),
        painelService.obter(signal),
      ])
      return { lotes, culturas, tipos: painel.tipos }
    },
    { errorPrefix: 'Não foi possível carregar os dados', cacheKey: 'analises' },
  )

  const dados: DadosAnalise | null = data
    ? {
        lotes: [...daEmpresa(data.lotes)].sort((a, b) =>
          a.nome_identificacao.localeCompare(b.nome_identificacao, 'pt-BR'),
        ),
        culturas: new Map(data.culturas.map((c) => [c.id, c])),
        tipos: data.tipos,
      }
    : null

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Análise"
        title="Análises"
        description="Compare lotes e safras e veja quanto tempo cada lote passou fora da faixa ideal da cultura."
      />

      <ErrorMessage message={error} />

      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
        <TabsList aria-label="Tipo de análise" className="flex-wrap">
          <TabsTrigger value="lotes">Comparar lotes</TabsTrigger>
          <TabsTrigger value="safras">Safra atual × anterior</TabsTrigger>
          <TabsTrigger value="resumo">Resumo por dado</TabsTrigger>
          <TabsTrigger value="faixa">Fora da faixa ideal</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && !dados ? (
        <Skeleton className="h-80" />
      ) : dados ? (
        <>
          {aba === 'lotes' && <ComparacaoLotes dados={dados} />}
          {aba === 'safras' && <ComparacaoSafras dados={dados} />}
          {aba === 'resumo' && <ResumoPorDado dados={dados} />}
          {aba === 'faixa' && <ForaDaFaixaLotes dados={dados} />}
        </>
      ) : null}
    </section>
  )
}
