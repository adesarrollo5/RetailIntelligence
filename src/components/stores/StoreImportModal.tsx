import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileWarning,
  Upload,
  X,
  XCircle,
} from "lucide-react"
import type { Client } from "../../types"
import { departments, municipalities } from "../../data/colombiaGeo"
import {
  emptyDraft,
  getCategoryOptions,
  getParentOptions,
  scheduleDayOptions,
  storeFormats,
  storeFromDraft,
  storeStatuses,
  validateDraft,
  type StoreDraft,
  type StoreRecord,
} from "../../data/storesData"
import { buildCsv, downloadTextFile, parseCsv } from "../../utils/csv"
import { formatNumberCO } from "../../utils/formatters"

type Props = {
  client: Client
  stores: StoreRecord[]
  allowedParents: string[]
  onConfirm: (stores: StoreRecord[]) => void
  onClose: () => void
}

const COLUMNS: Array<{
  key: string
  label: string
  example: string
  help: string
}> = [
  {
    key: "codigo",
    label: "codigo",
    example: "BOG-310",
    help: "Único. Mayúsculas y guion.",
  },
  {
    key: "nombre",
    label: "nombre",
    example: "Tennis · Local 310",
    help: "3 a 80 caracteres.",
  },
  {
    key: "centro_comercial_o_region",
    label: "centro_comercial_o_region",
    example: "",
    help: "Debe coincidir con las opciones del cliente.",
  },
  {
    key: "zona_piso",
    label: "zona_piso",
    example: "Zona Moda · Piso 3",
    help: "Zona o piso de la ubicación.",
  },
  {
    key: "formato",
    label: "formato",
    example: "Centro comercial",
    help: "Centro comercial, Calle u Outlet.",
  },
  {
    key: "categoria",
    label: "categoria",
    example: "",
    help: "Categoría vigente del cliente.",
  },
  { key: "m2", label: "m2", example: "84,5", help: "Número mayor que 0." },
  {
    key: "horario",
    label: "horario",
    example: "Lun-Dom 10:00-21:00",
    help: "Días + apertura-cierre (24 h).",
  },
  {
    key: "direccion",
    label: "direccion",
    example: "Av. Calle 80 #68-45, Local 310",
    help: "Mínimo 5 caracteres.",
  },
  {
    key: "latitud",
    label: "latitud",
    example: "4,7112",
    help: "Entre -4,3 y 13,5.",
  },
  {
    key: "longitud",
    label: "longitud",
    example: "-74,0721",
    help: "Entre -82 y -66,8.",
  },
  {
    key: "dane_departamento",
    label: "dane_departamento",
    example: "11",
    help: "2 dígitos, p. ej. 05 Antioquia.",
  },
  {
    key: "dane_municipio",
    label: "dane_municipio",
    example: "11001",
    help: "5 dígitos, del departamento indicado.",
  },
  {
    key: "estado",
    label: "estado",
    example: "En apertura",
    help: "Activa, En apertura, Cerrada temporalmente o Inactiva.",
  },
]

export type ImportRow = {
  line: number
  draft: StoreDraft
  errors: string[]
  warnings: string[]
  store?: StoreRecord
}

const norm = (s: string) =>
  s.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")

function matchOption(value: string, options: string[]): string {
  const hit = options.find((o) => norm(o) === norm(value))
  return hit ?? value.trim()
}

function parseSchedule(
  value: string,
): Pick<StoreDraft, "scheduleDays" | "open" | "close"> | null {
  const m = value
    .trim()
    .match(
      /^(Lun\s*[-–]\s*(?:Dom|Sáb|Sab|Vie))\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/i,
    )
  if (!m) return null
  const days = m[1].replace(/\s+/g, "").replace("-", "–").replace("Sab", "Sáb")
  const days2 = scheduleDayOptions.find((d) => norm(d) === norm(days)) ?? days
  const fix = (t: string) => (t.length === 4 ? `0${t}` : t)
  return { scheduleDays: days2, open: fix(m[2]), close: fix(m[3]) }
}

