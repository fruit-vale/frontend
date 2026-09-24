import { useEffect, useState } from 'react'
import Modal from '../../components/Modal/Modal'
import { apiFetch } from '../../lib/api'
import NovaEmpresaForm from './NovaEmpresaForm'
import './Empresas.css'

export type Empresa = {
  id: number
  razao_social: string
  cpf_cnpj: string
  telefone: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  responsavel: string | null
  total_usuarios: number
}

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    apiFetch<Empresa[]>('/empresas')
      .then(setEmpresas)
      .catch((error: Error) =>
        setErro(`Não foi possível carregar as empresas: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [])

  function adicionar(criada: Empresa) {
    setEmpresas((atuais) =>
      [...atuais, criada].sort((a, b) =>
        a.razao_social.localeCompare(b.razao_social),
      ),
    )
    setModalAberto(false)
  }

  return (
    <section className="empresas-page">
      <header className="empresas-page__header">
        <div>
          <span className="empresas-page__eyebrow">ADMINISTRAÇÃO</span>
          <h1>Empresas</h1>
          <p>Empresas clientes da plataforma e seus usuários vinculados.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalAberto(true)}
        >
          + Nova empresa
        </button>
      </header>

      <Modal
        aberto={modalAberto}
        titulo="Nova empresa"
        onFechar={() => setModalAberto(false)}
      >
        <NovaEmpresaForm
          onCriada={adicionar}
          onCancelar={() => setModalAberto(false)}
        />
      </Modal>

      {erro && (
        <p className="empty-state" role="alert">
          {erro}
        </p>
      )}

      {!carregando && !erro && empresas.length === 0 && (
        <p className="empty-state">Nenhuma empresa cadastrada ainda.</p>
      )}

      {empresas.length > 0 && (
        <div className="empresas-table">
          <div className="empresas-table__head">
            <span>Empresa</span>
            <span>CNPJ</span>
            <span>Local</span>
            <span>Usuários</span>
          </div>

          {empresas.map((empresa) => (
            <article className="empresa-row" key={empresa.id}>
              <div className="empresa-row__name">
                <strong>{empresa.razao_social}</strong>
                {empresa.responsavel && <span>{empresa.responsavel}</span>}
              </div>
              <span>{empresa.cpf_cnpj}</span>
              <span>
                {[empresa.cidade, empresa.estado].filter(Boolean).join(' / ') ||
                  '—'}
              </span>
              <span>{empresa.total_usuarios}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Empresas
