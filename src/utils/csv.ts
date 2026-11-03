/** Utilidades CSV sin dependencias externas (soporta , o ; y campos entre comillas). */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ""
  const semi = (firstLine.match(/;/g) ?? []).length
  const comma = (firstLine.match(/,/g) ?? []).length
  return semi > comma ? ";" : ","
}

export function parseCsv(raw: string): string[][] {
  const text = raw.replace(/^\uFEFF/, "")
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

function escapeField(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCsv(rows: string[][], delimiter = ","): string {
  return rows
    .map((r) => r.map((c) => escapeField(c, delimiter)).join(delimiter))
    .join("\r\n")
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
) {
  // BOM para que Excel reconozca UTF-8 (tildes y ñ)
  const blob = new Blob(["\uFEFF", content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