export function evaluateImport(
  text: string,
  client: Client,
  existing: StoreRecord[],
  allowedParents: string[],
): { rows: ImportRow[]; fatal?: string } {
  const table = parseCsv(text)
  if (table.length === 0) return { rows: [], fatal: "El archivo está vacío." }
  const header = table[0].map((h) => norm(h).replace(/\s/g, "_"))
  const missing = COLUMNS.filter((c) => !header.includes(c.key)).map(
    (c) => c.key,
  )
  if (missing.length > 0) {
    return {
      rows: [],
      fatal: `Faltan columnas obligatorias: ${missing.join(", ")}. Descargue la plantilla y conserve los encabezados.`,
    }
  }
  const idx = (key: string) => header.indexOf(key)
  const parentOptions = getParentOptions(client)
  const categoryOptions = getCategoryOptions(client)
  const rows: ImportRow[] = []
  const running: StoreRecord[] = [...existing]
  const seenCodes = new Map<string, number>()
  const seenNames = new Map<string, number>()
  let capacity = Math.max(0, client.maxLocations - existing.length)

  table.slice(1).forEach((cells, i) => {
    const line = i + 2
    const get = (key: string) => (cells[idx(key)] ?? "").trim()
    const schedule = parseSchedule(get("horario"))
    const deptRaw = get("dane_departamento")
    const muniRaw = get("dane_municipio")
    const draft: StoreDraft = {
      ...emptyDraft(),
      code: get("codigo").toUpperCase(),
      name: get("nombre"),
      parent: matchOption(get("centro_comercial_o_region"), parentOptions),
      zone: get("zona_piso"),
      format: matchOption(get("formato"), storeFormats),
      category: matchOption(get("categoria"), categoryOptions),
      sqm: get("m2"),
      scheduleDays: schedule?.scheduleDays ?? "",
      open: schedule?.open ?? "",
      close: schedule?.close ?? "",
      address: get("direccion"),
      lat: get("latitud"),
      lng: get("longitud"),
      // Excel suele eliminar los ceros a la izquierda de los códigos DANE
      deptCode: /^\d+$/.test(deptRaw) ? deptRaw.padStart(2, "0") : deptRaw,
      muniCode: /^\d+$/.test(muniRaw) ? muniRaw.padStart(5, "0") : muniRaw,
      status: matchOption(get("estado"), storeStatuses),
    }
    const { errors: fieldErrors, warnings } = validateDraft(draft, {
      existing: running,
      parentOptions,
      categoryOptions,
    })
    const errors: string[] = Object.entries(fieldErrors).map(([k, v]) => {
      const labels: Record<string, string> = {
        scheduleDays: "horario",
        open: "horario",
        close: "horario",
        deptCode: "dane_departamento",
        muniCode: "dane_municipio",
        lat: "latitud",
        lng: "longitud",
        sqm: "m2",
        parent: "centro_comercial_o_region",
        zone: "zona_piso",
        address: "direccion",
        category: "categoria",
      }
      return `${labels[k] ?? k}: ${v}`
    })
    if (!schedule) {
      const msg = "horario: use el formato «Lun-Dom 10:00-21:00»."
      if (!errors.some((e) => e.startsWith("horario"))) errors.push(msg)
    }
    if (
      draft.code &&
      seenCodes.has(draft.code) &&
      !errors.some((e) => e.startsWith("code") || e.startsWith("codigo"))
    ) {
      errors.push(
        `codigo: duplicado dentro del archivo (fila ${seenCodes.get(draft.code)}).`,
      )
    }
    if (
      draft.name &&
      seenNames.has(draft.name.toLowerCase()) &&
      !errors.some((e) => e.startsWith("name") || e.startsWith("nombre"))
    ) {
      errors.push(
        `nombre: duplicado dentro del archivo (fila ${seenNames.get(draft.name.toLowerCase())}).`,
      )
    }
    // normaliza etiquetas de campos del formulario a columnas CSV
    const cleaned = errors.map((e) =>
      e.replace(/^code:/, "codigo:")
        .replace(/^name:/, "nombre:")
        .replace(/^format:/, "formato:")
        .replace(/^status:/, "estado:"),
    )
    if (draft.code) seenCodes.set(draft.code, seenCodes.get(draft.code) ?? line)
    if (draft.name)
      seenNames.set(
        draft.name.toLowerCase(),
        seenNames.get(draft.name.toLowerCase()) ?? line,
      )

    if (
      draft.parent &&
      !allowedParents.includes(draft.parent) &&
      parentOptions.includes(draft.parent)
    ) {
      cleaned.push(
        `centro_comercial_o_region: no tiene alcance para crear en «${draft.parent}».`,
      )
    }

    let store: StoreRecord | undefined
    if (cleaned.length === 0) {
      if (capacity <= 0) {
        cleaned.push(
          `Excede el límite del plan (${client.maxLocations} ${client.terminology.storePlural.toLowerCase()}).`,
        )
      } else {
        capacity -= 1
        store = storeFromDraft(draft, client)
        running.push(store)
      }
    }
    rows.push({ line, draft, errors: cleaned, warnings, store })
  })
  return { rows }
}

