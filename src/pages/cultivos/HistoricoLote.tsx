import { useState } from 'react'
import type { FormEvent } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { EmptyState, ErrorMessage, Hint } from '@/components/shared/EmptyState'
import { FormActions } from '@/components/shared/FormActions'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAction } from '@/hooks/use-action'
import { useConfirm } from '@/hooks/use-confirm'
import { useRequest } from '@/hooks/use-request'
import { formatarData, formatarNumero, numeroOuNull, plural } from '@/lib/format'
import { lotesService, sensoresService } from '@/services'
import { nomeCultura, type CulturaResumo } from '@/types/cultura'
import type { Lote, Safra } from '@/types/lote'

type Props = {
  lote: Lote
  /** culturas disponíveis (vazio para quem só consulta) */
  culturas: CulturaResumo[]
  podeEditar: boolean
  /** a safra atual mudou (colheita/nova safra): o card do lote precisa recarregar */
  onLoteAlterado: () => void
}

type Formulario =
  | { tipo: 'nenhum' }
  | { tipo: 'colheita' }
  | { tipo: 'nova' }
  | { tipo: 'editar'; safra: Safra }

const UNIDADES = ['kg', 't', 'caixas', 'sacas', 'unidades']
const hoje = () => new Date().toISOString().slice(0, 10)

const TITULOS = {
  colheita: 'Registrar colheita da safra atual',
  nova: 'Iniciar nova safra',
  editar: 'Corrigir safra',
} as const

/** Campos compartilhados pelos formulários de colheita, nova safra e edição. */
type Campos = {
  cultura_id: string
  data_plantio: string
  previsao_colheita: string
  data_colheita: string
  producao: string
  unidade_producao: string
  observacoes: string
  situacao: 'EM_PREPARO' | 'EM_CULTIVO'
}

const camposVazios = (): Campos => ({
  cultura_id: '',
  data_plantio: '',
  previsao_colheita: '',
  data_colheita: hoje(),
  producao: '',
  unidade_producao: 'kg',
  observacoes: '',
  situacao: 'EM_CULTIVO',
})

const camposDaSafra = (s: Safra): Campos => ({
  cultura_id: String(s.cultura.id),
  data_plantio: s.data_plantio ?? '',
  previsao_colheita: s.previsao_colheita ?? '',
  data_colheita: s.data_colheita ?? '',
  producao: s.producao?.toString() ?? '',
  unidade_producao: s.unidade_producao ?? 'kg',
  observacoes: s.observacoes ?? '',
  situacao: 'EM_CULTIVO',
})

