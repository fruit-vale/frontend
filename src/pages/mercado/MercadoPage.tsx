import { useState } from 'react'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { PageHeader, SectionHeader } from '@/components/shared/PageHeader'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useEscopoEmpresa } from '@/hooks/use-escopo-empresa'
import { useRequest } from '@/hooks/use-request'
import { formatarDataHora } from '@/lib/format'
import { lotesService, mercadoService } from '@/services'
import { nomeCultura } from '@/types/cultura'
import type { FonteMercado } from '@/types/mercado'
import { PainelExportacao } from './PainelExportacao'
import { PainelPrecos } from './PainelPrecos'

const TODAS = 'todas'
const PERIODOS = [
  { value: '12', label: 'Últimos 12 meses' },
  { value: '24', label: 'Últimos 24 meses' },
  { value: '36', label: 'Últimos 36 meses' },
]
const NOME_FONTE: Record<FonteMercado, string> = {
  atacado: 'Conab · atacado (PROHORT)',
  produtor: 'Conab · preço ao produtor',
  exportacao: 'Comex Stat · exportações',
}

/** "MANGA PALMER" → "Palmer" (o nome da fruta já está na cultura escolhida). */
const variedade = (produto: string) => {
  const resto = produto.split(' ').slice(1).join(' ')
  return resto ? resto.charAt(0) + resto.slice(1).toLowerCase() : 'Sem variedade informada'
}

export default function MercadoPage() {
  const { user } = useAuth()
  const admin = user?.role === 'administrador'
  const daEmpresa = useEscopoEmpresa()
  const [culturaId, setCulturaId] = useState('')
  const [produto, setProduto] = useState(TODAS)
  const [meses, setMeses] = useState('12')
  const [atualizando, setAtualizando] = useState(false)

  const culturas = useRequest((s) => mercadoService.culturas(s), {
    errorPrefix: 'Não foi possível carregar as culturas',
    cacheKey: 'mercado-culturas',
  })
  const status = useRequest((s) => mercadoService.status(s), { cacheKey: 'mercado-status' })
  const lotes = useRequest((s) => lotesService.listar(s), { cacheKey: 'lotes' })

  const lista = culturas.data ?? []
  const cultura = lista.find((c) => c.id === Number(culturaId)) ?? lista[0]
  const id = cultura?.id
  const produtoEscolhido = produto === TODAS || !cultura?.produtos_atacado.includes(produto) ? null : produto

  const dados = useRequest(
    async (signal) => {
      const [atacado, produtor, exportacao] = await Promise.all([
        mercadoService.atacado(id!, Number(meses), produtoEscolhido, signal),
        mercadoService.produtor(id!, Number(meses), signal),
        mercadoService.exportacao(id!, Math.max(24, Number(meses)), signal),
      ])
      return { atacado, produtor, exportacao }
    },
    {
      key: `${id}-${produtoEscolhido}-${meses}`,
      enabled: id !== undefined,
      errorPrefix: 'Não foi possível carregar os dados de mercado',
    },
  )

  const lotesDaCultura = daEmpresa(lotes.data).filter(
    (l) => l.cultura.id === id && l.situacao === 'EM_CULTIVO' && l.previsao_colheita,
  )

  async function atualizar() {
    setAtualizando(true)
    try {
      const r = await mercadoService.atualizar()
      toast.success(
        r.iniciadas.length
          ? 'Atualização iniciada. Leva alguns minutos; recarregue a página depois.'
          : 'Já existe uma atualização em andamento.',
      )
      status.reload()
    } catch (e) {
      toast.error(getErrorMessage(e, 'Não foi possível iniciar a atualização.'))
    } finally {
      setAtualizando(false)
    }
  }

  const importacoes = status.data?.importacoes ?? []
  const nuncaImportado = status.data !== undefined && importacoes.every((i) => !i.concluido_em)

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Análise de mercado"
        title="Mercado e Exportação"
        description="Preços da sua fruta no atacado e na porteira, onde e quando vender melhor, e para onde o Brasil exporta."
      />

      <ErrorMessage message={culturas.error || dados.error} />

      {culturas.loading && !culturas.data ? (
        <Skeleton className="h-64" />
      ) : lista.length === 0 ? (
        <EmptyState>
          Nenhuma cultura cadastrada. Cadastre a cultura (por exemplo, Manga Palmer) para ver os
          preços dela.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SelectField
              aria-label="Cultura"
              value={String(id ?? '')}
              onValueChange={(v) => {
                setCulturaId(v)
                setProduto(TODAS)
              }}
              options={lista.map((c) => ({ value: String(c.id), label: nomeCultura(c) }))}
              className="w-60"
            />
            {cultura && cultura.produtos_atacado.length > 1 && (
              <SelectField
                aria-label="Variedade"
                value={produtoEscolhido ?? TODAS}
                onValueChange={setProduto}
                options={[
                  { value: TODAS, label: 'Variedade da cultura (ou todas)' },
                  ...cultura.produtos_atacado.map((p) => ({ value: p, label: variedade(p) })),
                ]}
                className="w-64"
              />
            )}
            <SelectField aria-label="Período" value={meses} onValueChange={setMeses} options={PERIODOS} className="w-48" />
          </div>

          {nuncaImportado && (
            <EmptyState>
              Os dados de mercado ainda não foram importados.{' '}
              {admin
                ? 'Use "Atualizar dados agora", no fim da página; a primeira importação leva alguns minutos.'
                : 'A importação roda sozinha toda semana; volte mais tarde.'}
            </EmptyState>
          )}

          {dados.loading && !dados.data ? (
            <Skeleton className="h-96" />
          ) : dados.data ? (
            <>
              {dados.data.atacado.produto && (
                <Hint>
                  Mostrando a variedade {variedade(dados.data.atacado.produto)}. Escolha outra ou
                  "todas" no seletor acima.
                </Hint>
              )}
              <PainelPrecos atacado={dados.data.atacado} produtor={dados.data.produtor} lotes={lotesDaCultura} />
              <section className="space-y-3">
                <SectionHeader eyebrow="Exportação" title="Para onde o Brasil exporta" />
                <PainelExportacao exportacao={dados.data.exportacao} />
              </section>
            </>
          ) : null}
        </>
      )}

      <footer className="flex flex-wrap items-start justify-between gap-4 border-t pt-4 text-sm text-muted-foreground">
        <ul className="space-y-1">
          {(['atacado', 'produtor', 'exportacao'] as const).map((f) => {
            const i = importacoes.find((x) => x.fonte === f)
            const rodando = status.data?.em_andamento.includes(f)
            return (
              <li key={f}>
                <strong className="text-foreground">{NOME_FONTE[f]}</strong>:{' '}
                {rodando
                  ? 'atualizando agora…'
                  : i?.concluido_em
                    ? `atualizado em ${formatarDataHora(i.concluido_em)}`
                    : 'ainda não importado'}
                {i?.erro && !rodando && <span className="text-destructive"> · última tentativa falhou: {i.erro}</span>}
              </li>
            )
          })}
        </ul>
        {admin && (
          <Button variant="outline" onClick={atualizar} disabled={atualizando}>
            {atualizando ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
            Atualizar dados agora
          </Button>
        )}
      </footer>
    </section>
  )
}
