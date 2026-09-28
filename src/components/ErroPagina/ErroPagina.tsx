import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { erro: Error | null }

/**
 * Evita que um erro de renderização numa página deixe a aplicação inteira em
 * branco (ex.: API numa versão anterior à do frontend, sem algum campo).
 * O menu continua funcionando; trocar de rota reinicia o componente (key).
 */
class ErroPagina extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro ao exibir a página:', erro, info.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="empty-state" role="alert">
        <p>Não foi possível exibir esta página.</p>
        <p>
          Se a API foi atualizada há pouco, ela pode ainda não estar publicada.
          Detalhe: <code>{this.state.erro.message}</code>
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      </div>
    )
  }
}

export default ErroPagina
