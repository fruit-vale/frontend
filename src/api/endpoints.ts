/**
 * Todos os caminhos da API em um só lugar. Os services usam estas funções;
 * nenhum componente monta URL à mão.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  empresas: {
    base: '/empresas',
  },
  usuarios: {
    base: '/usuarios',
    porId: (id: number) => `/usuarios/${id}`,
  },
  propriedades: {
    base: '/propriedades',
    porId: (id: number) => `/propriedades/${id}`,
  },
  culturas: {
    base: '/culturas',
    porId: (id: number) => `/culturas/${id}`,
  },
  previsao: '/previsao',
  lotes: {
    base: '/lotes',
    porId: (id: number) => `/lotes/${id}`,
    safras: (loteId: number) => `/lotes/${loteId}/safras`,
    safraPorId: (loteId: number, safraId: number) =>
      `/lotes/${loteId}/safras/${safraId}`,
    colheita: (loteId: number) => `/lotes/${loteId}/safras/colheita`,
  },
  sensores: {
    base: '/sensores',
    porId: (id: number) => `/sensores/${id}`,
    medidas: (id: number) => `/sensores/${id}/medidas`,
    senha: (id: number) => `/sensores/${id}/senha`,
    lote: (id: number) => `/sensores/${id}/lote`,
  },
  painel: {
    base: '/painel',
    serie: '/painel/serie',
    leituras: '/painel/leituras',
  },
} as const

/** Serviços públicos de terceiros (sem autenticação nem CORS especial). */
export const EXTERNAL = {
  ibge: {
    base: 'https://servicodados.ibge.gov.br/api/v1/localidades',
    estados: '/estados?orderBy=nome',
    municipios: (uf: string) => `/estados/${uf}/municipios?orderBy=nome`,
    malhas: 'https://servicodados.ibge.gov.br/api/v3/malhas',
  },
  nasaGibs: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
} as const