export function buildTemplateCsv(client: Client): string {
  const parent = getParentOptions(client)
  const cat = getCategoryOptions(client)
  const rows: string[][] = [COLUMNS.map((c) => c.key)]
  const ex = (
    parentIdx: number,
    code: string,
    name: string,
    muni: string,
    dept: string,
    lat: string,
    lng: string,
  ) =>
    COLUMNS.map((c) => {
      switch (c.key) {
        case "codigo":
          return code
        case "nombre":
          return name
        case "centro_comercial_o_region":
          return parent[parentIdx] ?? parent[0]
        case "categoria":
          return cat[parentIdx] ?? cat[0]
        case "dane_municipio":
          return muni
        case "dane_departamento":
          return dept
        case "latitud":
          return lat
        case "longitud":
          return lng
        default:
          return c.example
      }
    })
  rows.push(
    ex(0, "BOG-310", "Tennis · Local 310", "11001", "11", "4,7112", "-74,0721"),
  )
  rows.push(
    ex(1, "MED-415", "Koaj · Local 415", "05001", "05", "6,2442", "-75,5812"),
  )
  return buildCsv(rows)
}

function buildSampleWithErrors(client: Client): string {
  const parents = getParentOptions(client)
  const cats = getCategoryOptions(client)
  const base = (over: Record<string, string>) =>
    COLUMNS.map((c) => over[c.key] ?? c.example)
  const common = {
    centro_comercial_o_region: parents[0],
    categoria: cats[0],
    formato: "Centro comercial",
    horario: "Lun-Dom 10:00-21:00",
    estado: "En apertura",
    zona_piso: "Zona Moda · Piso 1",
  }
  const rows: string[][] = [COLUMNS.map((c) => c.key)]
  rows.push(
    base({
      ...common,
      codigo: "IMP-101",
      nombre: "Importada Uno · Local 101",
      m2: "62",
      direccion: "Calle 100 #15-20, Local 101",
      latitud: "4,6856",
      longitud: "-74,0451",
      dane_departamento: "11",
      dane_municipio: "11001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-102",
      nombre: "Importada Dos · Local 102",
      m2: "48,5",
      direccion: "Calle 100 #15-20, Local 102",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "5",
      dane_municipio: "5001",
      centro_comercial_o_region: parents[1] ?? parents[0],
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-103",
      nombre: "Importada Tres · Local 103",
      m2: "abc",
      direccion: "Calle 100 #15-20, Local 103",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "11",
      dane_municipio: "11001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-104",
      nombre: "Importada Cuatro · Local 104",
      m2: "55",
      formato: "Quiosco",
      direccion: "Calle 100 #15-20, Local 104",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "11",
      dane_municipio: "11001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-105",
      nombre: "Importada Cinco · Local 105",
      m2: "70",
      direccion: "Calle 100 #15-20, Local 105",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "76",
      dane_municipio: "05001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-101",
      nombre: "Importada Seis · Local 106",
      m2: "40",
      direccion: "Calle 100 #15-20, Local 106",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "11",
      dane_municipio: "11001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-107",
      nombre: "Importada Siete · Local 107",
      m2: "90",
      direccion: "Calle 100 #15-20, Local 107",
      latitud: "25,0",
      longitud: "-74,0455",
      dane_departamento: "11",
      dane_municipio: "11001",
    }),
  )
  rows.push(
    base({
      ...common,
      codigo: "IMP-108",
      nombre: "Importada Ocho · Local 108",
      m2: "75",
      direccion: "Calle 100 #15-20, Local 108",
      latitud: "4,6860",
      longitud: "-74,0455",
      dane_departamento: "11",
      dane_municipio: "11001",
      horario: "10 a 9",
    }),
  )
  return buildCsv(rows, ";")
}

