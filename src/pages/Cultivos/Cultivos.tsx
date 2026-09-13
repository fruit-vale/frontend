import './Cultivos.css'

type Cultivo = {
  nome: string
  emoji: string
  quantidadeLotes: number
}

const cultivos: Cultivo[] = [
  {
    nome: 'Uva',
    emoji: '🍇',
    quantidadeLotes: 2,
  },
  {
    nome: 'Manga',
    emoji: '🥭',
    quantidadeLotes: 2,
  },
]

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

      <div className="cultivos-grid">
        {cultivos.map((cultivo) => (
          <article className="cultivo-card" key={cultivo.nome}>
            <div className="cultivo-card__icon" aria-hidden="true">
              {cultivo.emoji}
            </div>

            <div className="cultivo-card__content">
              <h2>{cultivo.nome}</h2>

              <p>
                {cultivo.quantidadeLotes}{' '}
                {cultivo.quantidadeLotes === 1 ? 'lote' : 'lotes'} cadastrados
              </p>
            </div>

            <button type="button" className="cultivo-card__link">
              Ver lotes →
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Cultivos