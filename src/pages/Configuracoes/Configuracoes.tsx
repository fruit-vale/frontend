import './Configuracoes.css'

function Configuracoes() {
  return (
    <section className="config-page">
      <header className="config-page__header">
        <span className="config-page__eyebrow">ADMINISTRAÇÃO</span>
        <h1>Configurações</h1>
        <p>Preferências gerais da plataforma FruitVale.</p>
      </header>

      <section className="config-card">
        <h2>Plataforma</h2>

        <label className="config-field">
          <span>Nome da plataforma</span>
          <input type="text" defaultValue="FruitVale" />
        </label>

        <label className="config-field">
          <span>Fuso horário</span>
          <select defaultValue="america-recife">
            <option value="america-recife">América/Recife (UTC-3)</option>
            <option value="america-sao-paulo">América/São Paulo (UTC-3)</option>
          </select>
        </label>
      </section>

      <section className="config-card">
        <h2>Notificações</h2>

        <label className="config-toggle">
          <input type="checkbox" defaultChecked />
          <span>Alertar administradores sobre sensores inativos</span>
        </label>

        <label className="config-toggle">
          <input type="checkbox" defaultChecked />
          <span>Enviar resumo semanal por e-mail</span>
        </label>
      </section>

      <section className="config-card">
        <h2>Segurança</h2>

        <p className="config-card__hint">
          Apenas administradores podem alterar as permissões de outros
          perfis de usuário.
        </p>

        <label className="config-toggle">
          <input type="checkbox" />
          <span>Exigir verificação em duas etapas para administradores</span>
        </label>
      </section>

      <button type="button" className="config-page__save">
        Salvar alterações
      </button>
    </section>
  )
}

export default Configuracoes
