import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type {
  IntegrationState,
  SourceStatus,
  StoreStatus,
} from "../../data/storesData"
import type { OccupancyLevel } from "../../data/storeAnalytics"
import { formatDecimalCO, formatVariationCO } from "../../utils/formatters"

const statusStyles: Record<StoreStatus, string> = {
  Activa: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "En apertura": "bg-sky-50 text-sky-700 ring-sky-200",
  "Cerrada temporalmente": "bg-amber-50 text-amber-800 ring-amber-200",
  Inactiva: "bg-slate-100 text-slate-600 ring-slate-200",
}

export function StatusBadge({ status }: { status: StoreStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}

const integrationStyles: Record<IntegrationState, {
  dot: string
  text: string
}> = {
  Conectado: { dot: "bg-emerald-500", text: "text-emerald-700" },
  Atención: { dot: "bg-amber-500", text: "text-amber-700" },
  Error: { dot: "bg-rose-500", text: "text-rose-700" },
  "Sin integración": { dot: "bg-slate-300", text: "text-slate-500" },
}

export function IntegrationBadge({
  state,
}: {
  state: IntegrationState | SourceStatus
}) {
  const s = integrationStyles[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${s.text}`}
    >
      <span className={`size-2 rounded-full ${s.dot}`} />
      {state}
    </span>
  )
}

export function VariationText({
  value,
  suffix = "%",
  hidden = false,
}: {
  value: number
  suffix?: string
  hidden?: boolean
}) {
  if (hidden) return <span className="text-slate-300">—</span>
  const positive = value > 0
  const neutral = value === 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-bold ${
        neutral
          ? "text-slate-400"
          : positive
            ? "text-emerald-600"
            : "text-rose-600"
      }`}
    >
      {neutral ? (
        <Minus className="size-3" />
      ) : positive ? (
        <ArrowUpRight className="size-3.5" />
      ) : (
        <ArrowDownRight className="size-3.5" />
      )}
      {formatVariationCO(value, suffix)}
    </span>
  )
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

const occupancyStyles: Record<OccupancyLevel, {
  dot: string
  pill: string
  label: string
}> = {
  ok: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    label: "Saludable",
  },
  warn: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-800 ring-amber-200",
    label: "En observación",
  },
  high: {
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    label: "Crítico",
  },
  nodata: {
    dot: "bg-slate-300",
    pill: "bg-slate-100 text-slate-500 ring-slate-200",
    label: "Sin datos",
  },
}

export const occupancyLabel = (level: OccupancyLevel) =>
  occupancyStyles[level].label

/** Semáforo del costo de ocupación (canon ÷ ventas). */
export function OccupancyBadge({
  level,
  pct,
  showLabel = false,
}: {
  level: OccupancyLevel
  pct?: number
  showLabel?: boolean
}) {
  const s = occupancyStyles[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${s.pill}`}
    >
      <span className={`size-2 rounded-full ${s.dot}`} />
      {level !== "nodata" && pct !== undefined
        ? `${formatDecimalCO(pct, 1)} %`
        : ""}
      {(showLabel || level === "nodata" || pct === undefined) && (
        <span>{s.label}</span>
      )}
    </span>
  )
}
