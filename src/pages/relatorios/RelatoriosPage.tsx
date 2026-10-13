import { useRef, useState } from 'react'
import { DownloadIcon, FileSpreadsheetIcon, FileTextIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodoFiltro } from '@/components/shared/PeriodoFiltro'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useEscopoEmpresa } from '@/hooks/use-escopo-empresa'
import { useRequest } from '@/hooks/use-request'
import { porTexto } from '@/lib/format'
import { baixarRelatorioCsv, baixarRelatorioPdf, type Relatorio } from '@/lib/relatorio'
import { culturasService, lotesService, painelService } from '@/services'
import type { PeriodoPainel } from '@/services/painel.service'
import { montarRelatorio, type Alvo, type Contexto, type TipoRelatorio } from './montar-relatorio'

const TIPOS: { value: TipoRelatorio; label: string; descricao: string }[] = [
  { value: 'lote', label: 'Lote', descricao: 'Safra atual, leituras do período, alertas e produtividade por hectare.' },
  { value: 'propriedade', label: 'Propriedade', descricao: 'Os lotes da propriedade consolidados.' },
  { value: 'empresa', label: 'Empresa', descricao: 'Todas as propriedades e lotes da empresa.' },
  { value: 'safras', label: 'Safras', descricao: 'Produção e produtividade comparadas entre lotes e entre safras.' },
]
const TODAS = 'todas'