export function StoreImportModal({
  client,
  stores,
  allowedParents,
  onConfirm,
  onClose,
}: Props) {
  const terms = client.terminology
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fileName, setFileName] = useState("")
  const [fileText, setFileText] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [readError, setReadError] = useState("")
  const [onlyErrors, setOnlyErrors] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const result = useMemo(
    () =>
      fileText
        ? evaluateImport(fileText, client, stores, allowedParents)
        : { rows: [] as ImportRow[], fatal: undefined as string | undefined },
    [fileText, client, stores, allowedParents],
  )

  const valid = result.rows.filter((r) => r.store)
  const invalid = result.rows.filter((r) => !r.store)
  const withWarnings = valid.filter((r) => r.warnings.length > 0)
  const shown = onlyErrors ? invalid : result.rows

  const readFile = (file: File) => {
    setReadError("")
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setReadError("Formato no admitido. Suba un archivo .csv (UTF-8).")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setReadError("El archivo supera los 2 MB permitidos.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFileName(file.name)
      setFileText(String(reader.result ?? ""))
    }
    reader.onerror = () => setReadError("No se pudo leer el archivo.")
    reader.readAsText(file, "utf-8")
  }

  const stepper = (
    <ol className="flex items-center gap-2 text-xs">
      {[
        "Descargar plantilla",
        "Subir archivo",
        "Previsualizar y confirmar",
      ].map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const done = step > n
        const active = step === n
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span
              className={`hidden font-semibold sm:inline ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {label}
            </span>
            {i < 2 && <span className="mx-1 h-px w-6 bg-slate-200" />}
          </li>
        )
      })}
    </ol>
  )

  return (
    <div
      className="fixed inset-0 z-[66] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Importación masiva"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Importación masiva de {terms.storePlural.toLowerCase()}
            </h2>
            <div className="mt-3">{stepper}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand-soft)] p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 size-6 text-[var(--brand)]" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Plantilla CSV de {terms.storePlural.toLowerCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Incluye los encabezados exactos y dos filas de ejemplo.
                      Admite separador coma o punto y coma (Excel).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    downloadTextFile(
                      `plantilla_${terms.storePlural.toLowerCase()}.csv`,
                      buildTemplateCsv(client),
                    )
                  }
                >
                  <Download className="size-4" /> Descargar plantilla
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Columna</th>
                      <th className="px-3 py-2">Regla</th>
                      <th className="hidden px-3 py-2 sm:table-cell">
                        Ejemplo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COLUMNS.map((c) => (
                      <tr key={c.key}>
                        <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-800">
                          {c.label}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {c.key === "centro_comercial_o_region"
                            ? `Uno de: ${getParentOptions(client).join(", ")}`
                            : c.key === "categoria"
                              ? `Una de: ${getCategoryOptions(client).join(", ")}`
                              : c.help}
                        </td>
                        <td className="hidden px-3 py-2 text-slate-500 sm:table-cell">
                          {c.key === "centro_comercial_o_region"
                            ? getParentOptions(client)[0]
                            : c.key === "categoria"
                              ? getCategoryOptions(client)[0]
                              : c.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <p>
                  Capacidad del plan: {formatNumberCO(stores.length)} de{" "}
                  {formatNumberCO(client.maxLocations)}{" "}
                  {terms.storePlural.toLowerCase()} en uso.
                </p>
                <button
                  type="button"
                  className="font-bold text-[var(--brand)] hover:underline"
                  onClick={() => {
                    const rows: string[][] = [
                      [
                        "codigo_dane_departamento",
                        "departamento",
                        "codigo_dane_municipio",
                        "municipio",
                      ],
                    ]
                    municipalities.forEach((m) => {
                      const d = departments.find((x) => x.code === m.deptCode)
                      rows.push([m.deptCode, d?.name ?? "", m.code, m.name])
                    })
                    downloadTextFile("codigos_dane.csv", buildCsv(rows))
                  }}
                >
                  Descargar catálogo de códigos DANE
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) readFile(file)
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
                  dragOver
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <Upload className="size-9 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-800">
                  Arrastre su archivo CSV aquí
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  UTF-8, máximo 2 MB. Se validará antes de guardar cualquier
                  dato.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.txt,text/csv"
                  className="sr-only"
                  aria-label="Seleccionar archivo CSV"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) readFile(f)
                    e.target.value = ""
                  }}
                />
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="size-4" /> Seleccionar archivo
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setReadError("")
                      setFileName("ejemplo_con_errores.csv")
                      setFileText(buildSampleWithErrors(client))
                    }}
                  >
                    <FileWarning className="size-4" /> Usar archivo de ejemplo
                  </button>
                </div>
              </div>
              {readError && (
                <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  <XCircle className="size-4" /> {readError}
                </p>
              )}
              {fileName && !readError && (
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                    result.fatal
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {result.fatal ? (
                      <XCircle className="size-4" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    {fileName}
                    {!result.fatal &&
                      ` · ${formatNumberCO(result.rows.length)} filas detectadas`}
                  </span>
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => {
                      setFileName("")
                      setFileText("")
                    }}
                  >
                    Quitar
                  </button>
                </div>
              )}
              {result.fatal && (
                <p className="rounded-xl border border-rose-200 bg-white p-3 text-xs text-rose-700">
                  {result.fatal}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Filas leídas",
                    value: result.rows.length,
                    tone: "slate",
                  },
                  {
                    label: "Listas para importar",
                    value: valid.length,
                    tone: "emerald",
                  },
                  { label: "Con errores", value: invalid.length, tone: "rose" },
                  {
                    label: "Con advertencias",
                    value: withWarnings.length,
                    tone: "amber",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className={`rounded-xl border p-3 ${
                      k.tone === "emerald"
                        ? "border-emerald-200 bg-emerald-50"
                        : k.tone === "rose"
                          ? "border-rose-200 bg-rose-50"
                          : k.tone === "amber"
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-slate-600">
                      {k.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {formatNumberCO(k.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold">
                  {[
                    { id: false, label: `Todas (${result.rows.length})` },
                    { id: true, label: `Solo errores (${invalid.length})` },
                  ].map((o) => (
                    <button
                      key={String(o.id)}
                      type="button"
                      onClick={() => setOnlyErrors(o.id)}
                      className={`rounded-md px-3 py-1.5 ${
                        onlyErrors === o.id
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {invalid.length > 0 && (
                  <button
                    type="button"
                    className="secondary-button !min-h-9"
                    onClick={() =>
                      downloadTextFile(
                        "reporte_errores_importacion.csv",
                        buildCsv([
                          ["fila", "codigo", "nombre", "errores"],
                          ...invalid.map((r) => [
                            String(r.line),
                            r.draft.code,
                            r.draft.name,
                            r.errors.join(" | "),
                          ]),
                        ]),
                      )
                    }
                  >
                    <Download className="size-4" /> Reporte de errores
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">
                        {client.type === "operator"
                          ? terms.mallSingular
                          : "Región"}
                      </th>
                      <th className="px-3 py-2">DANE</th>
                      <th className="px-3 py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shown.map((r) => (
                      <tr
                        key={r.line}
                        className={r.store ? "" : "bg-rose-50/50"}
                      >
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {r.line}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">
                          {r.draft.code || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.draft.name || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {r.draft.parent || "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {r.draft.deptCode || "—"} / {r.draft.muniCode || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {r.store ? (
                            <div>
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                <CheckCircle2 className="size-3.5" /> Lista
                              </span>
                              {r.warnings.map((w) => (
                                <p
                                  key={w}
                                  className="mt-1 flex items-start gap-1 text-[11px] text-amber-700"
                                >
                                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                                  {w}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <ul className="space-y-0.5">
                              {r.errors.map((e) => (
                                <li
                                  key={e}
                                  className="flex items-start gap-1 text-[11px] font-semibold text-rose-700"
                                >
                                  <XCircle className="mt-0.5 size-3 shrink-0" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                    {shown.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-slate-500"
                        >
                          No hay filas para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {invalid.length > 0 && valid.length > 0 && (
                <p className="text-xs text-slate-500">
                  Solo se importarán las {valid.length} filas válidas. Corrija
                  el archivo y vuelva a cargarlo para incluir las demás.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              step === 1 ? onClose() : setStep((step - 1) as 1 | 2)
            }
          >
            {step === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ArrowLeft className="size-4" /> Atrás
              </>
            )}
          </button>
          {step === 1 && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setStep(2)}
            >
              Ya tengo mi archivo <ArrowRight className="size-4" />
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!fileText || Boolean(result.fatal)}
              onClick={() => {
                setOnlyErrors(false)
                setStep(3)
              }}
            >
              Previsualizar <ArrowRight className="size-4" />
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
              disabled={valid.length === 0}
              onClick={() =>
                onConfirm(valid.map((r) => r.store as StoreRecord))
              }
            >
              <Check className="size-4" /> Confirmar importación de{" "}
              {formatNumberCO(valid.length)}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
