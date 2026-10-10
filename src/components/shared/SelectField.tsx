import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string }

type Props = {
  /** '' = nada selecionado (mostra o placeholder) */
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}

/**
 * Select do shadcn com a API de um <select> nativo: valor em texto, opções
 * `{ value, label }` e '' para "sem seleção".
 */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: Props) {
  return (
    <Select
      items={options}
      value={value === '' ? null : value}
      onValueChange={(novo) => onValueChange(novo ?? '')}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn('w-full', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((opcao) => (
          <SelectItem key={opcao.value} value={opcao.value}>
            {opcao.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
