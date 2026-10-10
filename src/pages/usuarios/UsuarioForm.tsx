import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorMessage } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/config/routes'
import { useAction } from '@/hooks/use-action'
import { useAuth } from '@/hooks/use-auth'
import { useForm } from '@/hooks/use-form'
import { usuariosService } from '@/services'
import { ROLES, ROLE_LABELS, type Role } from '@/types/auth'
import type { Empresa } from '@/types/empresa'
import type { Usuario } from '@/types/usuario'

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

type Props = {
  /** Usuário em edição; ausente no cadastro. */
  usuario?: Usuario
  empresas: Empresa[]
  onSalvo: (usuario: Usuario, novo: boolean) => void
  onCancelar: () => void
}

export function UsuarioForm({ usuario, empresas, onSalvo, onCancelar }: Props) {
  const { user: logado } = useAuth()
  const { values, field } = useForm({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    senha: '',
  })
  const [role, setRole] = useState<Role>(usuario?.role ?? 'produtor')
  const [empresaId, setEmpresaId] = useState(
    usuario?.empresa ? String(usuario.empresa.id) : '',
  )
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  // administrador é da plataforma: não pertence a nenhuma empresa
  const semEmpresa = role === 'administrador'
  const editando = !!usuario
  const empresaOptions = empresas.map((e) => ({
    value: String(e.id),
    label: e.razao_social,
  }))

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!semEmpresa && !empresaId) {
      setErroLocal('Selecione a empresa do usuário.')
      return
    }
    setErroLocal('')

    const vinculo = {
      role,
      empresa_id: semEmpresa ? null : Number(empresaId),
    }
    const salvo = await run(() =>
      usuario
        ? usuariosService.atualizarVinculo(usuario.id, vinculo)
        : usuariosService.criar({ ...values, ...vinculo }),
    )
    if (salvo) onSalvo(salvo, !editando)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={enviar} noValidate>
      <FormGrid>
        {!editando && (
          <>
            <FormField label="Nome" htmlFor="nome" required>
              <Input id="nome" {...field('nome')} maxLength={100} required autoFocus />
            </FormField>
            <FormField label="E-mail" htmlFor="email" required>
              <Input
                id="email"
                {...field('email')}
                type="email"
                maxLength={100}
                placeholder="nome@empresa.com.br"
                required
              />
            </FormField>
            <FormField label="CPF" htmlFor="cpf" required>
              <Input
                id="cpf"
                {...field('cpf')}
                inputMode="numeric"
                placeholder="000.000.000-00"
                required
              />
            </FormField>
            <FormField label="Telefone" htmlFor="telefone">
              <Input id="telefone" {...field('telefone')} type="tel" maxLength={20} />
            </FormField>
            <FormField label="Senha inicial" htmlFor="senha" required>
              <Input
                id="senha"
                {...field('senha')}
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                required
              />
            </FormField>
          </>
        )}

        <FormField label="Perfil" htmlFor="role" required>
          <SelectField
            id="role"
            value={role}
            onValueChange={(valor) => setRole(valor as Role)}
            options={ROLE_OPTIONS}
            // ninguém tira o próprio acesso de administrador
            disabled={editando && usuario.id === logado?.id}
          />
        </FormField>

        <FormField label="Empresa" htmlFor="empresa" required={!semEmpresa}>
          <SelectField
            id="empresa"
            value={semEmpresa ? '' : empresaId}
            onValueChange={setEmpresaId}
            options={empresaOptions}
            disabled={semEmpresa}
            placeholder={semEmpresa ? 'Plataforma (sem empresa)' : 'Selecione...'}
          />
        </FormField>
      </FormGrid>

      {!semEmpresa && empresas.length === 0 && (
        <p className="text-sm text-destructive">
          Nenhuma empresa cadastrada.{' '}
          <Link to={ROUTES.empresas} className="underline">
            Cadastre uma empresa
          </Link>{' '}
          antes de criar produtores e analistas.
        </p>
      )}

      <ErrorMessage message={erroLocal || error} />

      <FormActions
        submitLabel={editando ? 'Salvar alterações' : 'Cadastrar usuário'}
        pending={pending}
        onCancel={onCancelar}
      />
    </form>
  )
}
