import { useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import { CopyButton, CopyRow } from '@/components/shared/CopyRow'
import { Hint } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/config/env'
import { baixarArquivo } from '@/lib/download'
import type { Credenciais, Medida } from '@/types/sensor'

const URL_BIBLIOTECA = 'https://github.com/fruit-vale/FruitVale-Arduino'
const HOST_PADRAO = 'mqtt.fruitvale.com.br'

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
    ...(env.mqttHost !== HOST_PADRAO ? [`  fv.host("${textoC(env.mqttHost)}");`] : []),
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

const Cod = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
)

/** Passo a passo para gravar a placa com a biblioteca FruitVale. */
export function GuiaArduino({ credenciais, medidas, onVoltar, onConcluir }: Props) {
  const [modo, setModo] = useState<Modo>('portal')
  const sketch = montarSketch(credenciais, medidas, modo)

  function baixarSketch() {
    // o Arduino IDE exige que a pasta tenha o mesmo nome do .ino
    const nome = `fruitvale_${credenciais.username.replace(/[^a-zA-Z0-9]/g, '_')}`
    baixarArquivo(`${nome}.ino`, sketch)
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
        <strong>Recomendado: use a biblioteca FruitVale no Arduino IDE.</strong> Ela já
        cuida do Wi-Fi, da conexão segura (TLS) com o broker, do relógio e do formato das
        leituras. Seu código só lê o sensor e chama <Cod>fv.valor()</Cod>. Host, porta e
        tópico já vêm configurados.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">O que a biblioteca precisa</span>
        <CopyRow rotulo="Usuário" valor={credenciais.username} />
        <CopyRow rotulo="Senha" valor={credenciais.senha} />
      </div>

      <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)}>
        <TabsList aria-label="Como passar as credenciais">
          <TabsTrigger value="portal">Pelo celular (recomendado)</TabsTrigger>
          <TabsTrigger value="codigo">No código</TabsTrigger>
        </TabsList>
      </Tabs>

      <ol className="ml-5 list-decimal space-y-3 text-sm leading-relaxed marker:font-semibold">
        <li>
          <strong>Instale o suporte ao ESP32.</strong> No Arduino IDE 2:{' '}
          <em>Ferramentas › Placa › Gerenciador de Placas</em>, busque <Cod>esp32</Cod>{' '}
          (Espressif Systems) e instale.
        </li>
        <li>
          <strong>Instale a biblioteca.</strong>{' '}
          <em>Ferramentas › Gerenciar Bibliotecas</em>, busque <Cod>FruitVale</Cod> e clique
          em Instalar. Aceite instalar também as dependências (PubSubClient e ArduinoJson).
          Se ela não aparecer, baixe o ZIP em{' '}
          <a
            className="text-primary underline"
            href={URL_BIBLIOTECA}
            target="_blank"
            rel="noreferrer"
          >
            github.com/fruit-vale/FruitVale-Arduino
          </a>{' '}
          e use <em>Sketch › Incluir Biblioteca › Adicionar biblioteca .ZIP</em>.
        </li>
        <li>
          <strong>Use o código abaixo.</strong> Ele já tem as chaves deste sensor; troque
          cada <Cod>TODO</Cod> pela leitura do seu sensor.
          {modo === 'codigo' && (
            <>
              {' '}
              Preencha também <Cod>NOME_DA_REDE</Cod> e <Cod>SENHA_DO_WIFI</Cod>.
            </>
          )}
        </li>
        <li>
          <strong>Grave na placa.</strong> <em>Ferramentas › Placa</em>:{' '}
          <Cod>ESP32C3 Dev Module</Cod> (para a ESP32-C3), <em>USB CDC On Boot: Enabled</em>,
          escolha a porta e clique em Carregar.
        </li>
        {modo === 'portal' ? (
          <li>
            <strong>Configure pelo celular.</strong> Ao ligar, a placa cria a rede{' '}
            <Cod>FruitVale-XXXX</Cod> (senha <Cod>fruitvale</Cod>). Conecte nela; a página
            abre sozinha (ou acesse <Cod>http://192.168.4.1</Cod>). Preencha o Wi-Fi do
            local (2,4 GHz), o <strong>Usuário</strong> e a <strong>Senha</strong> acima e
            toque em Salvar.
          </li>
        ) : (
          <li>
            <strong>Pronto para ligar.</strong> Com as credenciais no código, a placa
            conecta direto, sem portal. Para trocar a senha depois, é preciso gravar a
            placa de novo.
          </li>
        )}
        <li>
          <strong>Confira.</strong> O LED pisca duas vezes ao conectar, e o Monitor Serial
          (115200) mostra cada envio. As leituras aparecem nesta tela, na coluna de leituras
          do sensor.
        </li>
      </ol>

      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">Sketch (.ino)</span>
          <div className="flex gap-2">
            <CopyButton valor={sketch} />
            <Button type="button" variant="outline" size="sm" onClick={baixarSketch}>
              <DownloadIcon />
              Baixar .ino
            </Button>
          </div>
        </div>
        <pre className="max-h-80 overflow-auto bg-[#171022] p-4 font-mono text-xs leading-relaxed text-[#f6f1e7]">
          <code>{sketch}</code>
        </pre>
      </div>

      {modo === 'portal' && (
        <Hint>
          Para reconfigurar (outro Wi-Fi ou nova senha do sensor): ligue a placa e aperte o
          botão BOOT nos primeiros 3 segundos; o portal abre de novo.
        </Hint>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="lg" onClick={onVoltar}>
          Voltar às credenciais
        </Button>
        <Button size="lg" onClick={onConcluir}>
          Concluir
        </Button>
      </div>
    </div>
  )
}
