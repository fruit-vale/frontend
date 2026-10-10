/** Variáveis de ambiente tipadas, lidas uma única vez. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'https://api.fruitvale.com.br',
  mqttHost: import.meta.env.VITE_MQTT_HOST ?? 'mqtt.fruitvale.com.br',
  /** Chave da Map Tiles API (imagem de satélite do Google); vazia = só NASA. */
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
} as const

// Broker MQTT: o Traefik termina o TLS e repassa ao Mosquitto
export const MQTT_PORTA_TLS = 8883
export const MQTT_WSS = `wss://${env.mqttHost}`
