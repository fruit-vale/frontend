// formatos devolvidos pela API em /sensores e /propriedades

export type StatusSensor = 'ATIVO' | 'INATIVO' | 'MANUTENCAO'

/** Estado do login no broker; null quando a API não conseguiu consultar. */
export type AcessoMqtt = 'ativo' | 'inativo' | 'sem_acesso' | null

export type Sensor = {
  id: number
  codigo_sensor: string
  tipo: string
  status: StatusSensor
  data_instalacao: string | null
  propriedade: { id: number; nome: string }
  /** null em sensores cadastrados antes do vínculo com lotes */
  lote: { id: number; nome: string } | null
  empresa: { id: number; razao_social: string }
  /** dados que o sensor envia no JSON do MQTT */
  medidas: Medida[]
  total_leituras: number
  acesso_mqtt: AcessoMqtt
}

/** Lote como vem de GET /lotes (só os campos usados no cadastro de sensor). */
export type LoteResumo = {
  id: number
  nome_identificacao: string
  situacao: string
  propriedade: { id: number; nome: string }
  empresa: { id: number; razao_social: string }
}

export const STATUS_LABELS: Record<StatusSensor, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  MANUTENCAO: 'Manutenção',
}

export type TipoMedida =
  | 'TEMPERATURA'
  | 'UMIDADE'
  | 'PH'
  | 'LUMINOSIDADE'
  | 'PRECIPITACAO'
  | 'UMIDADE_SOLO'
  | 'OUTRO'

export type Medida = {
  id: number
  /** nome do campo no JSON publicado pelo sensor */
  chave: string
  nome: string
  unidade: string | null
  tipo: TipoMedida
}

export const TIPO_MEDIDA_LABELS: Record<TipoMedida, string> = {
  TEMPERATURA: 'Temperatura',
  UMIDADE: 'Umidade do ar',
  PH: 'pH',
  LUMINOSIDADE: 'Luminosidade',
  PRECIPITACAO: 'Precipitação',
  UMIDADE_SOLO: 'Umidade do solo',
  OUTRO: 'Outro',
}

/** Mesmas unidades sugeridas pela API quando não são informadas. */
export const UNIDADE_PADRAO: Record<TipoMedida, string> = {
  TEMPERATURA: '°C',
  UMIDADE: '%',
  PH: '',
  LUMINOSIDADE: 'lux',
  PRECIPITACAO: 'mm',
  UMIDADE_SOLO: '%',
  OUTRO: '',
}

/** Valor de exemplo para montar o JSON mostrado nas credenciais. */
export const VALOR_EXEMPLO: Record<TipoMedida, number> = {
  TEMPERATURA: 25.3,
  UMIDADE: 61,
  PH: 6.5,
  LUMINOSIDADE: 12000,
  PRECIPITACAO: 0,
  UMIDADE_SOLO: 35,
  OUTRO: 0,
}
