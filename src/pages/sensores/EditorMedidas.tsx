import { PlusIcon, XIcon } from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TIPO_MEDIDA_LABELS, UNIDADE_PADRAO, type TipoMedida } from '@/types/sensor'
import { MEDIDAS_MAX, gerarChave, novaMedida, type MedidaRascunho } from './medidas'

type Props = {
  medidas: MedidaRascunho[]
  onChange: (medidas: MedidaRascunho[]) => void
}

const TIPOS = Object.entries(TIPO_MEDIDA_LABELS).map(([value, label]) => ({ value, label }))

/** Lista editável dos dados que o sensor envia (nome, tipo, unidade e chave do JSON). */
export function EditorMedidas({ medidas, onChange }: Props) {
  function alterar(i: number, mudanca: Partial<MedidaRascunho>) {
    onChange(
      medidas.map((m, j) => {
        if (j !== i) return m
        const nova = { ...m, ...mudanca }
        // a chave acompanha o nome até ser editada à mão
        if (mudanca.nome !== undefined && !nova.chaveManual) nova.chave = gerarChave(nova.nome)
        // ao trocar o tipo, sugere a unidade (se ainda era a sugestão anterior)
        if (mudanca.tipo && m.unidade === UNIDADE_PADRAO[m.tipo])
          nova.unidade = UNIDADE_PADRAO[mudanca.tipo]
        return nova
      }),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {medidas.map((m, i) => (
        <div
          key={m.id ?? `novo-${i}`}
          className="grid grid-cols-2 items-end gap-3 rounded-xl border bg-muted/30 p-3 lg:grid-cols-[1.4fr_1.2fr_0.7fr_1.2fr_auto]"
        >
          <FormField label="Nome" htmlFor={`medida-nome-${i}`} required>
            <Input
              id={`medida-nome-${i}`}
              value={m.nome}
              onChange={(e) => alterar(i, { nome: e.target.value })}
              maxLength={60}
              placeholder="Temperatura do ar"
            />
          </FormField>
          <FormField label="Tipo" htmlFor={`medida-tipo-${i}`}>
            <SelectField
              id={`medida-tipo-${i}`}
              value={m.tipo}
              onValueChange={(v) => alterar(i, { tipo: v as TipoMedida })}
              options={TIPOS}
            />
          </FormField>
          <FormField label="Unidade" htmlFor={`medida-un-${i}`}>
            <Input
              id={`medida-un-${i}`}
              value={m.unidade}
              onChange={(e) => alterar(i, { unidade: e.target.value })}
              maxLength={20}
              placeholder="—"
            />
          </FormField>
          <FormField label="Chave no JSON" htmlFor={`medida-chave-${i}`}>
            <Input
              id={`medida-chave-${i}`}
              value={m.chave}
              onChange={(e) =>
                alterar(i, { chave: e.target.value.toLowerCase(), chaveManual: true })
              }
              maxLength={40}
              spellCheck={false}
              autoCapitalize="off"
            />
          </FormField>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange(medidas.filter((_, j) => j !== i))}
            aria-label={`Remover ${m.nome || `dado ${i + 1}`}`}
            title="Remover"
          >
            <XIcon />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...medidas, novaMedida()])}
          disabled={medidas.length >= MEDIDAS_MAX}
        >
          <PlusIcon />
          Adicionar dado
        </Button>
        {medidas.length === 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange([
                novaMedida('TEMPERATURA', 'Temperatura'),
                novaMedida('UMIDADE', 'Umidade'),
              ])
            }
          >
            Usar temperatura e umidade (ex.: DHT11/DHT22)
          </Button>
        )}
      </div>
    </div>
  )
}
