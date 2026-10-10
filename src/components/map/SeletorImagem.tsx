import { useEffect, useState } from 'react'
import { Hint } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { nasaService, type ImagemDisponivel } from '@/services/nasa.service'

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
export function SeletorImagem({ lat, lng, selecionada, onSelecionar }: Props) {
  const [estado, setEstado] = useState<{
    chave: string
    imagens: ImagemDisponivel[] | null
  }>({ chave: '', imagens: null })
  const chave = `${lat.toFixed(3)},${lng.toFixed(3)}`

  useEffect(() => {
    let ativo = true
    nasaService.buscarImagens(lat, lng).then((imagens) => {
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
    return <Hint>Buscando imagens da NASA dos últimos 40 dias...</Hint>
  if (imagens.length === 0)
    return <Hint>A NASA não tem imagens recentes deste local.</Hint>

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1.5"
      role="listbox"
      aria-label="Data da imagem"
    >
      {imagens.map((imagem) => {
        const ativa =
          selecionada?.data === imagem.data && selecionada.camada === imagem.camada
        return (
          <button
            key={`${imagem.camada}-${imagem.data}`}
            type="button"
            role="option"
            aria-selected={ativa}
            onClick={() => onSelecionar(imagem)}
            title={`${imagem.satelite} — ${imagem.data}`}
            className={cn(
              'flex shrink-0 flex-col items-center gap-0.5 rounded-lg border-2 border-transparent bg-muted p-1.5 text-[0.7rem] text-foreground',
              ativa && 'border-primary bg-secondary',
            )}
          >
            <img
              src={imagem.miniatura}
              alt=""
              className="size-16 rounded-md object-cover"
            />
            <span>{formatarData(imagem.data)}</span>
            <small className="text-[0.62rem] text-muted-foreground">
              {imagem.satelite}
            </small>
          </button>
        )
      })}
    </div>
  )
}
