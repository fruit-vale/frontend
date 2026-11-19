import type { FormEvent } from 'react'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { LocalidadeFields } from '@/components/shared/LocalidadeFields'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { useForm } from '@/hooks/use-form'
import { empresasService } from '@/services'
import type { Empresa, EmpresaCriada } from '@/types/empresa'

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
  /** Com a empresa, o formulário edita; sem ela, cadastra. */
  empresa?: Empresa
  onCriada?: (empresa: EmpresaCriada) => void
  onSalva?: (empresa: Empresa) => void
  onCancelar: () => void
}

const dosDados = (e: Empresa) => ({
  razao_social: e.razao_social,
  cpf_cnpj: e.cpf_cnpj,
  responsavel: e.responsavel ?? '',
  email: e.email ?? '',
  telefone: e.telefone ?? '',
  estado: e.estado ?? '',
  cidade: e.cidade ?? '',
})

export function NovaEmpresaForm({ empresa, onCriada, onSalva, onCancelar }: Props) {
  const { values, set, field } = useForm(empresa ? dosDados(empresa) : formVazio)
  const { run, pending, error } = useAction()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (empresa) {
      const salva = await run(() => empresasService.atualizar(empresa.id, values))
      if (salva) onSalva?.(salva)
      return
    }
    const criada = await run(() => empresasService.criar(values))
    if (criada) onCriada?.(criada)
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
        <FormField
          label="E-mail do responsável"
          htmlFor="email"
          required
          hint={
            empresa
              ? 'Mudar o e-mail não reenvia o contrato. Se ele ainda estiver pendente, use “Reenviar contrato”.'
              : 'O contrato de serviço será enviado para este e-mail. O acesso só é liberado depois do aceite.'
          }
        >
          <Input id="email" {...field('email')} type="email" maxLength={100} required />
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
        submitLabel={empresa ? 'Salvar alterações' : 'Cadastrar e enviar contrato'}
        pending={pending}
        onCancel={onCancelar}
      />
    </form>
  )
}
