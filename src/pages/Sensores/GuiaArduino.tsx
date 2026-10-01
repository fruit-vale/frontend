import { useState } from 'react'
import { MQTT_HOST } from '../../lib/mqtt'
import { LinhaCopiavel, type Credenciais } from './CredenciaisSensor'
import type { Medida } from './tipos'

const URL_BIBLIOTECA = 'https://github.com/fruit-vale/FruitVale-Arduino'

type Modo = 'portal' | 'codigo'

type Props = {
  credenciais: Credenciais
  medidas: Medida[]
  onVoltar: () => void
  onConcluir: () => void
}

/** Escapa o texto para dentro de uma string C. */
const textoC = (texto: string) => texto.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// palavras do C++ e nomes do próprio sketch: não servem como nome de variável
const RESERVADAS = new Set(
  ('alignas alignof and asm auto bool break case catch char class const constexpr continue default delete ' +
    'do double else enum explicit export extern false float for friend goto if inline int long mutable ' +
    'namespace new noexcept not nullptr operator or private protected public register return short signed ' +
    'sizeof static struct switch template this throw true try typedef typename union unsigned using virtual ' +
    'void volatile while xor fv setup loop delay millis serial').split(' '),
)
const variavel = (chave: string) => (RESERVADAS.has(chave) ? `${chave}_lido` : chave)

/** Sketch pronto para o Arduino IDE, com as chaves cadastradas neste sensor. */
function montarSketch(credenciais: Credenciais, medidas: Medida[], modo: Modo) {
  const configuracao =
    modo === 'codigo'
      ? [
          '  // Credenciais no código: não compartilhe este arquivo com a senha.',
          '  fv.wifi("NOME_DA_REDE", "SENHA_DO_WIFI");  // Wi-Fi 2,4 GHz do local',
          `  fv.sensor("${textoC(credenciais.username)}", "${textoC(credenciais.senha)}");`,
        ]
      : [
          '  // Wi-Fi e credenciais são preenchidos pelo celular, na rede "FruitVale-XXXX"',
          '  // (senha "fruitvale"), e ficam salvos na placa.',
        ]
  const leituras = medidas.length
    ? medidas.flatMap((m) => [
        `    float ${variavel(m.chave)} = 0;  // TODO: leia ${m.nome}${m.unidade ? ` (${m.unidade})` : ''} no seu sensor`,
        `    fv.valor("${m.chave}", ${variavel(m.chave)});`,
      ])
    : ['    // cadastre os dados do sensor no app (botão "Dados") e envie com fv.valor()']

  return [
    `// Sensor FruitVale: ${credenciais.username}`,
    '#include <FruitVale.h>',
    '',
    'FruitVale fv;',
    '',
    'void setup() {',
    '  Serial.begin(115200);',
    ...configuracao,
    ...(MQTT_HOST !== 'mqtt.fruitvale.com.br' ? [`  fv.host("${textoC(MQTT_HOST)}");`] : []),
    '  fv.intervalo(60);  // segundos entre leituras',
    '  fv.begin();',
    '}',
    '',
    'void loop() {',
    '  fv.loop();',
    '  if (fv.horaDeLer()) {',
    ...leituras,
    '    fv.enviar();',
    '  }',
    '}',
    '',
  ].join('\n')
}

