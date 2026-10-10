import { useState } from 'react'
import { ActivityIcon, CircleCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'umidade', label: 'Umidade' },
  { value: 'temperatura', label: 'Temperatura' },
  { value: 'luminosidade', label: 'Luminosidade' },
]

// Tela ainda sem endpoint na API: os números aparecem como "—".
export default function LeiturasAlertasPage() {
  const [filtro, setFiltro] = useState('todas')

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Monitoramento"
        title="Leituras e Alertas"
        description="Acompanhe os dados coletados pelos sensores das plantações."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<ActivityIcon />} value="—" label="Leituras hoje" />
        <StatCard icon={<CircleCheckIcon />} value="—" label="Leituras normais" />
        <StatCard icon={<TriangleAlertIcon />} value="—" label="Alertas ativos" />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Últimas leituras"
          description="Dados recebidos recentemente pelos sensores."
          actions={
            <SelectField
              aria-label="Filtrar leituras"
              value={filtro}
              onValueChange={setFiltro}
              options={FILTROS}
              className="w-44"
            />
          }
        />
        <EmptyState>Nenhuma leitura recebida ainda.</EmptyState>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Alertas recentes"
          description="Situações que precisam da sua atenção."
          actions={<Button variant="outline">Ver todos</Button>}
        />
        <EmptyState>Nenhum alerta no momento.</EmptyState>
      </section>
    </section>
  )
}
