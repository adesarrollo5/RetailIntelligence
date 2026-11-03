import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Pager,
  Segmented,
  UnmappedBadge,
  selectCls,
  usePager,
} from "../inventory/shared"
import {
  ABC_A,
  ABC_B,
  classifyAbc,
  UNMAPPED_LABEL,
  type AbcClass,
  type Homologation,
  type ProductAgg,
} from "../../data/inventoryData"
import type { Client } from "../../types"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../../utils/formatters"

const classColor: Record<AbcClass, string> = {
  A: "#10b981",
  B: "#f59e0b",
  C: "#94a3b8",
}
const classTone: Record<AbcClass, string> = {
  A: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  B: "bg-amber-50 text-amber-800 ring-amber-200",
  C: "bg-slate-100 text-slate-600 ring-slate-300",
}
const MAX_BARS = 60

export function AbcTab({
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
  const [by, setBy] = useState<"value" | "units">("value")
  const [category, setCategory] = useState("")
  const [cls, setCls] = useState<"" | AbcClass>("")

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
  const abc = useMemo(() => classifyAbc(filtered, by), [filtered, by])

  const summary = (["A", "B", "C"] as AbcClass[]).map((c) => {
    const items = abc.rows.filter((r) => r.cls === c)
    const sum = items.reduce((a, r) => a + r.metric, 0)
    return {
      cls: c,
      count: items.length,
      pctSkus: abc.rows.length ? (items.length / abc.rows.length) * 100 : 0,
      pctSales: abc.total ? (sum / abc.total) * 100 : 0,
      sum,
    }
  })

  const chartData = useMemo(() => {
    const rows = abc.rows
    if (rows.length === 0) return []
    const size = Math.ceil(rows.length / MAX_BARS)
    const out: Array<{
      label: string
      from: number
      to: number
      metric: number
      cumulative: number
      cls: AbcClass
    }> = []
    for (let i = 0; i < rows.length; i += size) {
      const chunk = rows.slice(i, i + size)
      out.push({
        label: String(i + 1),
        from: i + 1,
        to: i + chunk.length,
        metric: chunk.reduce((a, r) => a + r.metric, 0),
        cumulative: Number(chunk[chunk.length - 1].cumulative.toFixed(2)),
        cls: chunk[0].cls,
      })
    }
    return out
  }, [abc.rows])
  const bucketSize = chartData.length ? chartData[0].to - chartData[0].from + 1 : 1

  const list = useMemo(
    () => (cls ? abc.rows.filter((r) => r.cls === cls) : abc.rows),
    [abc.rows, cls],
  )
  const pager = usePager(list.length, `${cls}|${by}|${category}`, 10)

  const fmtMetric = (v: number) =>
    by === "value" ? formatCOP(v) : `${formatNumberCO(v)} u.`
  const tickMetric = (v: number) =>
    by === "units"
      ? formatNumberCO(v)
      : v >= 1e9
        ? `$ ${(v / 1e9).toFixed(1).replace(".", ",")} mil M`
        : `$ ${formatNumberCO(Math.round(v / 1e6))} M`

  if (abc.rows.length === 0) {
    return (
      <section className="card px-6 py-14 text-center">
        <h3 className="text-sm font-bold text-slate-800">
          Sin ventas para clasificar
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          No hay SKU con ventas en el alcance, periodo y categoría seleccionados.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Clasificar por</span>
          <Segmented
            label="Base del análisis ABC"
            value={by}
            onChange={setBy}
            options={[
              { id: "value", label: "Valor de ventas" },
              { id: "units", label: "Unidades" },
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
          A: hasta {ABC_A} % acumulado · B: hasta {ABC_B} % · C: el 5 % restante
          {abc.zeroSales > 0 && (
            <> · {formatNumberCO(abc.zeroSales)} SKU sin ventas excluidos</>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((s) => (
          <button
            key={s.cls}
            type="button"
            aria-pressed={cls === s.cls}
            onClick={() => setCls(cls === s.cls ? "" : s.cls)}
            className={`card p-5 text-left ${
              cls === s.cls ? "!border-[var(--brand)] ring-2 ring-[var(--brand-soft)]" : "hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex size-8 items-center justify-center rounded-lg text-sm font-black ring-1 ring-inset ${classTone[s.cls]}`}
              >
                {s.cls}
              </span>
              <span className="text-[22px] font-bold tracking-tight text-slate-950">
                {formatDecimalCO(s.pctSales, 1)} %
              </span>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-800">
              {formatNumberCO(s.count)} SKU{" "}
              <span className="font-medium text-slate-400">
                ({formatDecimalCO(s.pctSkus, 1)} % del catálogo con ventas)
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              {fmtMetric(s.sum)} de {by === "value" ? "ventas" : "unidades"}
            </p>
          </button>
        ))}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title">Diagrama de Pareto</h2>
        <p className="section-subtitle mb-3">
          {by === "value" ? "Ventas netas" : "Unidades"} por SKU ordenados de
          mayor a menor y porcentaje acumulado
          {bucketSize > 1 && ` · cada barra agrupa ${bucketSize} SKU consecutivos`}
        </p>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval="preserveStartEnd"
                tickFormatter={(v) => `#${v}`}
              />
              <YAxis
                yAxisId="m"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={tickMetric}
                width={74}
              />
              <YAxis
                yAxisId="p"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `${v} %`}
                width={44}
              />
              <ReferenceLine yAxisId="p" y={ABC_A} stroke="#10b981" strokeDasharray="5 4" label={{ value: "80 %", position: "insideTopRight", fontSize: 10, fill: "#059669" }} />
              <ReferenceLine yAxisId="p" y={ABC_B} stroke="#f59e0b" strokeDasharray="5 4" label={{ value: "95 %", position: "insideTopRight", fontSize: 10, fill: "#b45309" }} />
              <Tooltip
                cursor={{ fill: "rgb(148 163 184 / 0.1)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof chartData)[number]
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
                      <p className="font-bold text-slate-900">
                        SKU #{d.from}
                        {d.to > d.from ? `–#${d.to}` : ""} · Clase {d.cls}
                      </p>
                      <p className="mt-1 text-slate-600">{fmtMetric(d.metric)}</p>
                      <p className="font-semibold text-slate-800">
                        Acumulado: {formatDecimalCO(d.cumulative, 1)} %
                      </p>
                    </div>
                  )
                }}
              />
              <Bar yAxisId="m" dataKey="metric" radius={[3, 3, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.from} fill={classColor[d.cls]} />
                ))}
              </Bar>
              <Line
                yAxisId="p"
                type="monotone"
                dataKey="cumulative"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
          {(["A", "B", "C"] as AbcClass[]).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: classColor[c] }} />
              Clase {c}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-slate-900" />% acumulado
          </span>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="section-title">
            Detalle por SKU
            <span className="ml-2 text-xs font-normal text-slate-400">
              {formatNumberCO(list.length)} SKU{cls ? ` · clase ${cls}` : ""}
            </span>
          </h2>
          <Segmented
            label="Filtrar por clase"
            value={cls}
            onChange={setCls}
            options={[
              { id: "", label: "Todas" },
              { id: "A", label: "A" },
              { id: "B", label: "B" },
              { id: "C", label: "C" },
            ]}
          />
        </div>
        <div className="relative overflow-x-auto border-t border-slate-100">
          <table className="data-table !min-w-[900px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>SKU</th>
                <th>Categoría estándar</th>
                <th className="text-right">Unidades</th>
                <th className="text-right">Valor</th>
                <th className="text-right">% {by === "value" ? "valor" : "unidades"}</th>
                <th className="text-right">% acumulado</th>
                <th>Clase</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice(list).map((r) => {
                const std = homologation[r.sku.originCode] ?? null
                return (
                  <tr key={r.sku.id}>
                    <td className="font-bold text-slate-400">{r.rank}</td>
                    <td className="min-w-[230px]">
                      <strong>{r.sku.description}</strong>
                      <span className="font-mono">
                        {r.sku.code}
                        {client.type === "operator" ? ` · ${r.sku.owner}` : ""}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{std ?? <UnmappedBadge />}</td>
                    <td className="text-right tabular-nums">{formatNumberCO(r.units)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">{formatCOP(r.value)}</td>
                    <td className="text-right tabular-nums">{formatDecimalCO(r.share, 2)} %</td>
                    <td className="text-right tabular-nums">{formatDecimalCO(r.cumulative, 1)} %</td>
                    <td>
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-md text-[11px] font-black ring-1 ring-inset ${classTone[r.cls]}`}
                      >
                        {r.cls}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} total={list.length} />
      </section>
    </div>
  )
}
