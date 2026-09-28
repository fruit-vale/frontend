import { useEffect, useState } from 'react'
import type { Empresa } from '../../auth/authContextInstance'
import Modal from '../../components/Modal/Modal'
import { apiFetch } from '../../lib/api'
import PropriedadeForm from './PropriedadeForm'
import type { PropriedadeCompleta } from './tipos'
import './Propriedades.css'

type Formulario =
  | { modo: 'fechado' }
  | { modo: 'novo' }
  | { modo: 'editar'; propriedade: PropriedadeCompleta }

const porEmpresaENome = (a: PropriedadeCompleta, b: PropriedadeCompleta) =>
  a.empresa.razao_social.localeCompare(b.empresa.razao_social) ||
  a.nome.localeCompare(b.nome)

function Propriedades() {
  const [propriedades, setPropriedades] = useState<PropriedadeCompleta[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [formulario, setFormulario] = useState<Formulario>({ modo: 'fechado' })

  useEffect(() => {
    Promise.all([
      apiFetch<PropriedadeCompleta[]>('/propriedades'),
      apiFetch<Empresa[]>('/empresas'),
    ])
      .then(([lista, listaEmpresas]) => {
        setPropriedades(lista)
        setEmpresas(listaEmpresas)
      })
      .catch((error: Error) =>
        setErro(`Não foi possível carregar as propriedades: ${error.message}`),
      )
      .finally(() => setCarregando(false))
  }, [])

  const visiveis = filtroEmpresa
    ? propriedades.filter((p) => p.empresa_id === Number(filtroEmpresa))
    : propriedades

  function fechar() {
    setFormulario({ modo: 'fechado' })
  }

  function salva(propriedade: PropriedadeCompleta) {
    setPropriedades((atuais) =>
      (atuais.some((p) => p.id === propriedade.id)
        ? atuais.map((p) => (p.id === propriedade.id ? propriedade : p))
        : [...atuais, propriedade]
      ).sort(porEmpresaENome),
    )
    fechar()
  }

  async function excluir(propriedade: PropriedadeCompleta) {
    if (!window.confirm(`Excluir a propriedade ${propriedade.nome}?`)) return
    setErroAcao('')
    try {
      await apiFetch<void>(`/propriedades/${propriedade.id}`, { method: 'DELETE' })
      setPropriedades((atuais) => atuais.filter((p) => p.id !== propriedade.id))
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : 'Erro ao excluir.')
    }
  }

  return (
    <section className="propriedades-page">
      <header className="propriedades-page__header">
        <div>
          <span className="propriedades-page__eyebrow">ADMINISTRAÇÃO</span>
          <h1>Propriedades</h1>
          <p>Propriedades de cada empresa, onde ficam os lotes e os sensores.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setFormulario({ modo: 'novo' })}
          disabled={carregando || !!erro}
        >
          + Nova propriedade
        </button>
      </header>

      <Modal
        aberto={formulario.modo !== 'fechado'}
        titulo={formulario.modo === 'editar' ? `Editar ${formulario.propriedade.nome}` : 'Nova propriedade'}
        onFechar={fechar}
        largo
      >
        {formulario.modo !== 'fechado' && (
          <PropriedadeForm
            key={formulario.modo === 'editar' ? formulario.propriedade.id : 'nova'}
            empresas={empresas}
            propriedade={formulario.modo === 'editar' ? formulario.propriedade : undefined}
            onSalva={salva}
            onCancelar={fechar}
          />
        )}
      </Modal>

      {erro && (
        <p className="empty-state" role="alert">
          {erro}
        </p>
      )}
      {erroAcao && (
        <p className="form-error propriedades-page__erro" role="alert">
          {erroAcao}
        </p>
      )}

      {!carregando && !erro && empresas.length > 1 && (
        <div className="propriedades-toolbar">
          <select value={filtroEmpresa} onChange={(event) => setFiltroEmpresa(event.target.value)} aria-label="Filtrar por empresa">
            <option value="">Todas as empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.razao_social}
              </option>
            ))}
          </select>
        </div>
      )}

      {!carregando && !erro && visiveis.length === 0 && (
        <p className="empty-state">
          {empresas.length === 0
            ? 'Cadastre uma empresa antes de cadastrar propriedades.'
            : 'Nenhuma propriedade cadastrada ainda.'}
        </p>
      )}

      {visiveis.length > 0 && (
        <div className="propriedades-table">
          <div className="propriedades-table__head">
            <span>Propriedade</span>
            <span>Empresa</span>
            <span>Área</span>
            <span>Lotes / sensores</span>
            <span>Status</span>
            <span></span>
          </div>

          {visiveis.map((p) => {
            const emUso = p.total_lotes > 0 || p.total_sensores > 0
            return (
              <article className="propriedade-row" key={p.id}>
                <div className="propriedade-row__name">
                  <strong>{p.nome}</strong>
                  <span>
                    {p.municipio}/{p.estado}
                    {p.latitude === null && ' · sem localização'}
                  </span>
                </div>
                <span>{p.empresa.razao_social}</span>
                <span>{p.area_total_ha != null ? `${p.area_total_ha.toLocaleString('pt-BR')} ha` : '—'}</span>
                <span>
                  {p.total_lotes} / {p.total_sensores}
                </span>
                <span className={`propriedade-status propriedade-status--${p.status.toLowerCase()}`}>
                  {p.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                </span>
                <div className="propriedade-row__acoes">
                  <button type="button" onClick={() => setFormulario({ modo: 'editar', propriedade: p })}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="propriedade-row__excluir"
                    onClick={() => excluir(p)}
                    disabled={emUso}
                    title={emUso ? 'Propriedade com lotes ou sensores não pode ser excluída; marque-a como inativa.' : undefined}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Propriedades
