import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { InventoryStatus } from "../../data/inventoryData"
import { formatNumberCO } from "../../utils/formatters"

/* ------------------------------ Insignias ------------------------------ */

const statusStyles: Record<InventoryStatus, string> = {
  Quiebre: "bg-rose-50 text-rose-700 ring-rose-200",
  Bajo: "bg-amber-50 text-amber-800 ring-amber-200",
  Óptimo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Sobrestock: "bg-violet-50 text-violet-700 ring-violet-200",
  Inmovilizado: "bg-slate-100 text-slate-700 ring-slate-300",
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}

export function NoInventoryBadge({ label = "Sin datos de inventario" }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
      {label}
    </span>
  )
}

export function UnmappedBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
      Sin homologar
    </span>
  )
}

/* ----------------------------- Controles base ----------------------------- */

export const selectCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
      />
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg bg-slate-100 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
            value === o.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SectionTabs<T extends string>({
  value,
  tabs,
  onChange,
  label,
}: {
  value: T
  tabs: Array<{ id: T; label: string; badge?: string | number; warn?: boolean }>
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {tabs.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold ${
              active
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.badge !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  t.warn
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ Paginación ------------------------------ */

export function usePager(total: number, resetKey: unknown, initialSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialSize)
  useEffect(() => setPage(1), [resetKey])
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)
  return {
    page: safePage,
    pageSize,
    pageCount,
    setPage,
    setPageSize: (n: number) => {
      setPageSize(n)
      setPage(1)
    },
    slice: <T,>(items: T[]) =>
      items.slice((safePage - 1) * pageSize, safePage * pageSize),
  }
}

export function Pager({
  pager,
  total,
  sizes = [10, 25, 50],
}: {
  pager: ReturnType<typeof usePager>
  total: number
  sizes?: number[]
}) {
  if (total === 0) return null
  const from = (pager.page - 1) * pager.pageSize + 1
  const to = Math.min(pager.page * pager.pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>Filas por página</span>
        <select
          aria-label="Filas por página"
          value={pager.pageSize}
          onChange={(e) => pager.setPageSize(Number(e.target.value))}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold"
        >
          {sizes.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <span className="ml-2">
          {formatNumberCO(from)}–{formatNumberCO(to)} de {formatNumberCO(total)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={pager.page <= 1}
          onClick={() => pager.setPage(pager.page - 1)}
          className="grid size-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-2 font-semibold text-slate-700">
          Página {pager.page} de {pager.pageCount}
        </span>
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={pager.page >= pager.pageCount}
          onClick={() => pager.setPage(pager.page + 1)}
          className="grid size-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

/** Texto numérico con signo y formato es-CO para variaciones. */
export const stockDays = (d: number) =>
  Number.isFinite(d) ? formatNumberCO(Math.round(d)) : "—"
