import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Cores das telas logadas:
 * - uva: roxo e dourado, com modo claro e escuro;
 * - vale: verde e amarelo da landing e do login, só no modo claro.
 */
export type Paleta = 'uva' | 'vale'

export type ThemeContextValue = {
  theme: Theme
  /** tema efetivamente aplicado (resolve "system"; a paleta "vale" é sempre clara) */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  paleta: Paleta
  setPaleta: (paleta: Paleta) => void
  /** o AppLayout avisa quando uma tela logada está aberta: só nela vale a paleta */
  setAreaLogada: (ativa: boolean) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)
