import { useState, type FormEvent } from 'react'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useAction } from '@/hooks/use-action'
import { sensoresService } from '@/services'
import type { LoteResumo, Sensor } from '@/types/sensor'

type Props = {
  sensor: Sensor
  lotes: LoteResumo[]
  onSalvo: (sensor: Sensor) => void
  onCancelar: () => void
}

/**
 * Leva o sensor para outro lote da mesma empresa — por exemplo, depois da
 * colheita, quando ele foi desativado e saiu do lote colhido.
 */
export function MoverLoteForm({ sensor, lotes, onSalvo, onCancelar }: Props) {
  // o login MQTT é da empresa: só lotes dela, e em cultivo (regra da API)
  const opcoes = lotes
    .filter(
      (l) =>
        l.empresa.id === sensor.empresa.id && l.situacao === 'EM_CULTIVO' && l.id !== sensor.lote?.id,
    )
    .sort((a, b) =>
      `${a.propriedade.nome} ${a.nome_identificacao}`.localeCompare(
        `${b.propriedade.nome} ${b.nome_identificacao}`,
        'pt-BR',
      ),
    )
  const [loteId, setLoteId] = useState(opcoes.length === 1 ? String(opcoes[0].id) : '')
  const inativo = sensor.status === 'INATIVO'
  const [reativar, setReativar] = useState(inativo)
  const { run, pending, error, setError } = useAction()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loteId) return setError('Escolha o lote.')
    const salvo = await run(async () => {
      const movido = await sensoresService.moverParaLote(sensor.id, Number(loteId))
      return reativar && inativo ? sensoresService.alterarStatus(sensor.id, 'ATIVO') : movido
    })
    if (salvo) onSalvo(salvo)
  }

  if (opcoes.length === 0)
    return (
      <div className="space-y-4">
        <Hint>
          Nenhum outro lote em cultivo nesta empresa. Em Cultivos e Lotes, inicie uma nova safra
          (Histórico) ou mude um lote em preparo para "Em cultivo".
        </Hint>
        <Button type="button" size="lg" variant="outline" onClick={onCancelar}>
          Fechar
        </Button>
      </div>
    )

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Agora: <strong className="text-foreground">{sensor.lote?.nome ?? 'sem lote'}</strong> ·{' '}
        {sensor.propriedade.nome}. O login, a senha e o histórico de leituras continuam os mesmos.
      </p>

      <FormField label="Novo lote" htmlFor="mover-lote" required>
        <SelectField
          id="mover-lote"
          value={loteId}
          onValueChange={setLoteId}
          options={opcoes.map((l) => ({
            value: String(l.id),
            label: `${l.nome_identificacao} — ${l.propriedade.nome}`,
          }))}
        />
      </FormField>

      {inativo && (
        <Label className="w-fit cursor-pointer text-sm font-normal">
          <Checkbox checked={reativar} onCheckedChange={(marcado) => setReativar(marcado)} />
          Reativar o sensor (libera o login MQTT para voltar a enviar leituras)
        </Label>
      )}

      <ErrorMessage message={error} />
      <FormActions submitLabel="Mudar de lote" pending={pending} onCancel={onCancelar} />
    </form>
  )
}
