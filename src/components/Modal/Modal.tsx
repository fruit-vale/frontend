import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  aberto: boolean
  titulo: string
  onFechar: () => void
  children: ReactNode
  /** Mais largo, para conteúdo como mapas. */
  largo?: boolean
}

// Usa <dialog> nativo: foco preso no modal, Esc para fechar e fundo escurecido
function Modal({ aberto, titulo, onFechar, children, largo }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className={largo ? 'modal modal--largo' : 'modal'}
      aria-labelledby="modal-titulo"
      onCancel={(event) => {
        event.preventDefault()
        onFechar()
      }}
    >
      {aberto && (
        <>
          <header className="modal__header">
            <h2 id="modal-titulo">{titulo}</h2>
            <button
              type="button"
              className="modal__fechar"
              onClick={onFechar}
              aria-label="Fechar"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="modal__body">{children}</div>
        </>
      )}
    </dialog>
  )
}

export default Modal
