import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <h1 className="sidebar__logo">FruitVale</h1>

      <nav className="sidebar__nav">
        <a href="/">Início</a>
        <a href="/cultivos">Cultivos e Lotes</a>
        <a href="/plantacoes">Plantações</a>
        <a href="/sensores">Sensores</a>
        <a href="/leituras-alertas">Leituras e Alertas</a>
        <a href="/previsao">Previsão de Colheita</a>
      </nav>

      <div className="sidebar__bottom">
        <a href="/perfil">Perfil</a>
        <a href="/configuracoes">Configurações</a>
      </div>
    </aside>
  )
}

export default Sidebar