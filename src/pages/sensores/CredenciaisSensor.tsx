import { DownloadIcon } from 'lucide-react'
import { CopyRow } from '@/components/shared/CopyRow'
import { Hint } from '@/components/shared/EmptyState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MQTT_PORTA_TLS, MQTT_WSS, env } from '@/config/env'
import { baixarArquivo } from '@/lib/download'
import { topicoLeituras } from '@/lib/mqtt'
import { VALOR_EXEMPLO, type Credenciais, type Medida } from '@/types/sensor'

type Props = {
  credenciais: Credenciais
  /** Dados do sensor: montam o JSON de exemplo com as chaves certas. */
  medidas: Medida[]
  onConcluir: () => void
}

const descreverMedida = (m: Medida) =>
  `${m.nome}${m.unidade ? ` (${m.unidade})` : ''}`

// A API só devolve a senha nesta resposta; o broker guarda apenas o hash
export function CredenciaisSensor({ credenciais, medidas, onConcluir }: Props) {
  const exemplo = JSON.stringify(
    Object.fromEntries(medidas.map((m) => [m.chave, VALOR_EXEMPLO[m.tipo]])),
  )
  const topico =
    credenciais.empresa_id === null
      ? null
      : topicoLeituras(credenciais.empresa_id, credenciais.username)

  function baixarCredenciais() {
    const conteudo = [
      'Credenciais do sensor',
      '',
      `Usuário: ${credenciais.username}`,
      `Senha: ${credenciais.senha}`,
      '',
      'Conexão MQTT',
      `Host: ${env.mqttHost}`,
      `Porta (TLS): ${MQTT_PORTA_TLS}`,
      `WebSocket: ${MQTT_WSS}`,
      ...(topico
        ? [
            `Tópico: ${topico}`,
            '',
            'Exemplo de payload (valores numéricos):',
            exemplo,
            '',
            'Medidas configuradas:',
            ...medidas.map((m) => `- ${m.chave}: ${descreverMedida(m)}`),
            '',
            'Opcional: inclua data_hora em ISO 8601 no payload.',
          ]
        : []),
      '',
    ].join('\n')
    const nomeSeguro = credenciais.username.replace(/[^a-zA-Z0-9_.-]/g, '_')
    baixarArquivo(`credenciais-${nomeSeguro || 'sensor'}.txt`, conteudo)
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert className="border-warning/40 bg-warning-soft text-warning">
        <AlertDescription className="text-warning">
          Copie a senha agora. Ela <strong>não será exibida novamente</strong>; se perder,
          gere uma nova senha para o sensor.
        </AlertDescription>
      </Alert>

      <CopyRow rotulo="Usuário" valor={credenciais.username} />
      <CopyRow rotulo="Senha" valor={credenciais.senha} />
      {/* host, porta e tópico já vêm na biblioteca FruitVale; ficam só no .txt */}
      {topico !== null && (
        <>
          <CopyRow rotulo="Exemplo" valor={exemplo} />
          <ul className="space-y-1 text-sm text-muted-foreground">
            {medidas.map((m) => (
              <li key={m.id}>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  {m.chave}
                </code>{' '}
                — {descreverMedida(m)}
              </li>
            ))}
          </ul>
          <Hint>
            Publique um JSON com um ou mais desses dados, sempre como número. Opcional:{' '}
            <code>data_hora</code> em ISO 8601 (sem ela, vale o horário de recebimento).
          </Hint>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="lg" onClick={baixarCredenciais}>
          <DownloadIcon />
          Baixar credenciais (.txt)
        </Button>
        <Button size="lg" onClick={onConcluir}>
          Continuar: configurar a placa
        </Button>
      </div>
    </div>
  )
}
