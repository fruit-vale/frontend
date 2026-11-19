/** Variáveis de ambiente tipadas, lidas uma única vez. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'https://api.fruitvale.com.br',
  mqttHost: import.meta.env.VITE_MQTT_HOST ?? 'mqtt.fruitvale.com.br',
  /** WhatsApp comercial do botão "Contratar serviço": DDI + DDD + número (ex.: 5581999999999). */
  whatsappNumero: (import.meta.env.VITE_WHATSAPP_NUMERO ?? '').replace(/\D/g, ''),
  /** Quem opera a plataforma (controlador na LGPD), citado em /termos. */
  controladorNome: import.meta.env.VITE_CONTROLADOR_NOME ?? '',
  controladorCnpj: import.meta.env.VITE_CONTROLADOR_CNPJ ?? '',
  /** E-mail ou canal para pedidos de titulares de dados. */
  contatoPrivacidade: import.meta.env.VITE_CONTATO_PRIVACIDADE ?? '',
  /** Chave da Map Tiles API (imagem de satélite do Google); vazia = só NASA. */
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
} as const

// Broker MQTT: o Traefik termina o TLS e repassa ao Mosquitto
export const MQTT_PORTA_TLS = 8883
export const MQTT_WSS = `wss://${env.mqttHost}`
