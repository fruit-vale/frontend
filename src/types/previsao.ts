/** GET /previsao: previsão de colheita pela temperatura (graus-dia). */

export type Confianca = 'alta' | 'media' | 'baixa'

export type PrevisaoGrausDia = {
  /** graus-dia somados até ontem (medidos + estimados nos dias sem leitura) */
  acumulado: number
  necessario: number
  /** 0 a 100 */
  progresso: number
  /** graus-dia por dia usados na projeção (média das últimas 2 semanas medidas) */
  ritmo: number
  /** "AAAA-MM-DD"; null se o ritmo é zero (frio abaixo da base) */
  previsao: string | null
  atingido: boolean
  dias_ciclo: number
  dias_medidos: number
  /** parte do ciclo coberta por leituras, de 0 a 1 */
  cobertura: number
  confianca: Confianca
}

/** Por que o lote não tem previsão pela temperatura. */
export type MotivoSemGrausDia = 'sem_parametros' | 'sem_plantio' | 'sem_leituras'

export type PrevisaoLote = {
  lote_id: number
  graus_dia: PrevisaoGrausDia | null
  motivo: MotivoSemGrausDia | null
}