/** Passo a passo para gravar a placa com a biblioteca FruitVale. */
function GuiaArduino({ credenciais, medidas, onVoltar, onConcluir }: Props) {
  const [modo, setModo] = useState<Modo>('portal')
  const [copiado, setCopiado] = useState(false)
  const sketch = montarSketch(credenciais, medidas, modo)

  async function copiarSketch() {
    try {
      await navigator.clipboard.writeText(sketch)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // sem permissão de área de transferência: use o download
    }
  }

  function baixarSketch() {
    // o Arduino IDE exige que a pasta tenha o mesmo nome do .ino
    const nome = `fruitvale_${credenciais.username.replace(/[^a-zA-Z0-9]/g, '_')}`
    const url = URL.createObjectURL(new Blob([sketch], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${nome}.ino`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="form-card guia-arduino">
      <p className="guia-arduino__destaque">
        <strong>Recomendado: use a biblioteca FruitVale no Arduino IDE.</strong> Ela já cuida do
        Wi-Fi, da conexão segura (TLS) com o broker, do relógio e do formato das leituras. Seu código
        só lê o sensor e chama <code>fv.valor()</code>. Host, porta e tópico já vêm configurados.
      </p>

      <div className="guia-arduino__credenciais">
        <span className="guia-arduino__subtitulo">O que a biblioteca precisa</span>
        <LinhaCopiavel rotulo="Usuário" valor={credenciais.username} />
        <LinhaCopiavel rotulo="Senha" valor={credenciais.senha} />
      </div>

      <div className="guia-arduino__modos" role="tablist" aria-label="Como passar as credenciais">
        <button type="button" role="tab" aria-selected={modo === 'portal'} onClick={() => setModo('portal')}>
          Pelo celular (recomendado)
        </button>
        <button type="button" role="tab" aria-selected={modo === 'codigo'} onClick={() => setModo('codigo')}>
          No código
        </button>
      </div>

      <ol className="guia-arduino__passos">
        <li>
          <strong>Instale o suporte ao ESP32.</strong> No Arduino IDE 2: <em>Ferramentas › Placa ›
          Gerenciador de Placas</em>, busque <code>esp32</code> (Espressif Systems) e instale.
        </li>
        <li>
          <strong>Instale a biblioteca.</strong> <em>Ferramentas › Gerenciar Bibliotecas</em>, busque{' '}
          <code>FruitVale</code> e clique em Instalar. Aceite instalar também as dependências
          (PubSubClient e ArduinoJson). Se ela não aparecer, baixe o ZIP em{' '}
          <a href={URL_BIBLIOTECA} target="_blank" rel="noreferrer">
            github.com/fruit-vale/FruitVale-Arduino
          </a>{' '}
          e use <em>Sketch › Incluir Biblioteca › Adicionar biblioteca .ZIP</em>.
        </li>
        <li>
          <strong>Use o código abaixo.</strong> Ele já tem as chaves deste sensor; troque cada{' '}
          <code>TODO</code> pela leitura do seu sensor.
          {modo === 'codigo' && (
            <>
              {' '}
              Preencha também <code>NOME_DA_REDE</code> e <code>SENHA_DO_WIFI</code>.
            </>
          )}
        </li>
        <li>
          <strong>Grave na placa.</strong> <em>Ferramentas › Placa</em>: <code>ESP32C3 Dev Module</code>{' '}
          (para a ESP32-C3), <em>USB CDC On Boot: Enabled</em>, escolha a porta e clique em Carregar.
        </li>
        {modo === 'portal' ? (
          <li>
            <strong>Configure pelo celular.</strong> Ao ligar, a placa cria a rede{' '}
            <code>FruitVale-XXXX</code> (senha <code>fruitvale</code>). Conecte nela; a página abre sozinha
            (ou acesse <code>http://192.168.4.1</code>). Preencha o Wi-Fi do local (2,4 GHz), o{' '}
            <strong>Usuário</strong> e a <strong>Senha</strong> acima e toque em Salvar.
          </li>
        ) : (
          <li>
            <strong>Pronto para ligar.</strong> Com as credenciais no código, a placa conecta direto, sem
            portal. Para trocar a senha depois, é preciso gravar a placa de novo.
          </li>
        )}
        <li>
          <strong>Confira.</strong> O LED pisca duas vezes ao conectar, e o Monitor Serial (115200) mostra
          cada envio. As leituras aparecem nesta tela, na coluna de leituras do sensor.
        </li>
      </ol>

      <div className="guia-arduino__codigo">
        <div className="guia-arduino__codigo-barra">
          <span>Sketch (.ino)</span>
          <div>
            <button type="button" className="credencial__copiar" onClick={copiarSketch}>
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
            <button type="button" className="credencial__copiar" onClick={baixarSketch}>
              Baixar .ino
            </button>
          </div>
        </div>
        <pre>
          <code>{sketch}</code>
        </pre>
      </div>

      {modo === 'portal' && (
        <p className="form-hint">
          Para reconfigurar (outro Wi-Fi ou nova senha do sensor): ligue a placa e aperte o botão BOOT nos
          primeiros 3 segundos; o portal abre de novo.
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onVoltar}>
          Voltar às credenciais
        </button>
        <button type="button" className="btn-primary" onClick={onConcluir}>
          Concluir
        </button>
      </div>
    </div>
  )
}

export default GuiaArduino
