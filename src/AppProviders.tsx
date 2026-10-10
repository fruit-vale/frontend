import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ConfirmProvider } from '@/contexts/ConfirmProvider'
import { ThemeProvider } from '@/contexts/ThemeProvider'

/** Todos os providers globais, na ordem em que dependem uns dos outros. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <ConfirmProvider>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </ConfirmProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
