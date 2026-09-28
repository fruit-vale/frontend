import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../../lib/api'
import EditorMedidas from './EditorMedidas'
import { paraApi, paraRascunho, validarMedidas, type MedidaRascunho } from './medidas'
import type { Sensor } from './tipos'

type Props = {
  sensor: Sensor
  onSalvo: (sensor: Sensor) => void
  onCancelar: () => void
}

/** Edita os dados que um sensor já cadastrado envia. */
function EditarMedidasForm({ sensor, onSalvo, onCancelar }: Props) {
  const [medidas, setMedidas] = useState<MedidaRascunho[]>(() =>
    sensor.medidas.map(paraRascunho),
  )
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const erroMedidas = validarMedidas(medidas)
    if (erroMedidas) return setErro(erroMedidas)

    setErro('')
    setSalvando(true)
    try {
      const salvo = await apiFetch<Sensor>(`/sensores/${sensor.id}/medidas`, {
        method: 'PATCH',
        body: JSON.stringify({ medidas: paraApi(medidas) }),
      })
      onSalvo(salvo)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <p className="form-hint">
        Mudar a chave exige atualizar o firmware do sensor para publicar com a
        chave nova. Dados que já têm leituras gravadas podem ser renomeados, mas
        não removidos.
      </p>
      <EditorMedidas medidas={medidas} onChange={setMedidas} />

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar dados'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default EditarMedidasForm
