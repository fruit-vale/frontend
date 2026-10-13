import { contarForaDaFaixa, faixaDaCultura, resumir, valoresDasSeries } from '@/lib/estatisticas'
import { formatarData, formatarDataHora } from '@/lib/format'
import { descreverPeriodo, periodoEmDatas } from '@/lib/periodo'
import type { Celula, Relatorio, SecaoRelatorio } from '@/lib/relatorio'
import { alertasService, lotesService, painelService } from '@/services'
import type { FiltroPainel, PeriodoPainel } from '@/services/painel.service'
import type { Alerta } from '@/types/alerta'
import { nomeCultura, type Cultura } from '@/types/cultura'
import { SITUACAO_LABELS, type Lote, type Safra } from '@/types/lote'
import type { Painel, Serie } from '@/types/painel'
import { TIPO_MEDIDA_LABELS } from '@/types/sensor'

export type TipoRelatorio = 'lote' | 'propriedade' | 'empresa' | 'safras'

export type Alvo =
  | { tipo: 'lote'; lote: Lote }
  | { tipo: 'propriedade'; id: number; nome: string }
  | { tipo: 'empresa'; id: number; nome: string }
  /** todas as safras do escopo, ou só de uma propriedade */
  | { tipo: 'safras'; propriedadeId: number | null; nome: string }

export type Contexto = {
  /** lotes do escopo do usuário */
  lotes: Lote[]
  culturas: Map<number, Cultura>
  tipos: Painel['tipos']
  admin: boolean
}

// a API devolve no máximo 8 sensores por consulta de série
const SERIES_MAX = 8
const ALERTAS_NO_RELATORIO = 20

const num = (v: number | null | undefined, casas = 1) =>
  v === null || v === undefined ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: casas })
const comUnidade = (v: number | null | undefined, unidade: string | null) =>
  v === null || v === undefined ? '—' : `${num(v)}${unidade ? ` ${unidade}` : ''}`
const produtividade = (s: Safra) =>
  s.produtividade === null ? '—' : `${num(s.produtividade, 2)} ${s.unidade_producao ?? ''}/ha`.trim()

/** Lotes do alvo, dentro do escopo já carregado. */
function lotesDoAlvo(alvo: Alvo, ctx: Contexto) {
  switch (alvo.tipo) {
    case 'lote':
      return [alvo.lote]
    case 'propriedade':
      return ctx.lotes.filter((l) => l.propriedade.id === alvo.id)
    case 'empresa':
      return ctx.lotes.filter((l) => l.empresa.id === alvo.id)
    case 'safras':
      return alvo.propriedadeId === null
        ? ctx.lotes
        : ctx.lotes.filter((l) => l.propriedade.id === alvo.propriedadeId)
  }
}

/**
 * Filtros de consulta do alvo. O painel e os alertas não filtram por empresa:
 * o administrador consulta propriedade por propriedade; os demais já recebem
 * só a própria empresa.
 */
function filtrosDoAlvo(alvo: Alvo, ctx: Contexto, lotes: Lote[]): FiltroPainel[] {
  if (alvo.tipo === 'lote') return [{ loteId: alvo.lote.id }]
  if (alvo.tipo === 'propriedade') return [{ propriedadeId: alvo.id }]
  if (!ctx.admin) return [{}]
  return [...new Set(lotes.map((l) => l.propriedade.id))].map((id) => ({ propriedadeId: id }))
}

async function secaoLeituras(
  alvo: Alvo,
  ctx: Contexto,
  filtros: FiltroPainel[],
  periodo: PeriodoPainel,
  signal?: AbortSignal,
): Promise<SecaoRelatorio> {
  const titulo = `Leituras (${descreverPeriodo(periodo)})`
  if (!ctx.tipos.length || !filtros.length)
    return { titulo, vazio: 'Nenhum sensor enviou leituras ainda.' }

  const cultura = alvo.tipo === 'lote' ? ctx.culturas.get(alvo.lote.cultura.id) : undefined
  let limitado = false
  let intervalo: 'hour' | 'day' = 'hour'
  const linhas: Celula[][] = []
  for (const { tipo, unidade } of ctx.tipos) {
    const respostas = await Promise.all(filtros.map((f) => painelService.serie(tipo, periodo, f, signal)))
    const series: Serie[] = respostas.flatMap((r) => r.series)
    intervalo = respostas[0]?.intervalo ?? intervalo
    if (respostas.some((r) => r.series.length >= SERIES_MAX)) limitado = true
    const valores = valoresDasSeries(series)
    const resumo = resumir(valores)
    if (!resumo) continue
    const u = respostas.find((r) => r.unidade)?.unidade ?? unidade
    const faixa = faixaDaCultura(cultura, tipo)
    const fora = faixa ? contarForaDaFaixa(valores, faixa) : null
    linhas.push([
      TIPO_MEDIDA_LABELS[tipo],
      comUnidade(resumo.media, u),
      comUnidade(resumo.min, u),
      comUnidade(resumo.max, u),
      series.length,
      alvo.tipo !== 'lote' ? '—' : fora ? `${num(fora.percentual)}%` : faixa ? 'Sem leituras' : 'Sem faixa',
    ])
  }
  return {
    titulo,
    texto: [
      `Valores sobre as médias ${intervalo === 'hour' ? 'por hora' : 'por dia'} de cada sensor.` +
        (alvo.tipo === 'lote' ? ' Fora da faixa: parte do tempo fora da faixa ideal da cultura.' : '') +
        (limitado ? ` Algumas consultas chegaram ao limite de ${SERIES_MAX} sensores.` : ''),
    ],
    tabela: {
      cabecalho: ['Dado', 'Média', 'Mínima', 'Máxima', 'Sensores', 'Fora da faixa'],
      linhas,
    },
    vazio: 'Nenhuma leitura no período.',
  }
}