/** Linha do tempo das safras do lote, com colheita e início de nova safra. */
export function HistoricoLote({ lote, culturas, podeEditar, onLoteAlterado }: Props) {
  const confirm = useConfirm()
  const [formulario, setFormulario] = useState<Formulario>({ tipo: 'nenhum' })
  const [campos, setCampos] = useState<Campos>(camposVazios)
  const [erroLocal, setErroLocal] = useState('')
  const { run, pending, error, clearError } = useAction()

  const { data: safras, error: erro, reload } = useRequest(
    (signal) => lotesService.listarSafras(lote.id, signal),
    { key: lote.id, errorPrefix: 'Não foi possível carregar o histórico' },
  )

  // culturas da plataforma e da empresa do lote
  const culturasDoLote = culturas.filter((c) => !c.empresa || c.empresa.id === lote.empresa.id)

  function abrir(novo: Formulario) {
    setCampos(novo.tipo === 'editar' ? camposDaSafra(novo.safra) : camposVazios())
    setErroLocal('')
    clearError()
    setFormulario(novo)
  }

  function campo(nome: keyof Campos) {
    return {
      value: campos[nome],
      onChange: (event: { target: { value: string } }) =>
        setCampos((atual) => ({ ...atual, [nome]: event.target.value })),
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formulario.tipo === 'nenhum') return
    if (formulario.tipo !== 'colheita' && !campos.cultura_id)
      return setErroLocal('Selecione a cultura.')
    setErroLocal('')

    const producao = numeroOuNull(campos.producao)
    const observacoes = campos.observacoes || null
    if (formulario.tipo === 'colheita' && !(await confirmarColheita())) return

    const salva = await run(() => {
      if (formulario.tipo === 'colheita')
        return lotesService.registrarColheita(lote.id, {
          data_colheita: campos.data_colheita,
          producao,
          unidade_producao: campos.unidade_producao,
          observacoes,
        })
      if (formulario.tipo === 'nova')
        return lotesService.iniciarSafra(lote.id, {
          cultura_id: Number(campos.cultura_id),
          data_plantio: campos.data_plantio || null,
          previsao_colheita: campos.previsao_colheita || null,
          situacao: campos.situacao,
          observacoes,
        })
      const emAndamento = formulario.safra.em_andamento
      return lotesService.atualizarSafra(lote.id, formulario.safra.id, {
        cultura_id: Number(campos.cultura_id),
        data_plantio: campos.data_plantio || null,
        previsao_colheita: campos.previsao_colheita || null,
        data_colheita: emAndamento ? null : campos.data_colheita || null,
        producao: emAndamento ? null : producao,
        unidade_producao: campos.unidade_producao,
        observacoes,
      })
    })

    if (salva) {
      setFormulario({ tipo: 'nenhum' })
      reload()
      // colheita, nova safra ou edição da atual mudam o que o card mostra
      onLoteAlterado()
      const desativados: string[] =
        'sensores_desativados' in salva && Array.isArray(salva.sensores_desativados)
          ? salva.sensores_desativados
          : []
      toast.success(
        desativados.length
          ? `Colheita registrada. ${desativados.length} ${plural(desativados.length, 'sensor desativado', 'sensores desativados')}: ${desativados.join(', ')}.`
          : formulario.tipo === 'colheita'
            ? 'Colheita registrada.'
            : 'Safra salva.',
      )
    }
  }

  /**
   * A colheita encerra a safra e desativa os sensores do lote: mostra quais
   * antes de gravar. Sem conseguir listar, avisa pelo total do lote.
   */
  async function confirmarColheita() {
    const codigos = await sensoresService
      .listar()
      .then((todos) => todos.filter((s) => s.lote?.id === lote.id).map((s) => s.codigo_sensor))
      .catch(() => null)
    const total = codigos?.length ?? lote.total_sensores
    const lista = codigos?.length ? ` (${codigos.join(', ')})` : ''
    const cultura = nomeCultura(lote.cultura)

    return confirm({
      title: `Confirmar a colheita de ${lote.nome_identificacao}?`,
      description: [
        `A safra de ${cultura} é encerrada com colheita em ${formatarData(campos.data_colheita)}, e o lote passa a constar como colhido.`,
        total > 0
          ? `${total} ${plural(total, 'sensor deste lote será desativado', 'sensores deste lote serão desativados')}${lista}: o login MQTT é bloqueado e ${plural(total, 'ele sai', 'eles saem')} do lote. As leituras já recebidas continuam no histórico.\n\nPara usar na próxima safra, abra Sensores → Mudar de lote.`
          : 'Este lote não tem sensores.',
      ].join('\n\n'),
      confirmLabel: 'Confirmar colheita',
      cancelLabel: 'Voltar',
      destructive: total > 0,
    })
  }

  async function excluir(safra: Safra) {
    const confirmado = await confirm({
      title: 'Excluir esta safra?',
      description: `${nomeCultura(safra.cultura)}, colhida em ${formatarData(safra.data_colheita)}.`,
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (!confirmado) return

    try {
      await lotesService.excluirSafra(lote.id, safra.id)
      reload()
      onLoteAlterado()
      toast.success('Safra excluída.')
    } catch (e) {
      toast.error(getErrorMessage(e, 'Erro ao excluir.'))
    }
  }

  const editandoAtual = formulario.tipo === 'editar' && formulario.safra.em_andamento
  const mostraCultura = formulario.tipo === 'nova' || formulario.tipo === 'editar'
  const mostraColheita =
    formulario.tipo === 'colheita' || (formulario.tipo === 'editar' && !editandoAtual)

  return (
    <div className="flex flex-col gap-3">
      {podeEditar && formulario.tipo === 'nenhum' && (
        <div>
          {lote.safra_atual_id ? (
            <Button onClick={() => abrir({ tipo: 'colheita' })}>
              Registrar colheita
            </Button>
          ) : (
            <Button onClick={() => abrir({ tipo: 'nova' })}>
              Iniciar nova safra
            </Button>
          )}
        </div>
      )}

      {formulario.tipo !== 'nenhum' && (
        <form
          className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4"
          onSubmit={enviar}
          noValidate
        >
          <h3 className="font-heading text-base font-semibold">{TITULOS[formulario.tipo]}</h3>

          {mostraCultura && (
            <FormGrid>
              <FormField label="Cultura" htmlFor="h-cultura" required>
                <SelectField
                  id="h-cultura"
                  value={campos.cultura_id}
                  onValueChange={(v) => setCampos((c) => ({ ...c, cultura_id: v }))}
                  options={culturasDoLote.map((c) => ({
                    value: String(c.id),
                    label: nomeCultura(c),
                  }))}
                />
              </FormField>
              <FormField label="Data de plantio" htmlFor="h-plantio">
                <Input id="h-plantio" type="date" {...campo('data_plantio')} />
              </FormField>
              <FormField label="Previsão de colheita" htmlFor="h-previsao">
                <Input
                  id="h-previsao"
                  type="date"
                  {...campo('previsao_colheita')}
                  min={campos.data_plantio || undefined}
                />
              </FormField>
              {formulario.tipo === 'nova' && (
                <FormField label="Situação" htmlFor="h-situacao">
                  <SelectField
                    id="h-situacao"
                    value={campos.situacao}
                    onValueChange={(v) =>
                      setCampos((c) => ({ ...c, situacao: v as Campos['situacao'] }))
                    }
                    options={[
                      { value: 'EM_PREPARO', label: 'Em preparo' },
                      { value: 'EM_CULTIVO', label: 'Em cultivo' },
                    ]}
                  />
                </FormField>
              )}
            </FormGrid>
          )}

          {mostraColheita && (
            <FormGrid>
              <FormField label="Data de colheita" htmlFor="h-colheita" required>
                <Input id="h-colheita" type="date" {...campo('data_colheita')} max={hoje()} />
              </FormField>
              <FormField label="Produção colhida" htmlFor="h-producao">
                <Input
                  id="h-producao"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="ex.: 12500"
                  {...campo('producao')}
                />
              </FormField>
              <FormField label="Unidade" htmlFor="h-unidade">
                <Input
                  id="h-unidade"
                  list="unidades-producao"
                  maxLength={20}
                  {...campo('unidade_producao')}
                />
                <datalist id="unidades-producao">
                  {UNIDADES.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </FormField>
            </FormGrid>
          )}

          <FormField label="Observações" htmlFor="h-obs">
            <Textarea id="h-obs" rows={2} maxLength={2000} {...campo('observacoes')} />
          </FormField>

          <ErrorMessage message={erroLocal || error} />

          <FormActions
            submitLabel="Salvar"
            pending={pending}
            onCancel={() => setFormulario({ tipo: 'nenhum' })}
          />
        </form>
      )}

      <ErrorMessage message={erro} />
      {safras === undefined && !erro && <Skeleton className="h-32 w-full" />}
      {safras?.length === 0 && <EmptyState>Nenhuma safra registrada.</EmptyState>}

      {safras && safras.length > 0 && (
        <ol className="flex flex-col gap-2 border-l-2 border-border pl-4">
          {safras.map((s) => (
            <li
              key={s.id}
              className="relative rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10 before:absolute before:top-4 before:-left-[1.4rem] before:size-2.5 before:rounded-full before:bg-border data-[andamento=true]:before:bg-primary"
              data-andamento={s.em_andamento}
            >
              <div className="flex items-center gap-2">
                <strong className="min-w-0 flex-1 truncate">{nomeCultura(s.cultura)}</strong>
                <StatusBadge tone={s.em_andamento ? 'success' : 'neutral'}>
                  {s.em_andamento
                    ? 'Em andamento'
                    : `Colhida em ${formatarData(s.data_colheita)}`}
                </StatusBadge>
                {podeEditar && formulario.tipo === 'nenhum' && (
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Corrigir safra"
                      title="Corrigir"
                      onClick={() => abrir({ tipo: 'editar', safra: s })}
                    >
                      <PencilIcon />
                    </Button>
                    {!s.em_andamento && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        aria-label="Excluir safra"
                        title="Excluir"
                        onClick={() => excluir(s)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                <Dado rotulo="Plantio" valor={formatarData(s.data_plantio)} />
                <Dado
                  rotulo={s.em_andamento ? 'Colheita prevista' : 'Previsão era'}
                  valor={formatarData(s.previsao_colheita)}
                />
                <Dado
                  rotulo={s.em_andamento ? 'Há' : 'Duração'}
                  valor={s.duracao_dias !== null ? `${s.duracao_dias} dias` : '—'}
                />
                {!s.em_andamento && (
                  <Dado
                    rotulo="Produção"
                    valor={
                      <>
                        {s.producao !== null
                          ? `${formatarNumero(s.producao)} ${s.unidade_producao ?? ''}`
                          : '—'}
                        {s.produtividade !== null && (
                          <small className="block text-xs font-normal text-muted-foreground">
                            {formatarNumero(s.produtividade)} {s.unidade_producao}/ha
                          </small>
                        )}
                      </>
                    }
                  />
                )}
              </dl>

              {s.observacoes && (
                <Hint className="mt-1.5 text-sm">{s.observacoes}</Hint>
              )}

            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm leading-tight font-medium">{valor}</dd>
    </div>
  )
}
