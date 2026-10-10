/** Prefixo de tópico liberado para os sensores da empresa. */
export const topicoEmpresa = (empresaId: number) => `empresas/${empresaId}/`

/** Tópico em que o sensor publica as leituras (lido e gravado pela API). */
export const topicoLeituras = (empresaId: number, codigo: string) =>
  `empresas/${empresaId}/sensores/${codigo}/leituras`
