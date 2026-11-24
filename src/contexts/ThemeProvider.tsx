import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type Paleta, type Theme } from './theme-context'

const STORAGE_KEY = 'fruitvale:theme'
const PALETA_KEY = 'fruitvale:paleta'
const MEDIA = '(prefers-color-scheme: dark)'

function lerTema(): Theme {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    if (salvo === 'light' || salvo === 'dark' || salvo === 'system') return salvo
  } catch {
    // armazenamento indisponível: usa o padrão
  }
  return 'system'
}

function lerPaleta(): Paleta {
  try {
    if (localStorage.getItem(PALETA_KEY) === 'vale') return 'vale'
  } catch {
    // armazenamento indisponível: usa o padrão
  }
  return 'uva'
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    // vale só nesta visita
  }
}

const sistemaEscuro = () => window.matchMedia(MEDIA).matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(lerTema)
  const [paleta, setPaletaState] = useState<Paleta>(lerPaleta)
  const [areaLogada, setAreaLogada] = useState(false)
  const [escuroNoSistema, setEscuroNoSistema] = useState(sistemaEscuro)

  // acompanha a preferência do sistema enquanto o tema for "system"
  useEffect(() => {
    const media = window.matchMedia(MEDIA)
    const aoMudar = () => setEscuroNoSistema(media.matches)
    media.addEventListener('change', aoMudar)
    return () => media.removeEventListener('change', aoMudar)
  }, [])

  // a paleta só vale nas telas logadas; landing, login e páginas públicas não mudam
  const paletaAplicada: Paleta = areaLogada ? paleta : 'uva'
  const resolvedTheme =
    paletaAplicada === 'vale'
      ? 'light'
      : theme === 'system'
        ? escuroNoSistema
          ? 'dark'
          : 'light'
        : theme

  // antes da pintura: a tela logada já abre com as cores certas, sem piscar
  useLayoutEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dark', resolvedTheme === 'dark')
    if (paletaAplicada === 'uva') delete html.dataset.paleta
    else html.dataset.paleta = paletaAplicada
  }, [resolvedTheme, paletaAplicada])

  const setTheme = useCallback((novo: Theme) => {
    setThemeState(novo)
    gravar(STORAGE_KEY, novo)
  }, [])

  const setPaleta = useCallback((nova: Paleta) => {
    setPaletaState(nova)
    gravar(PALETA_KEY, nova)
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, paleta, setPaleta, setAreaLogada }),
    [theme, resolvedTheme, setTheme, paleta, setPaleta],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