function SecaoNaTela({ secao }: { secao: Relatorio['secoes'][number] }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{secao.titulo}</h3>
      {secao.texto?.map((t) => (
        <p key={t} className="text-sm text-muted-foreground">
          {t}
        </p>
      ))}
      {secao.tabela?.linhas.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                {secao.tabela.cabecalho.map((c, i) => (
                  <th key={i} className="px-3 py-2 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secao.tabela.linhas.map((linha, i) => (
                <tr key={i} className="border-t">
                  {linha.map((c, j) => (
                    <td key={j} className="px-3 py-2">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        secao.vazio && <Hint>{secao.vazio}</Hint>
      )}
    </section>
  )
}

export default function RelatoriosPage() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const daEmpresa = useEscopoEmpresa()
  const [tipo, setTipo] = useState<TipoRelatorio>('lote')
  const [alvoId, setAlvoId] = useState('')
  const [periodo, setPeriodo] = useState<PeriodoPainel>(30)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [gerando, setGerando] = useState(false)
  const [baixandoPdf, setBaixandoPdf] = useState(false)
  const [erro, setErro] = useState('')
  const consulta = useRef<AbortController | null>(null)

  const { data, error, loading } = useRequest(
    async (signal) => {
      const [lotes, culturas, painel] = await Promise.all([
        lotesService.listar(signal),
        culturasService.listar(signal),
        painelService.obter(signal),
      ])
      return { lotes, culturas, tipos: painel.tipos }
    },
    { errorPrefix: 'Não foi possível carregar os dados', cacheKey: 'relatorios' },
  )
  const lotes = [...daEmpresa(data?.lotes)].sort(porTexto((l) => l.nome_identificacao))
  const propriedades = [...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values()].sort(
    porTexto((p) => p.nome),
  )
  const empresas = [...new Map(lotes.map((l) => [l.empresa.id, l.empresa])).values()].sort(
    porTexto((e) => e.razao_social),
  )

  const opcoes =
    tipo === 'lote'
      ? lotes.map((l) => ({ value: String(l.id), label: `${l.nome_identificacao} — ${l.propriedade.nome}` }))
      : tipo === 'propriedade'
        ? propriedades.map((p) => ({ value: String(p.id), label: p.nome }))
        : tipo === 'empresa'
          ? empresas.map((e) => ({ value: String(e.id), label: e.razao_social }))
          : [
              { value: TODAS, label: 'Todas as propriedades' },
              ...propriedades.map((p) => ({ value: String(p.id), label: p.nome })),
            ]
  // sem escolha (ou escolha de outro tipo): o primeiro da lista
  const escolhido = opcoes.some((o) => o.value === alvoId) ? alvoId : (opcoes[0]?.value ?? '')

  function alvo(): Alvo | null {
    const id = Number(escolhido)
    if (tipo === 'lote') {
      const lote = lotes.find((l) => l.id === id)
      return lote ? { tipo, lote } : null
    }
    if (tipo === 'propriedade') {
      const p = propriedades.find((x) => x.id === id)
      return p ? { tipo, id: p.id, nome: p.nome } : null
    }
    if (tipo === 'empresa') {
      const e = empresas.find((x) => x.id === id)
      return e ? { tipo, id: e.id, nome: e.razao_social } : null
    }
    const p = propriedades.find((x) => x.id === id)
    return { tipo, propriedadeId: p?.id ?? null, nome: p?.nome ?? 'todas as propriedades' }
  }

  async function gerar() {
    const a = alvo()
    if (!a || !data) return
    consulta.current?.abort()
    const controller = new AbortController()
    consulta.current = controller
    const ctx: Contexto = {
      lotes,
      culturas: new Map(data.culturas.map((c) => [c.id, c])),
      tipos: data.tipos,
      admin,
    }
    setErro('')
    setGerando(true)
    try {
      setRelatorio(await montarRelatorio(a, periodo, ctx, controller.signal))
    } catch (e) {
      if (!controller.signal.aborted) setErro(getErrorMessage(e, 'Não foi possível gerar o relatório.'))
    } finally {
      if (consulta.current === controller) setGerando(false)
    }
  }

  async function baixarPdf() {
    if (!relatorio) return
    setBaixandoPdf(true)
    try {
      await baixarRelatorioPdf(relatorio)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Não foi possível gerar o PDF.'))
    } finally {
      setBaixandoPdf(false)
    }
  }

  const descricao = TIPOS.find((t) => t.value === tipo)!.descricao

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Análise"
        title="Relatórios"
        description="Monte o relatório, confira na tela e baixe em PDF ou CSV (abre no Excel)."
      />
      <ErrorMessage message={error} />

      {loading && !data ? (
        <Skeleton className="h-40" />
      ) : lotes.length === 0 ? (
        <EmptyState>
          Nenhum lote cadastrado ainda. Os relatórios aparecem quando a empresa tiver lotes com safras e
          sensores.
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <FormField label="Relatório" htmlFor="rel-tipo" className="w-44">
                <SelectField
                  id="rel-tipo"
                  value={tipo}
                  onValueChange={(v) => {
                    setTipo(v as TipoRelatorio)
                    setRelatorio(null)
                  }}
                  options={TIPOS.map(({ value, label }) => ({ value, label }))}
                />
              </FormField>
              <FormField
                label={{ lote: 'Lote', propriedade: 'Propriedade', empresa: 'Empresa', safras: 'Propriedade' }[tipo]}
                htmlFor="rel-alvo"
                className="w-72"
              >
                <SelectField id="rel-alvo" value={escolhido} onValueChange={setAlvoId} options={opcoes} />
              </FormField>
              {tipo !== 'safras' && (
                <FormField label="Período das leituras e alertas" htmlFor="rel-periodo">
                  <PeriodoFiltro id="rel-periodo" value={periodo} onChange={setPeriodo} />
                </FormField>
              )}
              <Button size="lg" onClick={gerar} disabled={gerando || !escolhido}>
                {gerando ? <Loader2Icon className="animate-spin" /> : <FileTextIcon />}
                {gerando ? 'Gerando...' : 'Gerar relatório'}
              </Button>
            </div>
            <Hint>{descricao}</Hint>
          </CardContent>
        </Card>
      )}

      <ErrorMessage message={erro} />

      {relatorio && (
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{relatorio.titulo}</h2>
                <p className="text-sm text-muted-foreground">
                  {relatorio.subtitulo} · gerado em {relatorio.geradoEm}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => baixarRelatorioCsv(relatorio)}>
                  <FileSpreadsheetIcon />
                  Baixar CSV
                </Button>
                <Button onClick={baixarPdf} disabled={baixandoPdf}>
                  {baixandoPdf ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
                  Baixar PDF
                </Button>
              </div>
            </div>
            {relatorio.secoes.map((s) => (
              <SecaoNaTela key={s.titulo} secao={s} />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
