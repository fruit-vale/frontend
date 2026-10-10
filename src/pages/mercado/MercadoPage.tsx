import { FileTextIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'

export default function MercadoPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Análise de mercado"
        title="Mercado e Exportação"
        description="Dashboards analíticos, preços de mercado e recomendações de exportação."
        actions={
          <Button size="lg" variant="outline">
            <FileTextIcon />
            Gerar relatório
          </Button>
        }
      />

      <EmptyState>Nenhum dado de mercado disponível.</EmptyState>

      <section className="space-y-3">
        <SectionHeader title="Recomendações de exportação" />
        <EmptyState>Nenhuma recomendação disponível.</EmptyState>
      </section>
    </section>
  )
}
