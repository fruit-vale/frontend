import { useState } from 'react'
import MapaNasa from '../../components/MapaNasa/MapaNasa'
import SeletorImagem from '../../components/MapaNasa/SeletorImagem'
import { poligonoParaRetangulo } from '../../lib/geo'
import type { ImagemDisponivel } from '../../lib/nasa'
import type { Lote } from './tipos'

/** Visualização do lote sobre a imagem da NASA, com escolha da data. */
function MapaLote({ lote }: { lote: Lote }) {
  const [imagem, setImagem] = useState<ImagemDisponivel | null>(null)
  const [referencias, setReferencias] = useState(true)

  const retangulo = lote.geometria ? poligonoParaRetangulo(lote.geometria) : null
  const centro =
    retangulo ??
    (lote.propriedade.latitude != null && lote.propriedade.longitude != null
      ? { lat: lote.propriedade.latitude, lng: lote.propriedade.longitude }
      : null)

  return (
    <div className="lote-mapa lote-mapa--leitura">
      {!lote.geometria && (
        <p className="form-hint">
          Este lote ainda não foi marcado no mapa. Edite o lote para desenhar o
          retângulo.
        </p>
      )}

      <MapaNasa
        centro={centro}
        poligono={lote.geometria}
        imagem={imagem}
        referencias={referencias}
      />

      {retangulo && (
        <p className="lote-mapa__area">
          {retangulo.largura} m × {retangulo.comprimento} m · rotação{' '}
          {retangulo.rotacao}° ·{' '}
          <strong>{lote.area_ha?.toLocaleString('pt-BR')} ha</strong>
        </p>
      )}

      <div className="lote-mapa__imagens">
        <label className="lote-mapa__referencias">
          <input
            type="checkbox"
            checked={referencias}
            onChange={(event) => setReferencias(event.target.checked)}
          />
          Estradas e limites
        </label>
        {centro && (
          <SeletorImagem
            lat={centro.lat}
            lng={centro.lng}
            selecionada={imagem}
            onSelecionar={setImagem}
          />
        )}
      </div>
    </div>
  )
}

export default MapaLote
