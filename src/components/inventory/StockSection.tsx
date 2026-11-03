import { useMemo, useState } from "react"
import { PlugZap } from "lucide-react"
import {
  InventoryStatusBadge,
  NoInventoryBadge,
  Pager,
  SearchInput,
  Segmented,
  UnmappedBadge,
  selectCls,
  stockDays,
  usePager,
} from "./shared"
import { getMunicipality } from "../../data/colombiaGeo"
import {
  noInventoryReason,
  stdCategoryOf,
  summarizeByStore,
  UNMAPPED_LABEL,
  type EvalRow,
  type Homologation,
  type InventoryStatus,
} from "../../data/inventoryData"
import type { StoreRecord } from "../../data/storesData"
import type { Client, PeriodId } from "../../types"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
} from "../../utils/formatters"

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

type Props = {
  client: Client
  rows: EvalRow[]
  noDataStores: StoreRecord[]
  homologation: Homologation
  categories: string[]
  periodId: PeriodId
  presetView?: "sku" | "store"
  onOpenIntegrations?: () => void
}

export function StockSection({
  client,
  rows,
  noDataStores,
  homologation,
  categories,
  periodId,
  presetView = "sku",
  onOpenIntegrations,
}: Props) {
  const terms = client.terminology
  const storeLower = terms.storeSingular.toLowerCase()
  const storesLower = terms.storePlural.toLowerCase()
  const [view, setView] = useState<"sku" | "store">(presetView)
  const [q, setQ] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [storeId, setStoreId] = useState("")
  const [showNoData, setShowNoData] = useState(true)

  const withStd = useMemo(
    () => rows.map((r) => ({ r, std: stdCategoryOf(r.sku, homologation) })),
    [rows, homologation],
  )

  const filtered = useMemo(() => {
    const nq = normalize(q.trim())
    return withStd
      .filter(({ r, std }) => {
        if (category === UNMAPPED_LABEL ? std !== null : category && std !== category) return false
        if (status && r.status !== status) return false
        if (storeId && r.storeId !== storeId) return false
        if (nq) {
          const hay = normalize(
            `${r.sku.code} ${r.sku.description} ${r.store.name} ${r.sku.owner}`,
          )
          if (!hay.includes(nq)) return false
        }
        return true
      })
      .sort(
        (a, b) =>
          a.r.store.name.localeCompare(b.r.store.name, "es") ||
          a.r.sku.rank - b.r.sku.rank,
      )
  }, [withStd, q, category, status, storeId])

  const skuPager = usePager(filtered.length, `${q}|${category}|${status}|${storeId}|${view}`)

  const storeSummaries = useMemo(() => {
    const nq = normalize(q.trim())
    return summarizeByStore(
      rows.filter((r) => {
        const std = stdCategoryOf(r.sku, homologation)
        if (category === UNMAPPED_LABEL ? std !== null : category && std !== category) return false
        return true
      }),
      periodId,
    )
      .filter((s) => !nq || normalize(`${s.store.name} ${s.store.code} ${s.store.parent}`).includes(nq))
      .sort((a, b) => b.value - a.value)
  }, [rows, homologation, category, q, periodId])

  const noDataFiltered = useMemo(() => {
    const nq = normalize(q.trim())
    return noDataStores.filter(
      (s) => !nq || normalize(`${s.name} ${s.code} ${s.parent}`).includes(nq),
    )
  }, [noDataStores, q])

  const storePagerTotal =
    storeSummaries.length + (showNoData ? noDataFiltered.length : 0)
  const storePager = usePager(storePagerTotal, `${q}|${category}|${showNoData}|${view}`)

  const storeOptions = useMemo(() => {
    const m = new Map<string, string>()
    rows.forEach((r) => m.set(r.storeId, r.store.name))
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
  }, [rows])

  const cityOf = (s: StoreRecord) => getMunicipality(s.muniCode)?.name ?? "—"

  const storeTableRows = [
    ...storeSummaries.map((s) => ({ kind: "data" as const, s })),
    ...(showNoData
      ? noDataFiltered.map((store) => ({ kind: "nodata" as const, store }))
      : []),
  ]

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="section-title">
            Stock por {storeLower} y SKU
          </h2>
          <p className="section-subtitle">
            Existencias al cierre de 31/03/2025. Cobertura calculada con la venta
            de los últimos 30 días.
          </p>
        </div>
        <Segmented
          label="Vista del stock"
          value={view}
          onChange={setView}
          options={[
            { id: "sku", label: `Detalle por ${storeLower} y SKU` },
            { id: "store", label: `Resumen por ${storeLower}` },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <SearchInput
          value={q}
          onChange={setQ}
          label="Buscar en el stock"
          placeholder={
            view === "sku"
              ? `Buscar por SKU, descripción, marca o ${storeLower}`
              : `Buscar ${storeLower} por nombre, código o ${terms.mallSingular.toLowerCase()}`
          }
        />
        <select
          aria-label="Categoría estándar"
          className={`${selectCls} !w-auto min-w-[200px]`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value={UNMAPPED_LABEL}>{UNMAPPED_LABEL}</option>
        </select>
        {view === "sku" ? (
          <>
            <select
              aria-label="Estado del stock"
              className={`${selectCls} !w-auto min-w-[160px]`}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {(["Quiebre", "Bajo", "Óptimo", "Sobrestock", "Inmovilizado"] as InventoryStatus[]).map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
            <select
              aria-label={`Filtrar por ${storeLower}`}
              className={`${selectCls} !w-auto min-w-[200px]`}
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">Todas las {storesLower}</option>
              {storeOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-[var(--brand)]"
              checked={showNoData}
              onChange={(e) => setShowNoData(e.target.checked)}
            />
            Mostrar {storesLower} sin datos de inventario ({noDataFiltered.length})
          </label>
        )}
      </div>

      {view === "sku" ? (
        filtered.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-14 text-center">
            <h3 className="text-sm font-bold text-slate-800">Sin resultados</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ningún SKU coincide con la búsqueda y los filtros aplicados.
            </p>
            <button
              type="button"
              className="secondary-button mt-4"
              onClick={() => {
                setQ("")
                setCategory("")
                setStatus("")
                setStoreId("")
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto border-t border-slate-100">
              <table className="data-table !min-w-[1040px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
                <thead>
                  <tr>
                    <th>{terms.storeSingular}</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th className="text-right">Stock (u.)</th>
                    <th className="text-right">Cobertura (días)</th>
                    <th className="text-right">Vendidas</th>
                    <th className="text-right">Valor a costo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {skuPager.slice(filtered).map(({ r, std }) => (
                    <tr key={r.id}>
                      <td className="min-w-[190px]">
                        <strong>{r.store.name}</strong>
                        <span>
                          {cityOf(r.store)} · {r.store.parent}
                        </span>
                      </td>
                      <td className="min-w-[230px]">
                        <strong>{r.sku.description}</strong>
                        <span className="font-mono">
                          {r.sku.code}
                          {client.type === "operator" ? ` · ${r.sku.owner}` : ""}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {std ?? <UnmappedBadge />}
                      </td>
                      <td className="text-right tabular-nums">
                        <strong className="!inline text-slate-800">
                          {formatNumberCO(r.stock ?? 0)}
                        </strong>
                      </td>
                      <td className="text-right tabular-nums">
                        {r.status === "Inmovilizado"
                          ? "—"
                          : r.stock === 0
                            ? "0"
                            : stockDays(r.coverage)}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatNumberCO(r.units)}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCOP(r.stockCost)}
                      </td>
                      <td>
                        <InventoryStatusBadge status={r.status!} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager pager={skuPager} total={filtered.length} />
          </>
        )
      ) : (
        <>
          <div className="relative overflow-x-auto border-t border-slate-100">
            <table className="data-table !min-w-[1000px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
              <thead>
                <tr>
                  <th>{terms.storeSingular}</th>
                  <th className="text-right">SKUs</th>
                  <th className="text-right">Stock (u.)</th>
                  <th className="text-right">Valor a costo</th>
                  <th className="text-right">Días de inventario</th>
                  <th className="text-right">Sell-through</th>
                  <th className="text-right">Quiebres</th>
                  <th className="text-right">Sobrestock</th>
                  <th className="text-right">Inmovilizados</th>
                </tr>
              </thead>
              <tbody>
                {storePager.slice(storeTableRows).map((row) =>
                  row.kind === "data" ? (
                    <tr key={row.s.store.id}>
                      <td className="min-w-[210px]">
                        <strong>{row.s.store.name}</strong>
                        <span>
                          {cityOf(row.s.store)} · {row.s.store.parent}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{row.s.skus}</td>
                      <td className="text-right tabular-nums">
                        {formatNumberCO(row.s.units)}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCOP(row.s.value)}
                      </td>
                      <td className="text-right tabular-nums">
                        {row.s.sold > 0 ? stockDays(row.s.days) : "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatDecimalCO(row.s.sellThrough, 1)} %
                      </td>
                      <td className="text-right tabular-nums">
                        <span
                          className={`!inline font-bold ${row.s.stockouts ? "text-rose-600" : "text-slate-400"}`}
                        >
                          {row.s.stockouts}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        <span
                          className={`!inline font-bold ${row.s.overstock ? "text-violet-600" : "text-slate-400"}`}
                        >
                          {row.s.overstock}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        <span
                          className={`!inline font-bold ${row.s.immobilized ? "text-slate-700" : "text-slate-400"}`}
                        >
                          {row.s.immobilized}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.store.id} className="bg-slate-50/60">
                      <td className="min-w-[210px]">
                        <strong className="!text-slate-500">{row.store.name}</strong>
                        <span>
                          {cityOf(row.store)} · {row.store.parent}
                        </span>
                      </td>
                      <td colSpan={8}>
                        <span className="!mt-0 flex flex-wrap items-center gap-3">
                          <NoInventoryBadge />
                          <span className="!mt-0 !inline text-[11px] text-slate-400">
                            {noInventoryReason(row.store)}
                          </span>
                          {onOpenIntegrations &&
                            noInventoryReason(row.store) ===
                              "Sin integración de inventario" && (
                              <button
                                type="button"
                                onClick={onOpenIntegrations}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:underline"
                              >
                                <PlugZap className="size-3" />
                                Conectar inventario
                              </button>
                            )}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {storeTableRows.length === 0 && (
            <p className="px-6 py-12 text-center text-xs text-slate-500">
              Ninguna {storeLower} coincide con los filtros.
            </p>
          )}
          <Pager pager={storePager} total={storePagerTotal} />
        </>
      )}
    </section>
  )
}
