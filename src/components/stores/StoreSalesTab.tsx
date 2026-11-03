import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Layers, Package, Receipt, ShoppingCart } from "lucide-react"
import { AnalyticsHeatmap } from "../AnalyticsHeatmap"
import { KpiCard } from "../KpiCard"
import { EmptyPanel, VariationText } from "./StoreBadges"
import { StoreTrendChart } from "./StoreTrendChart"
import {
  getComparisonPeriodText,
  getPeriodMeta,
} from "../../data/analyticsData"
import {
  buildCategoryBreakdown,
  buildHourDayHeatmap,
  buildPaymentMix,
  buildSalesSeries,
  getStoreMetrics,
} from "../../data/storeAnalytics"
import type { StoreRecord } from "../../data/storesData"
import type { Client, GlobalFilters } from "../../types"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
  formatVariationCO,
} from "../../utils/formatters"

type Props = { client: Client; store: StoreRecord; filters: GlobalFilters }

export function StoreSalesTab({ client, store, filters }: Props) {
  const m = getStoreMetrics(store, filters.periodId, filters.compareMode)
  const period = getPeriodMeta(filters.periodId)
  const compText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )

  if (!m.hasData) {
    return (
      <EmptyPanel
        title="Sin ventas registradas en el periodo"
        description={`${store.name} está en estado «${store.status}» y no reporta transacciones para ${period.shortLabel}. Las ventas aparecerán cuando se sincronice el POS.`}
      />
    )
  }

  const series = buildSalesSeries(store, filters.periodId, filters.compareMode)
  const categories = buildCategoryBreakdown(
    store,
    filters.periodId,
    filters.compareMode,
  )
  const payments = buildPaymentMix(store, filters.periodId, filters.compareMode)
  const heat = buildHourDayHeatmap(
    store,
    m.netSales,
    client.parameters.weekStartsOn,
    "sales",
    filters.compareMode,
  )
  const palette = [
    client.color,
    client.secondaryColor,
    client.accentColor,
    "#f59e0b",
    "#94a3b8",
  ]
  const terms = client.terminology

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ventas netas"
          value={formatCOP(m.netSales)}
          change={formatVariationCO(m.variation)}
          positive={m.variation >= 0}
          detail={`vs ${formatCOP(m.comparisonSales)}`}
          icon={ShoppingCart}
        />
        <KpiCard
          label={terms.transactionPlural}
          value={formatNumberCO(m.transactions)}
          change={formatVariationCO(m.transactionsVar)}
          positive={m.transactionsVar >= 0}
          detail={`vs ${formatNumberCO(m.compTransactions)}`}
          icon={Receipt}
        />
        <KpiCard
          label="Ticket promedio"
          value={formatCOP(m.avgTicket)}
          change={formatVariationCO(m.avgTicketVar)}
          positive={m.avgTicketVar >= 0}
          detail={`vs ${formatCOP(m.compAvgTicket)}`}
          icon={Layers}
        />
        <KpiCard
          label="Unidades vendidas"
          value={formatNumberCO(m.units)}
          change={formatVariationCO(m.unitsVar)}
          positive={m.unitsVar >= 0}
          detail={`vs ${formatNumberCO(m.compUnits)}`}
          icon={Package}
        />
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title">
          Tendencia de ventas por {series.granularity}
        </h2>
        <p className="section-subtitle mb-3">
          {store.name} · {period.label}
        </p>
        <StoreTrendChart
          data={series.points}
          color={client.color}
          gradientId={`storeSalesFill-${store.id}`}
          comparisonText={`Periodo comp.: ${compText}`}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Ventas por línea de producto</h2>
          <p className="section-subtitle mb-3">
            Categoría de la {terms.storeSingular.toLowerCase()}:{" "}
            {store.category}
          </p>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid
                  stroke="#edf0f4"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) =>
                    `${formatNumberCO(Math.round(Number(v) / 1e6))} M`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v) => formatCOP(Number(v))}
                />
                <Bar dataKey="actual" name="Ventas" radius={[0, 6, 6, 0]}>
                  {categories.map((c, i) => (
                    <Cell key={c.name} fill={palette[i % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 divide-y divide-slate-100 text-xs">
            {categories.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-slate-600">{c.name}</span>
                <span className="flex items-center gap-4">
                  <span className="text-slate-400">
                    {formatDecimalCO(c.share, 1)}%
                  </span>
                  <strong className="w-28 text-right text-slate-900">
                    {formatCOP(c.actual)}
                  </strong>
                  <span className="w-14 text-right">
                    <VariationText value={c.variation} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Ventas por medio de pago</h2>
          <p className="section-subtitle mb-4">
            Participación sobre ventas netas
          </p>
          <ul className="space-y-3.5">
            {payments.map((p, i) => (
              <li key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{p.name}</span>
                  <span className="text-slate-500">
                    <strong className="text-slate-900">
                      {formatCOP(p.actual)}
                    </strong>{" "}
                    · {formatDecimalCO(p.share, 1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.share}%`,
                      background: palette[i % palette.length],
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <AnalyticsHeatmap
        title="Mapa de calor: ventas por hora y día"
        subtitle={`Horario de atención: ${store.schedule.days} ${store.schedule.open} – ${store.schedule.close}`}
        cells={heat}
        weekStartsOn={client.parameters.weekStartsOn}
        valueKind="currency"
        unitLabel="COP"
        comparisonPeriodText={compText}
        brandColor={client.color}
      />
    </div>
  )
}
