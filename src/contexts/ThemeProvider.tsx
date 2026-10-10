import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme-context'

const STORAGE_KEY = 'fruitvale:theme'
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

const sistemaEscuro = () => window.matchMedia(MEDIA).matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(lerTema)
  const [escuroNoSistema, setEscuroNoSistema] = useState(sistemaEscuro)

  // acompanha a preferência do sistema enquanto o tema for "system"
  useEffect(() => {
    const media = window.matchMedia(MEDIA)
    const aoMudar = () => setEscuroNoSistema(media.matches)
    media.addEventListener('change', aoMudar)
    return () => media.removeEventListener('change', aoMudar)
  }, [])

  const resolvedTheme =
    theme === 'system' ? (escuroNoSistema ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = useCallback((novo: Theme) => {
    setThemeState(novo)
    try {
      localStorage.setItem(STORAGE_KEY, novo)
    } catch {
      // vale só nesta visita
    }
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
