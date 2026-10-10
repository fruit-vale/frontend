import { useState } from 'react'
import { ImageryControls } from '@/components/map/ImageryControls'
import MapaNasa, { type LoteNoMapa } from '@/components/map/MapaNasa'
import { Hint } from '@/components/shared/EmptyState'
import { formatarHectares } from '@/lib/format'
import { areaPoligonoHa, centroPoligono, perimetroM } from '@/lib/geo'
import type { ImagemDisponivel } from '@/services/nasa.service'
import type { Lote } from '@/types/lote'

/** Visualização do lote sobre a imagem da NASA, com escolha da data. */
export function MapaLote({ lote, lotes }: { lote: Lote; lotes: Lote[] }) {
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)

  const centro = lote.geometria
    ? centroPoligono(lote.geometria)
    : lote.propriedade.latitude != null && lote.propriedade.longitude != null
      ? { lat: lote.propriedade.latitude, lng: lote.propriedade.longitude }
      : null
  const vizinhos: LoteNoMapa[] = lotes
    .filter((l) => l.propriedade.id === lote.propriedade.id && l.id !== lote.id && l.geometria)
    .map((l) => ({ id: l.id, nome: l.nome_identificacao, poligono: l.geometria! }))

  return (
    <div className="flex flex-col gap-3">
      {!lote.geometria && (
        <Hint>
          Este lote ainda não foi marcado no mapa. Edite o lote para desenhar o
          contorno.
        </Hint>
      )}

      <MapaNasa
        className="h-[28rem]"
        centro={centro}
        poligono={lote.geometria}
        lotes={vizinhos}
        imagem={imagem}
        referencias={referencias}
      />

      {lote.geometria && (
        <p className="text-sm text-muted-foreground">
          {lote.geometria.coordinates[0].length - 1} cantos · perímetro{' '}
          {Math.round(perimetroM(lote.geometria)).toLocaleString('pt-BR')} m ·{' '}
          <strong className="text-foreground">
            {formatarHectares(lote.area_ha ?? areaPoligonoHa(lote.geometria))}
          </strong>
        </p>
      )}

      <ImageryControls
        centro={centro}
        imagem={imagem}
        onImagemChange={setImagem}
        referencias={referencias}
        onReferenciasChange={setReferencias}
      />
    </div>
  )
}
