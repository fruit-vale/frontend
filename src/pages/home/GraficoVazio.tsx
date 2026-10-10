import type { ReactNode } from 'react'
import { ActivityIcon } from 'lucide-react'

// Curva de exemplo, só para o painel ter forma antes da primeira leitura.
const CURVA = 'M0,150 C60,140 90,90 150,100 S240,170 300,120 S400,40 460,70 S560,130 600,90'
const LINHAS = [40, 90, 140, 190]

/**
 * Gráfico "fantasma": mostra o formato do painel quando ainda não há leituras,
 * com a ação para chegar lá. Não representa dados reais.
 */
export function GraficoVazio({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl border border-dashed bg-muted/30">
      <svg
        viewBox="0 0 600 230"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full opacity-60"
        aria-hidden="true"
      >
        {LINHAS.map((y) => (
          <line key={y} x1="0" x2="600" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
        ))}
        <path
          d={`${CURVA} L600,230 L0,230 Z`}
          className="fill-primary/10"
          stroke="none"
        />
        <path
          d={CURVA}
          fill="none"
          className="stroke-primary/40"
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/70 p-6 text-center backdrop-blur-[1px]">
        <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ActivityIcon className="size-5" aria-hidden="true" />
        </span>
        {children}
      </div>
    </div>
  )
}
