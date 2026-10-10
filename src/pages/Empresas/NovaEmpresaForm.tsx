import type { FormEvent } from 'react'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { LocalidadeFields } from '@/components/shared/LocalidadeFields'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { useForm } from '@/hooks/use-form'
import { empresasService } from '@/services'
import type { Empresa } from '@/types/empresa'

const formVazio = {
  razao_social: '',
  cpf_cnpj: '',
  responsavel: '',
  email: '',
  telefone: '',
  estado: '',
  cidade: '',
}

type Props = {
  onCriada: (empresa: Empresa) => void
  onCancelar: () => void
}

export function NovaEmpresaForm({ onCriada, onCancelar }: Props) {
  const { values, set, field } = useForm(formVazio)
  const { run, pending, error } = useAction()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const criada = await run(() => empresasService.criar(values))
    if (criada) onCriada(criada)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={enviar} noValidate>
      <FormGrid>
        <FormField label="Razão social" htmlFor="razao_social" required>
          <Input id="razao_social" {...field('razao_social')} maxLength={150} required autoFocus />
        </FormField>
        <FormField label="CNPJ" htmlFor="cpf_cnpj" required>
          <Input
            id="cpf_cnpj"
            {...field('cpf_cnpj')}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            autoCapitalize="characters"
            required
          />
        </FormField>
        <FormField label="Responsável" htmlFor="responsavel">
          <Input id="responsavel" {...field('responsavel')} maxLength={100} />
        </FormField>
        <FormField label="E-mail" htmlFor="email">
          <Input id="email" {...field('email')} type="email" maxLength={100} />
        </FormField>
        <FormField label="Telefone" htmlFor="telefone">
          <Input id="telefone" {...field('telefone')} type="tel" maxLength={20} />
        </FormField>
      </FormGrid>

      <FormGrid>
        <LocalidadeFields
          idPrefix="empresa"
          estado={values.estado}
          municipio={values.cidade}
          onEstadoChange={(uf) => {
            set('estado', uf)
            set('cidade', '')
          }}
          onMunicipioChange={(nome) => set('cidade', nome)}
        />
      </FormGrid>

      <ErrorMessage message={error} />

      <FormActions
        submitLabel="Cadastrar empresa"
        pending={pending}
        onCancel={onCancelar}
      />
    </form>
  )
}
