import { MEDIDAS_MAX, gerarChave, novaMedida, type MedidaRascunho } from './medidas'
import { TIPO_MEDIDA_LABELS, UNIDADE_PADRAO, type TipoMedida } from './tipos'

type Props = {
  medidas: MedidaRascunho[]
  onChange: (medidas: MedidaRascunho[]) => void
}

/** Lista editável dos dados que o sensor envia (nome, tipo, unidade e chave do JSON). */
function EditorMedidas({ medidas, onChange }: Props) {
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
    <div className="editor-medidas">
      {medidas.map((m, i) => (
        <div className="editor-medidas__linha" key={m.id ?? `novo-${i}`}>
          <label className="form-field">
            <span>Nome *</span>
            <input
              value={m.nome}
              onChange={(event) => alterar(i, { nome: event.target.value })}
              maxLength={60}
              placeholder="Temperatura do ar"
            />
          </label>
          <label className="form-field">
            <span>Tipo</span>
            <select
              value={m.tipo}
              onChange={(event) => alterar(i, { tipo: event.target.value as TipoMedida })}
            >
              {Object.entries(TIPO_MEDIDA_LABELS).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field editor-medidas__unidade">
            <span>Unidade</span>
            <input
              value={m.unidade}
              onChange={(event) => alterar(i, { unidade: event.target.value })}
              maxLength={20}
              placeholder="—"
            />
          </label>
          <label className="form-field">
            <span>Chave no JSON</span>
            <input
              value={m.chave}
              onChange={(event) =>
                alterar(i, { chave: event.target.value.toLowerCase(), chaveManual: true })
              }
              maxLength={40}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <button
            type="button"
            className="editor-medidas__remover"
            onClick={() => onChange(medidas.filter((_, j) => j !== i))}
            aria-label={`Remover ${m.nome || `dado ${i + 1}`}`}
            title="Remover"
          >
            ×
          </button>
        </div>
      ))}

      <div className="editor-medidas__acoes">
        <button
          type="button"
          onClick={() => onChange([...medidas, novaMedida()])}
          disabled={medidas.length >= MEDIDAS_MAX}
        >
          + Adicionar dado
        </button>
        {medidas.length === 0 && (
          <button
            type="button"
            onClick={() =>
              onChange([
                novaMedida('TEMPERATURA', 'Temperatura'),
                novaMedida('UMIDADE', 'Umidade'),
              ])
            }
          >
            Usar temperatura e umidade (ex.: DHT11/DHT22)
          </button>
        )}
      </div>
    </div>
  )
}

export default EditorMedidas
