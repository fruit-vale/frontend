import { useState } from 'react'

/**
 * Estado de um formulário simples (campos de texto). `field('nome')` devolve
 * `value`/`onChange` prontos para um <Input> ou <Textarea>.
 */
export function useForm<T extends Record<string, string>>(inicial: T) {
  const [values, setValues] = useState<T>(inicial)

  const set = <K extends keyof T>(nome: K, valor: T[K]) =>
    setValues((atual) => ({ ...atual, [nome]: valor }))

  const field = (nome: keyof T) => ({
    value: values[nome],
    onChange: (event: { target: { value: string } }) =>
      set(nome, event.target.value as T[keyof T]),
  })

  return { values, set, field, reset: (novo: T = inicial) => setValues(novo) }
}
