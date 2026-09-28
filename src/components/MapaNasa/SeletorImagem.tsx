import { useEffect, useState } from 'react'
import { buscarImagens, type ImagemDisponivel } from '../../lib/nasa'

type Props = {
  lat: number
  lng: number
  selecionada: ImagemDisponivel | null
  onSelecionar: (imagem: ImagemDisponivel) => void
}

const formatarData = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })

/** Miniaturas das datas com imagem da NASA sobre o ponto, para escolher a sem nuvens. */
function SeletorImagem({ lat, lng, selecionada, onSelecionar }: Props) {
  const [estado, setEstado] = useState<{
    chave: string
    imagens: ImagemDisponivel[] | null
  }>({ chave: '', imagens: null })
  const chave = `${lat.toFixed(3)},${lng.toFixed(3)}`

  useEffect(() => {
    let ativo = true
    buscarImagens(lat, lng).then((imagens) => {
      if (!ativo) return
      setEstado({ chave, imagens })
      // abre com a mais recente, se nada foi escolhido ainda
      if (imagens.length && !selecionada) onSelecionar(imagens[0])
    })
    return () => {
      ativo = false
    }
    // busca de novo só quando o ponto muda (~100 m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const imagens = estado.chave === chave ? estado.imagens : null

  if (!imagens)
    return (
      <p className="seletor-imagem__status">
        Buscando imagens da NASA dos últimos 40 dias...
      </p>
    )
  if (imagens.length === 0)
    return (
      <p className="seletor-imagem__status">
        A NASA não tem imagens recentes deste local.
      </p>
    )

  return (
    <div className="seletor-imagem" role="listbox" aria-label="Data da imagem">
      {imagens.map((imagem) => {
        const ativa =
          selecionada?.data === imagem.data &&
          selecionada.camada === imagem.camada
        return (
          <button
            key={`${imagem.camada}-${imagem.data}`}
            type="button"
            role="option"
            aria-selected={ativa}
            className={`seletor-imagem__item${ativa ? ' seletor-imagem__item--ativo' : ''}`}
            onClick={() => onSelecionar(imagem)}
            title={`${imagem.satelite} — ${imagem.data}`}
          >
            <img src={imagem.miniatura} alt="" />
            <span>{formatarData(imagem.data)}</span>
            <small>{imagem.satelite}</small>
          </button>
        )
      })}
    </div>
  )
}

export default SeletorImagem
