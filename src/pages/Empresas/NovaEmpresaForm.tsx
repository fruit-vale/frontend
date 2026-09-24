import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../../lib/api'
import {
  listarEstados,
  listarMunicipios,
  type Estado,
  type Municipio,
} from '../../lib/ibge'
import type { Empresa } from './Empresas'

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

function NovaEmpresaForm({ onCriada, onCancelar }: Props) {
  const [form, setForm] = useState(formVazio)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [estados, setEstados] = useState<Estado[] | null>(null)
  const [erroEstados, setErroEstados] = useState(false)
  // lista de cidades guardada junto da UF para saber se está atualizada
  const [cidades, setCidades] = useState<{ uf: string; lista: Municipio[] }>()
  const [erroCidadesUf, setErroCidadesUf] = useState('')

  useEffect(() => {
    listarEstados()
      .then(setEstados)
      .catch(() => setErroEstados(true))
  }, [])

  useEffect(() => {
    if (!form.estado || erroEstados) return

    let ativo = true
    listarMunicipios(form.estado)
      .then((lista) => ativo && setCidades({ uf: form.estado, lista }))
      .catch(() => ativo && setErroCidadesUf(form.estado))

    return () => {
      ativo = false
    }
  }, [form.estado, erroEstados])

  const cidadesDaUf = cidades?.uf === form.estado ? cidades.lista : null
  const cidadeLivre = erroEstados || erroCidadesUf === form.estado
  const carregandoCidades = !!form.estado && !cidadesDaUf && !cidadeLivre

  function campo(nome: keyof typeof formVazio) {
    return {
      value: form[nome],
      onChange: (event: { target: { value: string } }) =>
        setForm((atual) => ({ ...atual, [nome]: event.target.value })),
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)

    try {
      const criada = await apiFetch<Empresa>('/empresas', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onCriada(criada)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="form-field">
          <span>Razão social *</span>
          <input {...campo('razao_social')} maxLength={150} required autoFocus />
        </label>
        <label className="form-field">
          <span>CNPJ *</span>
          <input
            {...campo('cpf_cnpj')}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            autoCapitalize="characters"
            required
          />
        </label>
        <label className="form-field">
          <span>Responsável</span>
          <input {...campo('responsavel')} maxLength={100} />
        </label>
        <label className="form-field">
          <span>E-mail</span>
          <input {...campo('email')} type="email" maxLength={100} />
        </label>
        <label className="form-field">
          <span>Telefone</span>
          <input {...campo('telefone')} type="tel" maxLength={20} />
        </label>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>Estado</span>
          {erroEstados ? (
            <input {...campo('estado')} maxLength={2} placeholder="UF (ex.: PE)" />
          ) : (
            <select
              value={form.estado}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  estado: event.target.value,
                  cidade: '',
                }))
              }
              disabled={!estados}
            >
              <option value="">
                {estados ? 'Selecione...' : 'Carregando estados...'}
              </option>
              {estados?.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.nome}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="form-field">
          <span>Cidade</span>
          {cidadeLivre ? (
            <input {...campo('cidade')} maxLength={100} />
          ) : (
            <select {...campo('cidade')} disabled={!cidadesDaUf}>
              <option value="">
                {!form.estado
                  ? 'Selecione o estado primeiro'
                  : carregandoCidades
                    ? 'Carregando cidades...'
                    : 'Selecione...'}
              </option>
              {cidadesDaUf?.map((municipio) => (
                <option key={municipio.id} value={municipio.nome}>
                  {municipio.nome}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {cidadeLivre && (
        <p className="form-hint">
          Não foi possível carregar a lista do IBGE; digite manualmente.
        </p>
      )}

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Cadastrar empresa'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default NovaEmpresaForm
