import { useState } from 'react'
import {
  MQTT_HOST,
  MQTT_PORTA_TLS,
  MQTT_WSS,
  topicoLeituras,
} from '../../lib/mqtt'
import { VALOR_EXEMPLO, type Medida } from './tipos'

export type Credenciais = {
  username: string
  senha: string
  empresa_id: number | null
}

type Props = {
  credenciais: Credenciais
  /** Dados do sensor: montam o JSON de exemplo com as chaves certas. */
  medidas: Medida[]
  onConcluir: () => void
}

function LinhaCopiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // sem permissão de área de transferência: o valor segue visível
    }
  }

  return (
    <div className="credencial">
      <span className="credencial__rotulo">{rotulo}</span>
      <code className="credencial__valor">{valor}</code>
      <button type="button" className="credencial__copiar" onClick={copiar}>
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

// A API só devolve a senha nesta resposta; o broker guarda apenas o hash
function CredenciaisSensor({ credenciais, medidas, onConcluir }: Props) {
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
      `Host: ${MQTT_HOST}`,
      `Porta (TLS): ${MQTT_PORTA_TLS}`,
      `WebSocket: ${MQTT_WSS}`,
      ...(topico ? [`Tópico: ${topico}`] : []),
      ...(topico
        ? [
            '',
            'Exemplo de payload (valores numéricos):',
            exemplo,
            '',
            'Medidas configuradas:',
            ...medidas.map(
              (medida) =>
                `- ${medida.chave}: ${medida.nome}${medida.unidade ? ` (${medida.unidade})` : ''}`,
            ),
            '',
            'Opcional: inclua data_hora em ISO 8601 no payload.',
          ]
        : []),
      '',
    ].join('\n')
    const arquivo = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    const nomeSeguro = credenciais.username.replace(/[^a-zA-Z0-9_.-]/g, '_')
    link.href = url
    link.download = `credenciais-${nomeSeguro || 'sensor'}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="form-card credenciais">
      <p className="credenciais__aviso" role="alert">
        Copie a senha agora. Ela <strong>não será exibida novamente</strong>;
        se perder, gere uma nova senha para o sensor.
      </p>

      <LinhaCopiavel rotulo="Usuário" valor={credenciais.username} />
      <LinhaCopiavel rotulo="Senha" valor={credenciais.senha} />
      <LinhaCopiavel rotulo="Host" valor={MQTT_HOST} />
      <LinhaCopiavel rotulo="Porta (TLS)" valor={String(MQTT_PORTA_TLS)} />
      <LinhaCopiavel rotulo="WebSocket" valor={MQTT_WSS} />
      {topico !== null && (
        <>
          <LinhaCopiavel rotulo="Tópico" valor={topico} />
          <LinhaCopiavel rotulo="Exemplo" valor={exemplo} />
          <ul className="credenciais__medidas">
            {medidas.map((m) => (
              <li key={m.id}>
                <code>{m.chave}</code> — {m.nome}
                {m.unidade ? ` (${m.unidade})` : ''}
              </li>
            ))}
          </ul>
          <p className="form-hint">
            Publique um JSON com um ou mais desses dados, sempre como número.
            Opcional: <code>data_hora</code> em ISO 8601 (sem ela, vale o
            horário de recebimento).
          </p>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={baixarCredenciais}>
          Baixar credenciais (.txt)
        </button>
        <button type="button" className="btn-primary" onClick={onConcluir}>
          Já copiei, concluir
        </button>
      </div>
    </div>
  )
}

export default CredenciaisSensor
