import L from 'leaflet'

// O Leaflet-Geoman procura o Leaflet no global `L`: este módulo precisa ser
// importado antes dele.
declare global {
  interface Window {
    L: typeof L
  }
}
window.L = L
