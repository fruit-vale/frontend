import { useEffect, useMemo, useState } from 'react'
import Modal from '../Modal/Modal'
import type { Serie } from './GraficoSensores'

/** GET /painel/leituras */
export type RespostaLeituras = {
  limite: number
  /** há mais leituras no período do que as devolvidas */
  cortado?: boolean
  leituras: {
    sensor: string
    lote: string | null
    dado: string
    unidade: string | null
    data_hora: string
    valor: number
  }[]
}

type Props = {
  aberto: boolean
  onFechar: () => void
  /** ex.: "Temperatura — últimos 7 dias" */
  titulo: string
  /** médias já carregadas pelo gráfico */
  series: Serie[]
  unidade: string | null
  intervalo: 'hour' | 'day'
  /** busca as leituras individuais do mesmo tipo e período do gráfico */
  buscarLeituras: () => Promise<RespostaLeituras>
}

type Aba = 'leituras' | 'medias'

const fmtNumero = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const fmtDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
const nomeSensor = (sensor: string, lote: string | null) => (lote ? `${sensor} · ${lote}` : sensor)

/** CSV no padrão do Excel em português: ";" como separador e vírgula decimal. */
function baixarCsv(nome: string, cabecalho: string[], linhas: (string | number)[][]) {
  const celula = (c: string | number) => {
    const texto = typeof c === 'number' ? String(c).replace('.', ',') : c
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const csv = [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n')
  // BOM: o Excel reconhece os acentos como UTF-8
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}

/** Modal com as leituras recebidas (data e hora de cada uma) e as médias do gráfico. */
function DadosSensores({ aberto, onFechar, titulo, series, unidade, intervalo, buscarLeituras }: Props) {
  const [aba, setAba] = useState<Aba>('leituras')
  const [resposta, setResposta] = useState<RespostaLeituras | null>(null)
  const [erro, setErro] = useState('')

  // recarrega a cada abertura: o período pode ter recebido leituras novas
  useEffect(() => {
    if (!aberto) return
    let ativo = true
    buscarLeituras()
      .then((r) => {
        if (!ativo) return
        setResposta(r)
        setErro('')
      })
      .catch((e: Error) => ativo && setErro(e.message))
    return () => {
      ativo = false
    }
  }, [aberto, buscarLeituras])

  const medias = useMemo(() => {
    const instantes = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.instante)))].sort().reverse()
    const porSerie = series.map((s) => new Map(s.pontos.map((p) => [p.instante, p.valor])))
    return { instantes, porSerie }
  }, [series])

  const un = unidade ? ` ${unidade}` : ''
  const rotuloMedia = intervalo === 'hour' ? 'Médias por hora' : 'Médias por dia'
  const fmtInstante = (iso: string) =>
    new Date(iso).toLocaleString(
      'pt-BR',
      intervalo === 'hour'
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' },
    )

  function exportar() {
    const base = titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
    if (aba === 'leituras' && resposta)
      baixarCsv(
        `leituras-${base}.csv`,
        ['data_hora', 'sensor', 'lote', 'dado', 'valor', 'unidade'],
        resposta.leituras.map((l) => [fmtDataHora(l.data_hora), l.sensor, l.lote ?? '', l.dado, l.valor, l.unidade ?? '']),
      )
    else
      baixarCsv(
        `medias-${base}.csv`,
        [intervalo === 'hour' ? 'hora' : 'dia', ...series.map((s) => nomeSensor(s.sensor, s.lote))],
        medias.instantes.map((i) => [fmtInstante(i), ...medias.porSerie.map((m) => m.get(i) ?? '')]),
      )
  }

  const leituras = resposta?.leituras ?? []

  return (
    <Modal aberto={aberto} titulo={titulo} onFechar={onFechar} largo>
      <div className="dados-sensores">
        <div className="dados-sensores__barra">
          <div className="dados-sensores__abas" role="tablist">
            <button type="button" role="tab" aria-selected={aba === 'leituras'} onClick={() => setAba('leituras')}>
              Leituras{resposta ? ` (${leituras.length.toLocaleString('pt-BR')})` : ''}
            </button>
            <button type="button" role="tab" aria-selected={aba === 'medias'} onClick={() => setAba('medias')}>
              {rotuloMedia} ({medias.instantes.length})
            </button>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportar}
            disabled={aba === 'leituras' ? !leituras.length : !medias.instantes.length}
          >
            Baixar CSV
          </button>
        </div>

        {aba === 'leituras' && (
          <>
            {erro && (
              <p className="form-error" role="alert">
                Não foi possível carregar as leituras: {erro}
              </p>
            )}
            {!resposta && !erro && <p className="form-hint">Carregando leituras...</p>}
            {resposta?.cortado && (
              <p className="form-hint">
                Mostrando as {resposta.limite.toLocaleString('pt-BR')} leituras mais recentes do período.
              </p>
            )}
            {resposta && leituras.length === 0 && <p className="empty-state">Nenhuma leitura neste período.</p>}
            {leituras.length > 0 && (
              <div className="dados-sensores__tabela">
                <table>
                  <thead>
                    <tr>
                      <th>Data e hora</th>
                      <th>Sensor</th>
                      <th>Dado</th>
                      <th className="dados-sensores__num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leituras.map((l, i) => (
                      <tr key={`${l.sensor}-${l.data_hora}-${i}`}>
                        <td>{fmtDataHora(l.data_hora)}</td>
                        <td>{nomeSensor(l.sensor, l.lote)}</td>
                        <td>{l.dado}</td>
                        <td className="dados-sensores__num">
                          {fmtNumero(l.valor)}
                          {l.unidade ? ` ${l.unidade}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {aba === 'medias' &&
          (medias.instantes.length === 0 ? (
            <p className="empty-state">Nenhuma leitura neste período.</p>
          ) : (
            <div className="dados-sensores__tabela">
              <table>
                <thead>
                  <tr>
                    <th>{intervalo === 'hour' ? 'Hora' : 'Dia'}</th>
                    {series.map((s) => (
                      <th key={s.sensor} className="dados-sensores__num">
                        {nomeSensor(s.sensor, s.lote)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medias.instantes.map((instante) => (
                    <tr key={instante}>
                      <td>{fmtInstante(instante)}</td>
                      {medias.porSerie.map((m, i) => {
                        const v = m.get(instante)
                        return (
                          <td key={series[i].sensor} className="dados-sensores__num">
                            {v === undefined ? '—' : `${fmtNumero(v)}${un}`}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </Modal>
  )
}

export default DadosSensores
