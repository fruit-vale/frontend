import './Mercado.css'

type PrecoMercado = {
  cultivo: string
  emoji: string
  precoAtual: string
  variacao: number
  destino: string
}

const precos: PrecoMercado[] = [
  {
    cultivo: 'Uva',
    emoji: '🍇',
    precoAtual: 'R$ 6,80/kg',
    variacao: 4.2,
    destino: 'Europa',
  },
  {
    cultivo: 'Manga',
    emoji: '🥭',
    precoAtual: 'R$ 3,10/kg',
    variacao: -1.8,
    destino: 'EUA',
  },
]

const recomendacoes = [
  {
    titulo: 'Janela de exportação — Uva',
    descricao:
      'Preço internacional em alta e previsão de colheita favorável nos próximos 12 dias.',
  },
  {
    titulo: 'Atenção — Manga',
    descricao:
      'Leve queda no preço médio de exportação; considere priorizar o mercado interno.',
  },
]

function Mercado() {
  return (
    <section className="mercado-page">
      <header className="mercado-page__header">
        <div>
          <span className="mercado-page__eyebrow">ANÁLISE DE MERCADO</span>

          <h1>Mercado e Exportação</h1>

          <p>
            Dashboards analíticos, preços de mercado e recomendações de
            exportação.
          </p>
        </div>

        <button type="button" className="mercado-page__report">
          Gerar relatório
        </button>
      </header>

      <section className="mercado-precos">
        {precos.map((preco) => (
          <article className="preco-card" key={preco.cultivo}>
            <div className="preco-card__top">
              <span className="preco-card__emoji">{preco.emoji}</span>
              <div>
                <h3>{preco.cultivo}</h3>
                <p>Exportação · {preco.destino}</p>
              </div>
            </div>

            <div className="preco-card__valor">
              <strong>{preco.precoAtual}</strong>
              <span
                className={
                  preco.variacao >= 0
                    ? 'preco-card__variacao preco-card__variacao--alta'
                    : 'preco-card__variacao preco-card__variacao--baixa'
                }
              >
                {preco.variacao >= 0 ? '▲' : '▼'} {Math.abs(preco.variacao)}%
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mercado-recomendacoes">
        <h2>Recomendações de exportação</h2>

        <div className="mercado-recomendacoes__list">
          {recomendacoes.map((recomendacao) => (
            <article className="recomendacao-card" key={recomendacao.titulo}>
              <h3>{recomendacao.titulo}</h3>
              <p>{recomendacao.descricao}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default Mercado
