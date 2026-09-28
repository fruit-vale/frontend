import { useState } from 'react'

/**
 * Campo numérico que aceita valores intermediários ao digitar ("-8.", "")
 * e só repassa números válidos.
 */
function CampoNumero({
  rotulo,
  valor,
  onChange,
  passo,
  min,
  max,
}: {
  rotulo: string
  valor: number
  onChange: (valor: number) => void
  passo: number
  min?: number
  max?: number
}) {
  const [rascunho, setRascunho] = useState(String(valor))
  const [editando, setEditando] = useState(false)
  const exibido = editando ? rascunho : String(valor)

  return (
    <label className="form-field">
      <span>{rotulo}</span>
      <input
        type="number"
        step={passo}
        min={min}
        max={max}
        value={exibido}
        onFocus={() => {
          setRascunho(String(valor))
          setEditando(true)
        }}
        onBlur={() => setEditando(false)}
        onChange={(event) => {
          setRascunho(event.target.value)
          const numero = Number(event.target.value)
          if (event.target.value !== '' && Number.isFinite(numero))
            onChange(numero)
        }}
      />
    </label>
  )
}

export default CampoNumero
