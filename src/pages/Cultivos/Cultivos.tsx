import './Cultivos.css'

function Cultivos() {
  return (
    <section className="cultivos-page">
      <header className="cultivos-page__header">
        <div>
          <span className="cultivos-page__eyebrow">GESTÃO AGRÍCOLA</span>

          <h1>Cultivos e Lotes</h1>

          <p>
            Gerencie os cultivos cadastrados e seus respectivos lotes.
          </p>
        </div>

        <button type="button" className="cultivos-page__add">
          + Adicionar cultivo
        </button>
      </header>

      <p className="empty-state">Nenhum cultivo cadastrado ainda.</p>
    </section>
  )
}

export default Cultivos