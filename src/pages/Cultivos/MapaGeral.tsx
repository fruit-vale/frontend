import { useState } from 'react'
import { ImageryControls } from '@/components/map/ImageryControls'
import MapaNasa, { type LoteNoMapa } from '@/components/map/MapaNasa'
import { Hint } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { formatarNumero } from '@/lib/format'
import { centroPoligono } from '@/lib/geo'
import type { ImagemDisponivel } from '@/services/nasa.service'
import type { Lote } from '@/types/lote'

type Props = {
  lotes: Lote[]
  /** Clique num lote do mapa. */
  onAbrir: (lote: Lote) => void
}

/** Todos os lotes de uma propriedade no mapa, como uma camada GeoJSON. */
export function MapaGeral({ lotes, onAbrir }: Props) {
  // uma propriedade por vez: fazendas distantes não cabem num mesmo zoom útil
  const propriedades = [
    ...new Map(lotes.map((l) => [l.propriedade.id, l.propriedade])).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)

  // começa pela primeira propriedade que tem algum lote desenhado
  const propriedadeId =
    escolhida ??
    lotes.find((l) => l.geometria)?.propriedade.id ??
    propriedades[0]?.id ??
    null
  const propriedade = propriedades.find((p) => p.id === propriedadeId)
  const daPropriedade = lotes.filter((l) => l.propriedade.id === propriedadeId)
  const noMapa: LoteNoMapa[] = daPropriedade
    .filter((l) => l.geometria)
    .map((l) => ({ id: l.id, nome: l.nome_identificacao, poligono: l.geometria! }))
  const semContorno = daPropriedade.filter((l) => !l.geometria)
  const areaMapeada = daPropriedade.reduce(
    (soma, l) => soma + (l.geometria ? (l.area_ha ?? 0) : 0),
    0,
  )

  const centro = noMapa.length
    ? centroPoligono(noMapa[0].poligono)
    : propriedade?.latitude != null && propriedade.longitude != null
      ? { lat: propriedade.latitude, lng: propriedade.longitude }
      : null

  function trocarPropriedade(id: number) {
    setEscolhida(id)
    setImagem(null) // as datas disponíveis mudam com o lugar
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Mapa dos lotes">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {propriedades.length > 1 ? (
          <FormField label="Propriedade" htmlFor="mapa-propriedade" className="w-64">
            <SelectField
              id="mapa-propriedade"
              value={propriedadeId === null ? '' : String(propriedadeId)}
              onValueChange={(v) => trocarPropriedade(Number(v))}
              options={propriedades.map((p) => ({ value: String(p.id), label: p.nome }))}
            />
          </FormField>
        ) : (
          <strong className="text-lg">{propriedade?.nome}</strong>
        )}
        <p className="text-sm text-muted-foreground">
          {noMapa.length} de {daPropriedade.length} lote(s) no mapa ·{' '}
          <strong className="text-foreground">{formatarNumero(areaMapeada)} ha</strong>{' '}
          mapeados
        </p>
      </div>

      {/* remonta ao trocar de propriedade, para enquadrar nos lotes dela */}
      <MapaNasa
        key={propriedadeId ?? 'nenhuma'}
        className="h-[32rem]"
        centro={centro}
        poligono={null}
        lotes={noMapa}
        onClicarLote={(id) => {
          const lote = lotes.find((l) => l.id === id)
          if (lote) onAbrir(lote)
        }}
        imagem={imagem}
        referencias={referencias}
      />

      <Hint>
        Clique num lote para ver os detalhes.
        {semContorno.length > 0 &&
          ` Ainda sem contorno (use Editar para desenhar): ${semContorno.map((l) => l.nome_identificacao).join(', ')}.`}
      </Hint>

      <ImageryControls
        centro={centro}
        imagem={imagem}
        onImagemChange={setImagem}
        referencias={referencias}
        onReferenciasChange={setReferencias}
      />
    </section>
  )
}
