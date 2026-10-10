/** Baixa um conteúdo de texto como arquivo, sem passar pelo servidor. */
export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/plain') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}

/** CSV no padrão do Excel em português: ";" como separador e vírgula decimal. */
export function baixarCsv(
  nome: string,
  cabecalho: string[],
  linhas: (string | number)[][],
) {
  const celula = (c: string | number) => {
    const texto = typeof c === 'number' ? String(c).replace('.', ',') : c
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const csv = [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n')
  // BOM: o Excel reconhece os acentos como UTF-8
  baixarArquivo(nome, '﻿' + csv, 'text/csv')
}

/** Copia para a área de transferência; false se o navegador não permitir. */
export async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

/** "Temperatura — últimos 7 dias" → "temperatura-ultimos-7-dias". */
export const slug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
