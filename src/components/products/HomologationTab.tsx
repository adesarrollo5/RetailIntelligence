import { useMemo, useState } from "react"
import { CheckCircle2, Sparkles } from "lucide-react"
import {
  Pager,
  SearchInput,
  Segmented,
  selectCls,
  usePager,
} from "../inventory/shared"
import type {
  Homologation,
  OriginCategory,
  ProductAgg,
} from "../../data/inventoryData"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../../utils/formatters"

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

type Props = {
  products: ProductAgg[]
  origins: OriginCategory[]
  allOrigins: OriginCategory[]
  categories: string[]
  homologation: Homologation
  clientTotals: { skus: number; unmapped: number }
  onChange: (next: Homologation, message: string) => void
}

export function HomologationTab({
  products,
  origins,
  allOrigins,
  categories,
  homologation,
  clientTotals,
  onChange,
}: Props) {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | "pending">("all")

  const stats = useMemo(() => {
    const m = new Map<string, { skus: number; value: number }>()
    for (const p of products) {
      const s = m.get(p.sku.originCode) ?? { skus: 0, value: 0 }
      s.skus += 1
      s.value += p.value
      m.set(p.sku.originCode, s)
    }
    return m
  }, [products])

  const list = useMemo(() => {
    const nq = normalize(q.trim())
    return origins
      .filter((o) => (filter === "pending" ? !homologation[o.code] : true))
      .filter(
        (o) =>
          !nq || normalize(`${o.code} ${o.name} ${o.system}`).includes(nq),
      )
      .sort(
        (a, b) =>
          Number(!!homologation[a.code]) - Number(!!homologation[b.code]) ||
          (stats.get(b.code)?.skus ?? 0) - (stats.get(a.code)?.skus ?? 0),
      )
  }, [origins, filter, q, homologation, stats])

  const pager = usePager(list.length, `${q}|${filter}`, 10)

  const mappedCount = origins.filter((o) => homologation[o.code]).length
  const pendingSkus = origins
    .filter((o) => !homologation[o.code])
    .reduce((a, o) => a + (stats.get(o.code)?.skus ?? 0), 0)
  const pct = origins.length ? (mappedCount / origins.length) * 100 : 100
  const suggestible = allOrigins.filter(
    (o) => !homologation[o.code] && o.suggestion,
  )

  const set = (code: string, value: string, name: string) =>
    onChange(
      { ...homologation, [code]: value || null },
      value
        ? `«${name}» asignada a ${value}.`
        : `Se quitó la homologación de «${name}».`,
    )

  return (
    <section className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-[260px] flex-1">
          <p className="text-xs font-bold text-slate-900">
            {formatNumberCO(mappedCount)} de {formatNumberCO(origins.length)}{" "}
            categorías de origen homologadas
            <span className="ml-2 font-medium text-slate-400">
              ({formatDecimalCO(pct, 0)} %)
            </span>
          </p>
          <div className="mt-2 h-2 max-w-lg overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            <strong className={pendingSkus ? "text-amber-700" : "text-emerald-700"}>
              {formatNumberCO(pendingSkus)} SKU sin homologar
            </strong>{" "}
            en el alcance actual · {formatNumberCO(clientTotals.unmapped)} de{" "}
            {formatNumberCO(clientTotals.skus)} en todo el catálogo del cliente.
            Las asignaciones aplican a todo el cliente.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={suggestible.length === 0}
          onClick={() => {
            const next = { ...homologation }
            suggestible.forEach((o) => (next[o.code] = o.suggestion))
            onChange(
              next,
              `Se aceptaron ${suggestible.length} sugerencias de homologación.`,
            )
          }}
        >
          <Sparkles className="size-4" />
          Aceptar {formatNumberCO(suggestible.length)} sugerencias
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <SearchInput
            value={q}
            onChange={setQ}
            label="Buscar categoría de origen"
            placeholder="Buscar por código, nombre o sistema de origen"
          />
          <Segmented
            label="Filtro de homologación"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "Todas" },
              { id: "pending", label: "Pendientes" },
            ]}
          />
        </div>
        {list.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-14 text-center">
            <CheckCircle2 className="mx-auto size-7 text-emerald-500" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              {filter === "pending" && !q
                ? "Todo el catálogo está homologado"
                : "Sin resultados"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter === "pending" && !q
                ? "No quedan categorías de origen pendientes en este alcance."
                : "Ninguna categoría de origen coincide con la búsqueda."}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto border-t border-slate-100">
              <table className="data-table !min-w-[980px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
                <thead>
                  <tr>
                    <th>Categoría de origen</th>
                    <th>Sistema fuente</th>
                    <th className="text-right">SKU</th>
                    <th className="text-right">Ventas del periodo</th>
                    <th className="min-w-[240px]">Categoría estándar</th>
                    <th>Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.slice(list).map((o) => {
                    const current = homologation[o.code] ?? ""
                    const st = stats.get(o.code)
                    return (
                      <tr key={o.code}>
                        <td className="min-w-[200px]">
                          <strong>{o.name}</strong>
                          <span className="font-mono">{o.code}</span>
                        </td>
                        <td className="whitespace-nowrap">{o.system || "—"}</td>
                        <td className="text-right tabular-nums">
                          {formatNumberCO(st?.skus ?? 0)}
                        </td>
                        <td className="whitespace-nowrap text-right tabular-nums">
                          {formatCOP(st?.value ?? 0)}
                        </td>
                        <td>
                          <select
                            aria-label={`Categoría estándar para ${o.name}`}
                            value={current}
                            onChange={(e) => set(o.code, e.target.value, o.name)}
                            className={`${selectCls} ${
                              current ? "" : "!border-amber-300 !bg-amber-50"
                            }`}
                          >
                            <option value="">Sin homologar</option>
                            {categories.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap">
                          {o.suggestion ? (
                            current === o.suggestion ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="size-3.5" />
                                Aplicada
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-bold text-[var(--brand)] hover:underline"
                                onClick={() => set(o.code, o.suggestion!, o.name)}
                              >
                                Usar «{o.suggestion}»
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Sin sugerencia: requiere revisión
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager pager={pager} total={list.length} />
          </>
        )}
      </div>
    </section>
  )
}
