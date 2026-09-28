// Endereço público do broker (Traefik termina o TLS e repassa ao Mosquitto)
export const MQTT_HOST = import.meta.env.VITE_MQTT_HOST ?? 'mqtt.fruitvale.com.br'
export const MQTT_PORTA_TLS = 8883
export const MQTT_WSS = `wss://${MQTT_HOST}`

/** Prefixo de tópico liberado para os sensores da empresa. */
export const topicoEmpresa = (empresaId: number) => `empresas/${empresaId}/`

/** Tópico em que o sensor publica as leituras (lido e gravado pela API). */
export const topicoLeituras = (empresaId: number, codigo: string) =>
  `empresas/${empresaId}/sensores/${codigo}/leituras`

