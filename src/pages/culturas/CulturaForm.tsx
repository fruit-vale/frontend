import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAction } from '@/hooks/use-action'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from '@/hooks/use-form'
import { numeroOuNull } from '@/lib/format'
import { culturasService } from '@/services'
import type { Empresa } from '@/types/empresa'
import type { Cultura } from '@/types/cultura'

// valor do select para "sem empresa" (cultura visível a todas)
const PLATAFORMA = 'plataforma'

const texto = (n: number | null) => n?.toString() ?? ''

const paraForm = (c?: Cultura) => ({
  nome: c?.nome ?? '',
  variedade: c?.variedade ?? '',
  temp_recomendada_min: texto(c?.temp_recomendada_min ?? null),
  temp_recomendada_max: texto(c?.temp_recomendada_max ?? null),
  umidade_recomendada_min: texto(c?.umidade_recomendada_min ?? null),
  umidade_recomendada_max: texto(c?.umidade_recomendada_max ?? null),
  ciclo_medio_dias: texto(c?.ciclo_medio_dias ?? null),
  temp_base_graus_dia: texto(c?.temp_base_graus_dia ?? null),
  graus_dia_ciclo: texto(c?.graus_dia_ciclo ?? null),
  descricao: c?.descricao ?? '',
})

type Props = {
  /** Cultura em edição; ausente no cadastro. */
  cultura?: Cultura
  empresas: Empresa[]
  onSalva: (cultura: Cultura, nova: boolean) => void
  onCancelar: () => void
}

export function CulturaForm({ cultura, empresas, onSalva, onCancelar }: Props) {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const { values, field } = useForm(paraForm(cultura))
  const [empresaNova, setEmpresaNova] = useState(PLATAFORMA)
  const { run, pending, error } = useAction()

  const opcoesEmpresa = [
    { value: PLATAFORMA, label: 'Plataforma (todas as empresas)' },
    ...empresas.map((e) => ({ value: String(e.id), label: `Somente ${e.razao_social}` })),
  ]

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      nome: values.nome,
      variedade: values.variedade,
      descricao: values.descricao,
      // o administrador escolhe a empresa na criação; o produtor sempre cria na dele
      ...(admin && !cultura && { empresa_id: empresaNova === PLATAFORMA ? null : Number(empresaNova) }),
      temp_recomendada_min: numeroOuNull(values.temp_recomendada_min),
      temp_recomendada_max: numeroOuNull(values.temp_recomendada_max),
      umidade_recomendada_min: numeroOuNull(values.umidade_recomendada_min),
      umidade_recomendada_max: numeroOuNull(values.umidade_recomendada_max),
      ciclo_medio_dias: numeroOuNull(values.ciclo_medio_dias),
      temp_base_graus_dia: numeroOuNull(values.temp_base_graus_dia),
      graus_dia_ciclo: numeroOuNull(values.graus_dia_ciclo),
    }

    const salva = await run(() =>
      cultura
        ? culturasService.atualizar(cultura.id, payload)
        : culturasService.criar(payload),
    )
    if (salva) onSalva(salva, !cultura)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={enviar} noValidate>
      {admin && !cultura && (
        <FormField label="Disponível para" htmlFor="empresa-nova">
          <SelectField
            id="empresa-nova"
            value={empresaNova}
            onValueChange={setEmpresaNova}
            options={opcoesEmpresa}
          />
        </FormField>
      )}
      {!admin && !cultura && (
        <Hint>
          A cultura será cadastrada para {user?.empresa?.razao_social ?? 'a sua empresa'}.
        </Hint>
      )}

      <FormGrid>
        <FormField label="Nome" htmlFor="nome" required>
          <Input id="nome" {...field('nome')} maxLength={50} placeholder="Manga" required autoFocus />
        </FormField>
        <FormField label="Variedade" htmlFor="variedade">
          <Input id="variedade" {...field('variedade')} maxLength={50} placeholder="Tommy Atkins" />
        </FormField>
        <FormField label="Ciclo médio (dias)" htmlFor="ciclo">
          <Input id="ciclo" {...field('ciclo_medio_dias')} type="number" min={1} step={1} />
        </FormField>
      </FormGrid>

      <FormGrid>
        <FormField label="Temperatura mínima (°C)" htmlFor="tmin">
          <Input id="tmin" {...field('temp_recomendada_min')} type="number" step="0.1" />
        </FormField>
        <FormField label="Temperatura máxima (°C)" htmlFor="tmax">
          <Input id="tmax" {...field('temp_recomendada_max')} type="number" step="0.1" />
        </FormField>
        <FormField label="Umidade mínima (%)" htmlFor="umin">
          <Input id="umin" {...field('umidade_recomendada_min')} type="number" min={0} max={100} step="0.1" />
        </FormField>
        <FormField label="Umidade máxima (%)" htmlFor="umax">
          <Input id="umax" {...field('umidade_recomendada_max')} type="number" min={0} max={100} step="0.1" />
        </FormField>
      </FormGrid>

      <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">Previsão pela temperatura (graus-dia)</legend>
        <FormGrid>
          <FormField label="Temperatura base (°C)" htmlFor="tbase">
            <Input id="tbase" {...field('temp_base_graus_dia')} type="number" step="0.1" placeholder="10" />
          </FormField>
          <FormField label="Graus-dia do ciclo" htmlFor="gdd">
            <Input id="gdd" {...field('graus_dia_ciclo')} type="number" min={1} step={1} placeholder="1800" />
          </FormField>
        </FormGrid>
        <Hint>
          Opcional. Com os dois preenchidos, a previsão de colheita passa a usar a temperatura
          medida pelos sensores do lote: cada dia soma (mínima + máxima) ÷ 2 − temperatura base, e
          a colheita é prevista para quando a soma desde o plantio atinge os graus-dia do ciclo.
          Use os valores da variedade (agrônomo, Embrapa ou o histórico das safras).
        </Hint>
      </fieldset>

      <FormField label="Descrição" htmlFor="descricao">
        <Textarea id="descricao" {...field('descricao')} rows={3} maxLength={2000} />
      </FormField>

      <Hint>O ciclo médio é usado para estimar a previsão de colheita dos lotes.</Hint>

      <ErrorMessage message={error} />

      <FormActions
        submitLabel={cultura ? 'Salvar alterações' : 'Cadastrar cultura'}
        pending={pending}
        onCancel={onCancelar}
      />
    </form>
  )
}
