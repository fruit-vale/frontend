import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../../lib/api'
import type { Credenciais } from './CredenciaisSensor'
import EditorMedidas from './EditorMedidas'
import { paraApi, validarMedidas, type MedidaRascunho } from './medidas'
import type { LoteResumo, Sensor } from './tipos'

// mesmas regras da API (POST /sensores); o código final é empN-identificador
const IDENTIFICADOR_VALIDO = /^[A-Za-z0-9_.-]+$/
const PREFIXO_RESERVADO = /^emp\d+-/
const CODIGO_MAX = 50

const TIPOS_SUGERIDOS = ['DHT11', 'DHT22', 'Umidade do solo', 'pH', 'Luminosidade', 'Pluviômetro']

type Props = {
  lotes: LoteResumo[]
  onCriado: (sensor: Sensor, credenciais: Credenciais) => void
  onCancelar: () => void
}

function NovoSensorForm({ lotes, onCriado, onCancelar }: Props) {
  const [identificador, setIdentificador] = useState('')
  const [tipo, setTipo] = useState('')
  const [loteId, setLoteId] = useState(lotes.length === 1 ? String(lotes[0].id) : '')
  const [dataInstalacao, setDataInstalacao] = useState('')
  const [medidas, setMedidas] = useState<MedidaRascunho[]>([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const lote = lotes.find((l) => l.id === Number(loteId))
  const prefixo = lote ? `emp${lote.empresa.id}-` : 'empN-'
  // o administrador vê lotes de várias empresas: mostra de qual é cada um
  const variasEmpresas = new Set(lotes.map((l) => l.empresa.id)).size > 1
  const codigo = `${prefixo}${identificador.trim() || 'identificador'}`

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valor = identificador.trim()

    if (!IDENTIFICADOR_VALIDO.test(valor)) {
      setErro('O identificador deve ter só letras, números, _ . -')
      return
    }
    if (PREFIXO_RESERVADO.test(valor)) {
      setErro('Não use o prefixo empN- — ele é adicionado automaticamente.')
      return
    }
    if (!tipo.trim()) {
      setErro('Informe o tipo do sensor.')
      return
    }
    if (!lote) {
      setErro('Selecione o lote do sensor.')
      return
    }
    if (codigo.length > CODIGO_MAX) {
      setErro(`O código final (${codigo}) deve ter até ${CODIGO_MAX} caracteres.`)
      return
    }
    const erroMedidas = validarMedidas(medidas)
    if (erroMedidas) {
      setErro(erroMedidas)
      return
    }

    setErro('')
    setSalvando(true)
    try {
      const { sensor, credenciais } = await apiFetch<{
        sensor: Sensor
        credenciais: Credenciais
      }>('/sensores', {
        method: 'POST',
        body: JSON.stringify({
          identificador: valor,
          tipo: tipo.trim(),
          lote_id: lote.id,
          data_instalacao: dataInstalacao || null,
          medidas: paraApi(medidas),
        }),
      })
      onCriado(sensor, credenciais)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (lotes.length === 0) {
    return (
      <div className="form-card">
        <p className="form-error">
          Nenhum lote disponível. Cadastre um lote em Cultivos e Lotes antes
          de cadastrar sensores.
        </p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar}>
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="form-field">
          <span>Identificador *</span>
          <input
            value={identificador}
            onChange={(event) => setIdentificador(event.target.value)}
            placeholder="estufa-01"
            maxLength={CODIGO_MAX}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            required
            autoFocus
          />
        </label>

        <label className="form-field">
          <span>Tipo *</span>
          <input
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            list="tipos-sensor"
            placeholder="DHT11"
            maxLength={50}
            required
          />
          <datalist id="tipos-sensor">
            {TIPOS_SUGERIDOS.map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
        </label>

        <label className="form-field">
          <span>Lote *</span>
          <select value={loteId} onChange={(event) => setLoteId(event.target.value)}>
            <option value="">Selecione...</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome_identificacao} — {l.propriedade.nome}
                {variasEmpresas ? ` (${l.empresa.razao_social})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Data de instalação</span>
          <input
            type="date"
            value={dataInstalacao}
            onChange={(event) => setDataInstalacao(event.target.value)}
          />
        </label>
      </div>

      <p className="form-hint">
        Código do sensor (também o usuário MQTT): <code>{codigo}</code>. A
        senha é gerada automaticamente.
      </p>

      <fieldset className="sensor-medidas">
        <legend>Dados que o sensor envia *</legend>
        <p className="form-hint">
          Dê um nome a cada dado e escolha o tipo. A chave é o nome do campo no
          JSON que o sensor publica (ex.: {'{"temperatura": 25.3}'}).
        </p>
        <EditorMedidas medidas={medidas} onChange={setMedidas} />
      </fieldset>

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar sensor'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default NovoSensorForm
