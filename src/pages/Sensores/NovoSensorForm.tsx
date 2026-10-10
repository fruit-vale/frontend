import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAction } from '@/hooks/use-action'
import { sensoresService } from '@/services'
import type { Credenciais, LoteResumo, Sensor } from '@/types/sensor'
import { EditorMedidas } from './EditorMedidas'
import { paraApi, validarMedidas, type MedidaRascunho } from './medidas'

// mesmas regras da API (POST /sensores); o código final é empN-identificador
const IDENTIFICADOR_VALIDO = /^[A-Za-z0-9_.-]+$/
const PREFIXO_RESERVADO = /^emp\d+-/
const CODIGO_MAX = 50

const TIPOS_SUGERIDOS = ['DHT11', 'DHT22', 'Umidade do solo', 'pH', 'Luminosidade', 'Pluviômetro']

type Props = {
  lotes: LoteResumo[]
  onCriado: (sensor: Sensor, credenciais: Credenciais) => void
  onCancelar: () => void
}

export function NovoSensorForm({ lotes: todosLotes, onCriado, onCancelar }: Props) {
  // a API só aceita sensor em lote em cultivo (nem em preparo, nem colhido)
  const lotes = todosLotes.filter((l) => l.situacao === 'EM_CULTIVO')
  const [identificador, setIdentificador] = useState('')
  const [tipo, setTipo] = useState('')
  const [loteId, setLoteId] = useState(lotes.length === 1 ? String(lotes[0].id) : '')
  const [dataInstalacao, setDataInstalacao] = useState('')
  const [medidas, setMedidas] = useState<MedidaRascunho[]>([])
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error } = useAction()

  const lote = lotes.find((l) => l.id === Number(loteId))
  const prefixo = lote ? `emp${lote.empresa.id}-` : 'empN-'
  // o administrador vê lotes de várias empresas: mostra de qual é cada um
  const variasEmpresas = new Set(lotes.map((l) => l.empresa.id)).size > 1
  const codigo = `${prefixo}${identificador.trim() || 'identificador'}`

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valor = identificador.trim()

    const falha = !IDENTIFICADOR_VALIDO.test(valor)
      ? 'O identificador deve ter só letras, números, _ . -'
      : PREFIXO_RESERVADO.test(valor)
        ? 'Não use o prefixo empN- — ele é adicionado automaticamente.'
        : !tipo.trim()
          ? 'Informe o tipo do sensor.'
          : !lote
            ? 'Selecione o lote do sensor.'
            : codigo.length > CODIGO_MAX
              ? `O código final (${codigo}) deve ter até ${CODIGO_MAX} caracteres.`
              : validarMedidas(medidas)
    if (falha || !lote) return setErroLocal(falha ?? '')
    setErroLocal('')

    const criado = await run(() =>
      sensoresService.criar({
        identificador: valor,
        tipo: tipo.trim(),
        lote_id: lote.id,
        data_instalacao: dataInstalacao || null,
        medidas: paraApi(medidas),
      }),
    )
    if (criado) onCriado(criado.sensor, criado.credenciais)
  }

  if (lotes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorMessage
          message={
            todosLotes.length === 0
              ? 'Nenhum lote disponível. Cadastre um lote em Cultivos e Lotes antes de cadastrar sensores.'
              : 'Nenhum lote em cultivo. O sensor só pode ser cadastrado num lote em cultivo: em Cultivos e Lotes, mude a situação de um lote em preparo para "Em cultivo" ou inicie uma nova safra num lote colhido.'
          }
        />
        <div>
          <Button variant="outline" size="lg" onClick={onCancelar}>
            Fechar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={enviar} noValidate>
      <FormGrid>
        <FormField label="Identificador" htmlFor="identificador" required>
          <Input
            id="identificador"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="estufa-01"
            maxLength={CODIGO_MAX}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            required
            autoFocus
          />
        </FormField>

        <FormField label="Tipo" htmlFor="tipo" required>
          <Input
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            list="tipos-sensor"
            placeholder="DHT11"
            maxLength={50}
            required
          />
          <datalist id="tipos-sensor">
            {TIPOS_SUGERIDOS.map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
        </FormField>

        <FormField label="Lote" htmlFor="lote" required hint="Só aparecem os lotes em cultivo.">
          <SelectField
            id="lote"
            value={loteId}
            onValueChange={setLoteId}
            options={lotes.map((l) => ({
              value: String(l.id),
              label: `${l.nome_identificacao} — ${l.propriedade.nome}${
                variasEmpresas ? ` (${l.empresa.razao_social})` : ''
              }`,
            }))}
          />
        </FormField>

        <FormField label="Data de instalação" htmlFor="instalacao">
          <Input
            id="instalacao"
            type="date"
            value={dataInstalacao}
            onChange={(e) => setDataInstalacao(e.target.value)}
          />
        </FormField>
      </FormGrid>

      <Hint>
        Código do sensor (também o usuário MQTT):{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{codigo}</code>. A senha
        é gerada automaticamente.
      </Hint>

      <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
        <legend className="px-1 text-sm font-medium">Dados que o sensor envia *</legend>
        <Hint>
          Dê um nome a cada dado e escolha o tipo. A chave é o nome do campo no JSON que o
          sensor publica (ex.: {'{"temperatura": 25.3}'}).
        </Hint>
        <EditorMedidas medidas={medidas} onChange={setMedidas} />
      </fieldset>

      <ErrorMessage message={erroLocal || error} />

      <FormActions
        submitLabel="Cadastrar sensor"
        pendingLabel="Cadastrando..."
        pending={pending}
        onCancel={onCancelar}
      />
    </form>
  )
}