async function secaoAlertas(
  alvo: Alvo,
  filtros: FiltroPainel[],
  periodo: PeriodoPainel,
  signal?: AbortSignal,
): Promise<{ secao: SecaoRelatorio; porLote: Map<number, number> }> {
  const titulo = 'Alertas'
  const { desde, ate } = periodoEmDatas(periodo)
  try {
    const respostas = await Promise.all(
      filtros.map((f) =>
        alertasService.listar(
          { loteId: f.loteId, propriedadeId: f.propriedadeId, desde, ate, limite: ALERTAS_NO_RELATORIO },
          signal,
        ),
      ),
    )
    const total = respostas.reduce((s, r) => s + r.total, 0)
    const naoLidos = respostas.reduce((s, r) => s + r.por_lote.reduce((t, l) => t + l.nao_lidos, 0), 0)
    const porLote = new Map(respostas.flatMap((r) => r.por_lote.map((l) => [l.lote.id, l.total] as const)))
    const recentes: Alerta[] = respostas
      .flatMap((r) => r.alertas)
      .sort((a, b) => (b.data_hora ?? '').localeCompare(a.data_hora ?? ''))
      .slice(0, ALERTAS_NO_RELATORIO)
    return {
      porLote,
      secao: {
        titulo,
        texto: [
          `${total} ${total === 1 ? 'alerta' : 'alertas'} no período, ${naoLidos} não ${naoLidos === 1 ? 'lido' : 'lidos'}.` +
            (total > recentes.length
              ? recentes.length === 1
                ? ' Abaixo, o mais recente.'
                : ` Abaixo, os ${recentes.length} mais recentes.`
              : ''),
        ],
        tabela: {
          cabecalho: ['Data e hora', ...(alvo.tipo === 'lote' ? [] : ['Lote']), 'Alerta', 'Situação'],
          linhas: recentes.map((a) => [
            a.data_hora ? formatarDataHora(a.data_hora) : '—',
            ...(alvo.tipo === 'lote' ? [] : [a.lote.nome]),
            a.mensagem,
            a.lido ? 'Lido' : 'Não lido',
          ]),
        },
        vazio: 'Nenhum alerta no período.',
      },
    }
  } catch {
    return { porLote: new Map(), secao: { titulo, vazio: 'Os alertas não puderam ser carregados.' } }
  }
}

async function carregarSafras(lotes: Lote[], signal?: AbortSignal) {
  const listas = await Promise.all(lotes.map((l) => lotesService.listarSafras(l.id, signal)))
  return lotes.flatMap((lote, i) => listas[i].map((safra) => ({ lote, safra })))
}

function secaoSafras(safras: { lote: Lote; safra: Safra }[], comLote: boolean): SecaoRelatorio {
  return {
    titulo: 'Safras e produtividade',
    tabela: {
      cabecalho: [
        ...(comLote ? ['Lote'] : []),
        'Cultura',
        'Plantio',
        'Colheita',
        'Duração (dias)',
        'Produção',
        'Produtividade',
      ],
      linhas: safras
        .sort(
          (a, b) =>
            a.lote.nome_identificacao.localeCompare(b.lote.nome_identificacao, 'pt-BR') ||
            (b.safra.data_plantio ?? '').localeCompare(a.safra.data_plantio ?? ''),
        )
        .map(({ lote, safra }) => [
          ...(comLote ? [lote.nome_identificacao] : []),
          nomeCultura(safra.cultura),
          formatarData(safra.data_plantio),
          safra.em_andamento ? 'Em andamento' : formatarData(safra.data_colheita),
          safra.duracao_dias ?? '—',
          safra.producao === null ? '—' : `${num(safra.producao, 2)} ${safra.unidade_producao ?? ''}`.trim(),
          produtividade(safra),
        ]),
    },
    vazio: 'Nenhuma safra registrada.',
  }
}

