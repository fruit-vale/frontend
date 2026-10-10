import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ImagemDisponivel } from '@/services/nasa.service'
import { SeletorImagem } from './SeletorImagem'

type Props = {
  centro: { lat: number; lng: number } | null
  imagem: ImagemDisponivel | null
  onImagemChange: (imagem: ImagemDisponivel | null) => void
  referencias: boolean
  onReferenciasChange: (ativas: boolean) => void
}

/** Opção "Estradas e limites" + escolha da imagem (Google ou uma data da NASA). */
export function ImageryControls({
  centro,
  imagem,
  onImagemChange,
  referencias,
  onReferenciasChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="w-fit cursor-pointer text-sm font-normal text-muted-foreground">
        <Checkbox
          checked={referencias}
          onCheckedChange={(marcado) => onReferenciasChange(marcado)}
        />
        Estradas e limites
      </Label>
      {centro && (
        <SeletorImagem
          lat={centro.lat}
          lng={centro.lng}
          selecionada={imagem}
          onSelecionar={onImagemChange}
        />
      )}
    </div>
  )
}
