import { baixarCsv, slug } from '@/lib/download'

// Um relatório é montado uma vez e sai igual na tela, no CSV e no PDF.

export type Celula = string | number

export type SecaoRelatorio = {
  titulo: string
  /** linhas de texto antes da tabela (ex.: "Plantio: 01/06/2026") */
  texto?: string[]
  tabela?: { cabecalho: string[]; linhas: Celula[][] }
  /** quando a tabela está vazia */
  vazio?: string
}

export type Relatorio = {
  titulo: string
  /** ex.: "Período: 01/09/2026 a 30/09/2026" */
  subtitulo: string
  geradoEm: string
  secoes: SecaoRelatorio[]
}

const nomeArquivo = (r: Relatorio, ext: string) => `${slug(r.titulo).replace(/^-|-$/g, '')}.${ext}`

/** CSV de uma folha só: cada seção com o título, o texto e a tabela. */
export function baixarRelatorioCsv(r: Relatorio) {
  const linhas: Celula[][] = [[r.subtitulo], [`Gerado em ${r.geradoEm}`]]
  for (const s of r.secoes) {
    linhas.push([], [s.titulo])
    for (const t of s.texto ?? []) linhas.push([t])
    if (s.tabela?.linhas.length) linhas.push(s.tabela.cabecalho, ...s.tabela.linhas)
    else if (s.vazio) linhas.push([s.vazio])
  }
  baixarCsv(nomeArquivo(r, 'csv'), [r.titulo], linhas)
}

/**
 * PDF A4 com uma tabela por seção. O jsPDF e o autotable só são baixados
 * quando alguém gera um PDF, para não pesar no carregamento das telas.
 */
export async function baixarRelatorioPdf(r: Relatorio) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margem = 14
  const largura = doc.internal.pageSize.getWidth() - margem * 2
  const alturaPagina = doc.internal.pageSize.getHeight()
  let y = 18

  const garantirEspaco = (altura: number) => {
    if (y + altura > alturaPagina - 16) {
      doc.addPage()
      y = 18
    }
  }

  doc.setFont('helvetica', 'bold').setFontSize(16).text(r.titulo, margem, y)
  y += 7
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  doc.text(`${r.subtitulo} · gerado em ${r.geradoEm}`, margem, y)
  doc.setTextColor(0)
  y += 8

  for (const s of r.secoes) {
    garantirEspaco(18)
    doc.setFont('helvetica', 'bold').setFontSize(12).text(s.titulo, margem, y)
    y += 6
    doc.setFont('helvetica', 'normal').setFontSize(10)
    for (const t of s.texto ?? []) {
      const partes = doc.splitTextToSize(t, largura) as string[]
      garantirEspaco(partes.length * 5)
      doc.text(partes, margem, y)
      y += partes.length * 5
    }
    if (s.tabela?.linhas.length) {
      autoTable(doc, {
        startY: y + 1,
        head: [s.tabela.cabecalho],
        body: s.tabela.linhas.map((l) => l.map(String)),
        margin: { left: margem, right: margem },
        styles: { fontSize: 8.5, cellPadding: 1.6 },
        headStyles: { fillColor: [75, 36, 186] },
      })
      y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8
    } else {
      if (s.vazio) {
        doc.setTextColor(110).text(s.vazio, margem, y)
        doc.setTextColor(0)
        y += 5
      }
      y += 4
    }
  }

  // numeração no rodapé de cada página
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8).setTextColor(120)
    doc.text(`FruitVale · ${r.titulo} · página ${i} de ${paginas}`, margem, alturaPagina - 8)
  }
  doc.save(nomeArquivo(r, 'pdf'))
}
