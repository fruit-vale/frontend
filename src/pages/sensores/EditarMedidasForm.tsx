import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { useAction } from '@/hooks/use-action'
import { sensoresService } from '@/services'
import type { Sensor } from '@/types/sensor'
import { EditorMedidas } from './EditorMedidas'
import { paraApi, paraRascunho, validarMedidas, type MedidaRascunho } from './medidas'

type Props = {
  sensor: Sensor
  onSalvo: (sensor: Sensor) => void
  onCancelar: () => void
}

/** Edita os dados que um sensor já cadastrado envia. */
export function EditarMedidasForm({ sensor, onSalvo, onCancelar }: Props) {
  const [medidas, setMedidas] = useState<MedidaRascunho[]>(() =>
    sensor.medidas.map(paraRascunho),
  )
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const erroMedidas = validarMedidas(medidas)
    if (erroMedidas) return setErroLocal(erroMedidas)
    setErroLocal('')

    const salvo = await run(() =>
      sensoresService.atualizarMedidas(sensor.id, paraApi(medidas)),
    )
    if (salvo) onSalvo(salvo)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={enviar} noValidate>
      <Hint>
        Mudar a chave exige atualizar o firmware do sensor para publicar com a chave
        nova. Dados que já têm leituras gravadas podem ser renomeados, mas não removidos.
      </Hint>
      <EditorMedidas medidas={medidas} onChange={setMedidas} />

      <ErrorMessage message={erroLocal || error} />

      <FormActions submitLabel="Salvar dados" pending={pending} onCancel={onCancelar} />
    </form>
  )
}
