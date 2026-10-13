import type { ReactNode } from 'react'
import { CoordinateField } from '@/components/shared/CoordinateField'
import { Hint } from '@/components/shared/EmptyState'
import { FormField, FormGrid } from '@/components/shared/FormField'
import { SelectField } from '@/components/shared/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatarHectares, formatarMetros } from '@/lib/format'
import { areaPoligonoHa, perimetroM, type Lado } from '@/lib/geo'
import type { EntidadeContorno, ModoContorno, useContorno } from '@/hooks/use-contorno'

// Campos do desenho do contorno (o estado fica em useContorno).

const LADOS = [
  { value: 'esquerda', label: 'À esquerda (olhando do canto 1 para o 2)' },
  { value: 'direita', label: 'À direita (olhando do canto 1 para o 2)' },
]

const TEXTOS: Record<EntidadeContorno, { de: string; o: string; alvo: string; profundidadeMax: number }> = {
  lote: { de: 'do lote', o: 'o lote', alvo: 'o talhão', profundidadeMax: 20_000 },
  propriedade: { de: 'da propriedade', o: 'a propriedade', alvo: 'a fazenda', profundidadeMax: 100_000 },
}

type Props = {
  editor: ReturnType<typeof useContorno>
  entidade: EntidadeContorno
  /** texto da legenda do quadro (ex.: "Localização do lote") */
  legenda: string
  /** aviso em vermelho sob o contorno (ex.: o lote passa da propriedade) */
  erro?: string
  /** o que aparece enquanto não há contorno (ex.: o campo de área manual) */
  semContorno?: ReactNode
}

export function ContornoCampos({ editor, entidade, legenda, erro, semContorno }: Props) {
  const t = TEXTOS[entidade]
  const { poligono, modo, cantos, atualizarCantos } = editor

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">{legenda}</legend>

      <Tabs value={modo} onValueChange={(v) => editor.setModo(v as ModoContorno)}>
        <TabsList aria-label={`Como delimitar ${t.o}`}>
          <TabsTrigger value="desenhar">Desenhar no mapa</TabsTrigger>
          <TabsTrigger value="gps">Retângulo pelo GPS</TabsTrigger>
        </TabsList>
      </Tabs>

      {modo === 'desenhar' ? (
        <ol className="ml-4 list-decimal space-y-0.5 text-xs text-muted-foreground">
          {poligono ? (
            <>
              <li>Arraste os pontos brancos para ajustar os cantos.</li>
              <li>Para criar um canto, arraste o ponto do meio de um lado.</li>
              <li>Para apagar um canto, clique nele com o botão direito.</li>
              <li>Para mover {t.o} inteir{entidade === 'lote' ? 'o' : 'a'}, arraste a área amarela.</li>
            </>
          ) : (
            <>
              <li>Aproxime o mapa até ver {t.alvo}.</li>
              <li>Clique em cada canto {t.de}, na ordem do contorno.</li>
              <li>Para fechar, clique de novo no primeiro ponto.</li>
            </>
          )}
        </ol>
      ) : (
        <div className="flex flex-col gap-3">
          <Hint>
            Fique num canto {t.de} e anote a coordenada do GPS (canto 1). Ande ao longo de um dos
            lados até o canto seguinte (canto 2). Depois informe a profundidade e para que lado ela
            fica. Você também pode clicar no mapa para marcar os cantos.
          </Hint>
          <CoordinateField
            idPrefix={`${entidade}-canto1`}
            rotuloLat="Canto 1 — latitude"
            rotuloLng="Canto 1 — longitude"
            lat={cantos.c1.lat}
            lng={cantos.c1.lng}
            onChange={(lat, lng) => atualizarCantos({ ...cantos, c1: { lat, lng } })}
          />
          <CoordinateField
            idPrefix={`${entidade}-canto2`}
            rotuloLat="Canto 2 — latitude"
            rotuloLng="Canto 2 — longitude"
            lat={cantos.c2.lat}
            lng={cantos.c2.lng}
            onChange={(lat, lng) => atualizarCantos({ ...cantos, c2: { lat, lng } })}
            dica={false}
          />
          <FormGrid>
            <FormField label="Profundidade (m)" htmlFor={`${entidade}-profundidade`}>
              <Input
                id={`${entidade}-profundidade`}
                type="number"
                min={1}
                max={t.profundidadeMax}
                step="0.1"
                value={cantos.profundidade}
                onChange={(e) => atualizarCantos({ ...cantos, profundidade: e.target.value })}
              />
            </FormField>
            <FormField label="Lado da profundidade" htmlFor={`${entidade}-lado`}>
              <SelectField
                id={`${entidade}-lado`}
                value={cantos.lado}
                onValueChange={(v) => atualizarCantos({ ...cantos, lado: v as Lado })}
                options={LADOS}
              />
            </FormField>
          </FormGrid>
          {poligono && (
            <Hint>
              Para ajustar os cantos à mão, volte para <strong>Desenhar no mapa</strong>.
            </Hint>
          )}
        </div>
      )}

      {poligono ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {poligono.coordinates[0].length - 1} cantos · Perímetro:{' '}
            <strong className="text-foreground">{formatarMetros(perimetroM(poligono))}</strong> · Área:{' '}
            <strong className="text-foreground">{formatarHectares(areaPoligonoHa(poligono))}</strong>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={editor.apagar}>
            Apagar contorno
          </Button>
        </div>
      ) : (
        semContorno
      )}

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}
    </fieldset>
  )
}