/** Média de produtividade agrupada por uma chave (lote ou cultura), por unidade. */
function compararProdutividade(
  safras: { lote: Lote; safra: Safra }[],
  chave: (s: { lote: Lote; safra: Safra }) => string,
) {
  const grupos = new Map<string, number[]>()
  for (const s of safras) {
    if (s.safra.produtividade === null) continue
    const k = `${chave(s)}|${s.safra.unidade_producao ?? ''}`
    grupos.set(k, [...(grupos.get(k) ?? []), s.safra.produtividade])
  }
  return [...grupos.entries()]
    .map(([k, valores]) => {
      const [nome, unidade] = k.split('|')
      const r = resumir(valores)!
      const u = unidade ? `${unidade}/ha` : 'por ha'
      return [nome, valores.length, `${num(r.media, 2)} ${u}`, `${num(r.max, 2)} ${u}`, `${num(r.min, 2)} ${u}`]
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'pt-BR'))
}

const agora = () =>
  new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export async function montarRelatorio(
  alvo: Alvo,
  periodo: PeriodoPainel,
  ctx: Contexto,
  signal?: AbortSignal,
): Promise<Relatorio> {
  const lotes = lotesDoAlvo(alvo, ctx)

  if (alvo.tipo === 'safras') {
    const safras = await carregarSafras(lotes, signal)
    const colhidas = safras.filter((s) => !s.safra.em_andamento)
    const cabecalho = ['', 'Safras com produção', 'Produtividade média', 'Melhor', 'Pior']
    return {
      titulo: `Relatório de safras — ${alvo.nome}`,
      subtitulo: `${lotes.length} ${lotes.length === 1 ? 'lote' : 'lotes'} · ${colhidas.length} ${colhidas.length === 1 ? 'safra colhida' : 'safras colhidas'}`,
      geradoEm: agora(),
      secoes: [
        {
          titulo: 'Produtividade por lote',
          tabela: { cabecalho: ['Lote', ...cabecalho.slice(1)], linhas: compararProdutividade(colhidas, (s) => s.lote.nome_identificacao) },
          vazio: 'Nenhuma safra colhida com produção registrada.',
        },
        {
          titulo: 'Produtividade por cultura',
          tabela: { cabecalho: ['Cultura', ...cabecalho.slice(1)], linhas: compararProdutividade(colhidas, (s) => nomeCultura(s.safra.cultura)) },
          vazio: 'Nenhuma safra colhida com produção registrada.',
        },
        secaoSafras(safras, true),
      ],
    }
  }

  const filtros = filtrosDoAlvo(alvo, ctx, lotes)
  const [leituras, alertas, safras] = await Promise.all([
    secaoLeituras(alvo, ctx, filtros, periodo, signal),
    secaoAlertas(alvo, filtros, periodo, signal),
    carregarSafras(lotes, signal),
  ])

  const area = lotes.reduce((s, l) => s + (l.area_ha ?? 0), 0)
  const identificacao: SecaoRelatorio =
    alvo.tipo === 'lote'
      ? (() => {
          const l = alvo.lote
          const atual = safras.find((s) => s.safra.em_andamento)?.safra
          return {
            titulo: 'Lote e safra atual',
            texto: [
              `Lote: ${l.nome_identificacao} · ${l.propriedade.nome} · ${l.empresa.razao_social}`,
              `Cultura: ${nomeCultura(l.cultura)} · Situação: ${SITUACAO_LABELS[l.situacao]} · Área: ${num(l.area_ha, 2)} ha`,
              atual
                ? `Safra atual: plantio em ${formatarData(atual.data_plantio)}, colheita prevista para ${formatarData(atual.previsao_colheita)}` +
                  (atual.duracao_dias !== null ? `, ${atual.duracao_dias} dias de ciclo até hoje.` : '.')
                : 'Sem safra em andamento.',
              `Sensores: ${l.total_sensores}`,
            ],
          }
        })()
      : {
          titulo: 'Lotes',
          texto: [
            `${lotes.length} ${lotes.length === 1 ? 'lote' : 'lotes'} · ${num(area, 2)} ha · ` +
              `${lotes.filter((l) => l.situacao === 'EM_CULTIVO').length} em cultivo`,
          ],
          tabela: {
            cabecalho: ['Lote', 'Propriedade', 'Cultura', 'Situação', 'Área (ha)', 'Colheita prevista', 'Sensores', 'Alertas no período'],
            linhas: lotes.map((l) => [
              l.nome_identificacao,
              l.propriedade.nome,
              nomeCultura(l.cultura),
              SITUACAO_LABELS[l.situacao],
              num(l.area_ha, 2),
              formatarData(l.previsao_colheita),
              l.total_sensores,
              alertas.porLote.get(l.id) ?? 0,
            ]),
          },
          vazio: 'Nenhum lote cadastrado.',
        }

  const nome = alvo.tipo === 'lote' ? alvo.lote.nome_identificacao : alvo.nome
  const rotulo = { lote: 'lote', propriedade: 'propriedade', empresa: 'empresa' }[alvo.tipo]
  return {
    titulo: `Relatório de ${rotulo} — ${nome}`,
    subtitulo: `Período: ${descreverPeriodo(periodo)}`,
    geradoEm: agora(),
    secoes: [identificacao, leituras, alertas.secao, secaoSafras(safras, alvo.tipo !== 'lote')],
  }
}
