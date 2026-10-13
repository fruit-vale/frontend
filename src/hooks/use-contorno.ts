import { useState } from 'react'
import { retanguloDeCantos, retanguloParaPoligono, type Lado, type Poligono } from '@/lib/geo'

// Desenho do contorno de um lote ou de uma propriedade: à mão no mapa, ou um
// retângulo por dois cantos medidos com GPS + a profundidade.

/** desenhar: contorno livre no mapa; gps: retângulo por 2 cantos + profundidade */
export type ModoContorno = 'desenhar' | 'gps'
export type EntidadeContorno = 'lote' | 'propriedade'

export type CoordenadaParcial = { lat: number | null; lng: number | null }
export type Cantos = { c1: CoordenadaParcial; c2: CoordenadaParcial; profundidade: string; lado: Lado }

const VAZIO: CoordenadaParcial = { lat: null, lng: null }
const CANTOS_VAZIOS: Cantos = { c1: VAZIO, c2: VAZIO, profundidade: '', lado: 'esquerda' }
const completa = (c: CoordenadaParcial) => c.lat !== null && c.lng !== null

/** Contorno dos cantos do GPS, ou null enquanto faltar algum dado. */
function calcularCantos(c: Cantos): Poligono | null {
  const profundidade = Number(c.profundidade.replace(',', '.'))
  if (!completa(c.c1) || !completa(c.c2) || !(profundidade > 0)) return null
  const retangulo = retanguloDeCantos(
    c.c1 as { lat: number; lng: number },
    c.c2 as { lat: number; lng: number },
    profundidade,
    c.lado,
  )
  return retangulo && retanguloParaPoligono(retangulo)
}

/** Estado do desenho; `mapa` vai direto para o MapaNasa. */
export function useContorno(inicial: Poligono | null) {
  const [poligono, setPoligono] = useState<Poligono | null>(inicial)
  const [modo, setModo] = useState<ModoContorno>('desenhar')
  const [cantos, setCantos] = useState<Cantos>(CANTOS_VAZIOS)

  function atualizarCantos(novos: Cantos) {
    setCantos(novos)
    const calculado = calcularCantos(novos)
    if (calculado) setPoligono(calculado)
  }

  /** No modo GPS, o clique no mapa preenche o canto que falta. */
  function clicarMapa(lat: number, lng: number) {
    if (!completa(cantos.c1)) atualizarCantos({ ...cantos, c1: { lat, lng } })
    else if (!completa(cantos.c2)) atualizarCantos({ ...cantos, c2: { lat, lng } })
  }

  const cantosIniciados =
    cantos.c1.lat !== null ||
    cantos.c1.lng !== null ||
    cantos.c2.lat !== null ||
    cantos.c2.lng !== null ||
    cantos.profundidade.trim() !== ''

  return {
    poligono,
    modo,
    setModo,
    cantos,
    atualizarCantos,
    apagar() {
      setPoligono(null)
      setCantos(CANTOS_VAZIOS)
    },
    /** começou a preencher os cantos do GPS e ainda não fechou o retângulo */
    cantosIncompletos: modo === 'gps' && !poligono && cantosIniciados,
    mapa: {
      poligono,
      onAlterarPoligono: modo === 'desenhar' ? setPoligono : undefined,
      onMoverCentro: modo === 'gps' ? clicarMapa : undefined,
    },
  }
}

