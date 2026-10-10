import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }
type State = { erro: Error | null }

/**
 * Evita que um erro de renderização numa página deixe a aplicação inteira em
 * branco (ex.: API numa versão anterior à do frontend, sem algum campo).
 * O menu continua funcionando; trocar de rota reinicia o componente (key).
 */
export class ErrorBoundary extends Component<Props, State> {
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
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Não foi possível exibir esta página.
        </p>
        <p>
          Se a API foi atualizada há pouco, ela pode ainda não estar publicada.
          Detalhe:{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">
            {this.state.erro.message}
          </code>
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    )
  }
}
