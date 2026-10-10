import { useEffect, useState } from 'react'
import { Hint } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { googleDisponivel, sessaoGoogle } from '@/services/google-tiles.service'
import { nasaService, type ImagemDisponivel } from '@/services/nasa.service'

type Props = {
  lat: number
  lng: number
  /** null = só a imagem de fundo (Google, quando configurado) */
  selecionada: ImagemDisponivel | null
  onSelecionar: (imagem: ImagemDisponivel | null) => void
}

const OPCAO =
  'flex shrink-0 flex-col items-center gap-0.5 rounded-lg border-2 border-transparent bg-muted p-1.5 text-[0.7rem] text-foreground'

const formatarData = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })

/**
 * Miniaturas das datas com imagem da NASA sobre o ponto, para escolher a sem
 * nuvens. Com o Google configurado, a primeira opção é a imagem dele (alta
 * resolução, sem data) e a da NASA fica opcional.
 */
export function SeletorImagem({ lat, lng, selecionada, onSelecionar }: Props) {
  const [estado, setEstado] = useState<{
    chave: string
    imagens: ImagemDisponivel[] | null
  }>({ chave: '', imagens: null })
  const chave = `${lat.toFixed(3)},${lng.toFixed(3)}`
  // configurado não basta: a chave pode estar errada ou a API desligada
  const [googleOk, setGoogleOk] = useState(googleDisponivel)

  useEffect(() => {
    if (!googleDisponivel) return
    let ativo = true
    // a mesma sessão que o mapa usa (fica em cache): não gera outra cobrança
    sessaoGoogle('satelite').catch(() => ativo && setGoogleOk(false))
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true
    nasaService.buscarImagens(lat, lng).then((imagens) => {
      if (ativo) setEstado({ chave, imagens })
    })
    return () => {
      ativo = false
    }
    // busca de novo só quando o ponto muda (~100 m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const imagens = estado.chave === chave ? estado.imagens : null

  // sem o Google, abre com a mais recente da NASA, se nada foi escolhido ainda
  useEffect(() => {
    if (!googleOk && imagens?.length && !selecionada) onSelecionar(imagens[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagens, googleOk])

  const opcaoGoogle = googleOk && (
    <button
      type="button"
      role="option"
      aria-selected={selecionada === null}
      onClick={() => onSelecionar(null)}
      title="Satélite do Google: alta resolução, sem data definida"
      className={cn(OPCAO, selecionada === null && 'border-primary bg-secondary')}
    >
      <span className="flex size-16 items-center justify-center rounded-md bg-[#1a2433] text-center text-[0.62rem] leading-tight font-semibold text-white">
        Alta
        <br />
        resolução
      </span>
      <span>Google</span>
      <small className="text-[0.62rem] text-muted-foreground">sem data</small>
    </button>
  )

  if (!imagens || imagens.length === 0) {
    const aviso = !imagens
      ? 'Buscando imagens da NASA dos últimos 40 dias...'
      : 'A NASA não tem imagens recentes deste local.'
    if (!opcaoGoogle) return <Hint>{aviso}</Hint>
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-2.5" role="listbox" aria-label="Imagem do mapa">
          {opcaoGoogle}
        </div>
        <Hint>{aviso}</Hint>
      </div>
    )
  }

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1.5"
      role="listbox"
      aria-label="Imagem do mapa"
    >
      {opcaoGoogle}
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
            className={cn(OPCAO, ativa && 'border-primary bg-secondary')}
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
