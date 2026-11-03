import { useMemo, useState } from "react"
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react"
import { Segmented, UnmappedBadge, selectCls } from "../inventory/shared"
import {
  UNMAPPED_LABEL,
  type Homologation,
  type ProductAgg,
} from "../../data/inventoryData"
import type { Client } from "../../types"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../../utils/formatters"

type Metric = "units" | "value"

function RankTable({
  title,
  subtitle,
  icon: Icon,
  tone,
  items,
  metric,
  totals,
  client,
  homologation,
}: {
  title: string
  subtitle: string
  icon: typeof ArrowUpWideNarrow
  tone: string
  items: ProductAgg[]
  metric: Metric
  totals: { units: number; value: number }
  client: Client
  homologation: Homologation
}) {
  const max = Math.max(1, ...items.map((i) => i[metric]))
  return (
    <section className="card overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-[18px]" />
        </span>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="relative mt-4 overflow-x-auto border-t border-slate-100">
        <table className="data-table !min-w-[560px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>SKU</th>
              <th className="text-right">Unidades</th>
              <th className="text-right">Valor</th>
              <th className="text-right">% valor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, i) => {
              const std = homologation[p.sku.originCode] ?? null
              return (
                <tr key={p.sku.id}>
                  <td className="font-bold text-slate-400">{i + 1}</td>
                  <td className="min-w-[230px]">
                    <strong>{p.sku.description}</strong>
                    <span className="!flex items-center gap-1.5">
                      <span className="font-mono">{p.sku.code}</span>
                      {client.type === "operator" && <span>· {p.sku.owner}</span>}
                      {!std && <UnmappedBadge />}
                    </span>
                    <span
                      className="!mt-1.5 !block h-1 overflow-hidden rounded-full bg-slate-100"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full bg-[var(--brand)]"
                        style={{ width: `${(p[metric] / max) * 100}%` }}
                      />
                    </span>
                  </td>
                  <td
                    className={`text-right tabular-nums ${metric === "units" ? "font-bold text-slate-900" : ""}`}
                  >
                    {formatNumberCO(p.units)}
                  </td>
                  <td
                    className={`whitespace-nowrap text-right tabular-nums ${metric === "value" ? "font-bold text-slate-900" : ""}`}
                  >
                    {formatCOP(p.value)}
                  </td>
                  <td className="text-right tabular-nums">
                    {totals.value > 0
                      ? `${formatDecimalCO((p.value / totals.value) * 100, 2)} %`
                      : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function RankingTab({
  client,
  products,
  categories,
  homologation,
}: {
  client: Client
  products: ProductAgg[]
  categories: string[]
  homologation: Homologation
}) {
  const [metric, setMetric] = useState<Metric>("units")
  const [category, setCategory] = useState("")

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const std = homologation[p.sku.originCode] ?? null
        return category === UNMAPPED_LABEL
          ? std === null
          : !category || std === category
      }),
    [products, category, homologation],
  )
  const totals = useMemo(
    () => ({
      units: filtered.reduce((a, p) => a + p.units, 0),
      value: filtered.reduce((a, p) => a + p.value, 0),
    }),
    [filtered],
  )
  const sold = useMemo(() => filtered.filter((p) => p.units > 0), [filtered])
  const cmp = (a: ProductAgg, b: ProductAgg) =>
    b[metric] - a[metric] || a.sku.code.localeCompare(b.sku.code)
  const top = useMemo(() => [...sold].sort(cmp).slice(0, 10), [sold, metric])
  const bottom = useMemo(
    () => [...sold].sort((a, b) => -cmp(a, b)).slice(0, 10),
    [sold, metric],
  )
  const noSales = filtered.length - sold.length
  const label = metric === "units" ? "unidades" : "valor"

  if (filtered.length === 0) {
    return (
      <section className="card px-6 py-14 text-center">
        <h3 className="text-sm font-bold text-slate-800">Sin productos para clasificar</h3>
        <p className="mt-1 text-xs text-slate-500">
          No hay SKU en el alcance o la categoría seleccionada.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Ordenar por</span>
          <Segmented
            label="Métrica del ranking"
            value={metric}
            onChange={setMetric}
            options={[
              { id: "units", label: "Unidades" },
              { id: "value", label: "Valor" },
            ]}
          />
        </div>
        <select
          aria-label="Categoría estándar"
          className={`${selectCls} !w-auto min-w-[220px]`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value={UNMAPPED_LABEL}>{UNMAPPED_LABEL}</option>
        </select>
        <p className="ml-auto text-[11px] text-slate-500">
          {formatNumberCO(sold.length)} SKU con ventas
          {noSales > 0 && (
            <>
              {" "}
              · <strong>{formatNumberCO(noSales)}</strong> sin ventas en el
              periodo (no entran al ranking)
            </>
          )}
        </p>
      </div>

      <div className="grid gap-5 2xl:grid-cols-2">
        <RankTable
          title={`10 más vendidos por ${label}`}
          subtitle="Mayor rotación en el alcance y periodo seleccionados"
          icon={ArrowUpWideNarrow}
          tone="bg-emerald-50 text-emerald-600"
          items={top}
          metric={metric}
          totals={totals}
          client={client}
          homologation={homologation}
        />
        <RankTable
          title={`10 menos vendidos por ${label}`}
          subtitle="SKU con ventas, de menor a mayor"
          icon={ArrowDownWideNarrow}
          tone="bg-rose-50 text-rose-600"
          items={bottom}
          metric={metric}
          totals={totals}
          client={client}
          homologation={homologation}
        />
      </div>
    </div>
  )
}
