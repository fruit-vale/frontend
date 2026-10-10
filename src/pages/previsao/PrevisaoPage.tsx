import { useState } from 'react'
import { CalendarClockIcon, TrendingUpIcon, WheatIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { StatCard } from '@/components/shared/StatCard'

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'uva', label: 'Uva' },
  { value: 'manga', label: 'Manga' },
]

// Tela ainda sem endpoint na API: os números aparecem como "—".
export default function PrevisaoPage() {
  const [filtro, setFiltro] = useState('todas')

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Planejamento agrícola"
        title="Previsão de Colheita"
        description="Acompanhe a previsão de colheita das suas plantações."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<WheatIcon />} value="—" label="Plantações monitoradas" />
        <StatCard icon={<CalendarClockIcon />} value="—" label="Colheita nos próximos 7 dias" />
        <StatCard icon={<TrendingUpIcon />} value="—" label="Progresso médio" />
      </div>

      <section className="space-y-3">
        <SectionHeader
          title="Próximas colheitas"
          description="Previsões baseadas no acompanhamento das plantações."
          actions={
            <SelectField
              aria-label="Filtrar previsões"
              value={filtro}
              onValueChange={setFiltro}
              options={FILTROS}
              className="w-40"
            />
          }
        />
        <EmptyState>Nenhuma previsão de colheita disponível.</EmptyState>
      </section>
    </section>
  )
}
