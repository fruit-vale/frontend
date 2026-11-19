import type { Poligono } from '@/lib/geo'

/** Uma propriedade no mapa público: local, contorno e empresa (sem lotes). */
export type PropriedadePublica = {
  id: number
  nome: string
  municipio: string
  estado: string
  latitude: number
  longitude: number
  geometria: Poligono | null
  empresa: string
}
