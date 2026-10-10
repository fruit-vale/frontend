import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
  theme: Theme
  /** tema efetivamente aplicado (resolve "system") */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)
