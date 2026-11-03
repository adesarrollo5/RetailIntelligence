import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Download,
  Layers,
  PackageCheck,
  Percent,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  Store,
  Tag,
} from "lucide-react"
import { AnalyticsHeatmap } from "../components/AnalyticsHeatmap"
import {
  ModuleStateFeedback,
  ModuleStateSwitcher,
} from "../components/ModuleStateControls"
import { SalesDrilldown } from "../components/SalesDrilldown"
import {
  buildSalesAnalytics,
  getComparisonPeriodText,
  getPeriodMeta,
  type BreakdownItem,
} from "../data/analyticsData"
import type { Client, GlobalFilters, ModuleDataState } from "../types"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
  formatVariationCO,
} from "../utils/formatters"

type Props = {
  client: Client
  filters: GlobalFilters
}

export function SalesPage({ client, filters }: Props) {
  const [granularity, setGranularity] = useState<"Día" | "Semana" | "Mes">(
    "Día",
  )
  const [comparableOnly, setComparableOnly] = useState(false)
  const [dataState, setDataState] = useState<ModuleDataState>("ready")

  const terms = client.terminology
  const periodMeta = getPeriodMeta(filters.periodId)
  const comparisonPeriodText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )

  const analytics = buildSalesAnalytics(
    client,
    filters.scope,
    filters.periodId,
    filters.compareMode,
    comparableOnly,
  )

  const trendData =
    granularity === "Día"
      ? analytics.trendByDay
      : granularity === "Semana"
        ? analytics.trendByWeek
        : analytics.trendByMonth

  const kpiItems = [
    {
      label: "Ventas netas (sin IVA)",
      value: formatCOP(analytics.kpis.netSales.current),
      comparison: formatCOP(analytics.kpis.netSales.comparison),
      variation: analytics.kpis.netSales.variation,
      positiveGood: true,
      icon: Banknote,
    },
    {
      label: "Ventas brutas (con IVA)",
      value: formatCOP(analytics.kpis.grossSales.current),
      comparison: formatCOP(analytics.kpis.grossSales.comparison),
      variation: analytics.kpis.grossSales.variation,
      positiveGood: true,
      icon: ReceiptText,
    },
    {
      label: `Descuentos (${formatDecimalCO(analytics.kpis.discounts.ratePercent, 1)}%)`,
      value: formatCOP(analytics.kpis.discounts.current),
      comparison: formatCOP(analytics.kpis.discounts.comparison),
      variation: analytics.kpis.discounts.variation,
      positiveGood: false,
      icon: Percent,
    },
    {
      label: `Devoluciones (${formatDecimalCO(analytics.kpis.returns.ratePercent, 1)}%)`,
      value: formatCOP(analytics.kpis.returns.current),
      comparison: formatCOP(analytics.kpis.returns.comparison),
      variation: analytics.kpis.returns.variation,
      positiveGood: false,
      icon: RotateCcw,
    },
    {
      label: terms.transactionPlural,
      value: formatNumberCO(analytics.kpis.transactions.current),
      comparison: formatNumberCO(analytics.kpis.transactions.comparison),
      variation: analytics.kpis.transactions.variation,
      positiveGood: true,
      icon: ShoppingCart,
    },
    {
      label: `${terms.transactionSingular} promedio`,
      value: formatCOP(analytics.kpis.avgTicket.current),
      comparison: formatCOP(analytics.kpis.avgTicket.comparison),
      variation: analytics.kpis.avgTicket.variation,
      positiveGood: true,
      icon: CreditCard,
    },
    {
      label: `Unidades por ${terms.transactionSingular.toLowerCase()}`,
      value: `${formatDecimalCO(analytics.kpis.unitsPerTicket.current, 2)} u.`,
      comparison: `${formatDecimalCO(analytics.kpis.unitsPerTicket.comparison, 2)} u.`,
      variation: analytics.kpis.unitsPerTicket.variation,
      positiveGood: true,
      icon: PackageCheck,
    },
    {
      label: "Precio promedio por unidad",
      value: formatCOP(analytics.kpis.avgPrice.current),
      comparison: formatCOP(analytics.kpis.avgPrice.comparison),
      variation: analytics.kpis.avgPrice.variation,
      positiveGood: true,
      icon: Tag,
    },
  ]

  return (
    <div className="page-wrap space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
            <Layers className="size-3.5" />
            Alcance: <strong>{filters.scope}</strong> · Periodo:{" "}
            <strong>{periodMeta.label}</strong>
          </p>
          <h1 className="page-title">Ventas y productividad comercial</h1>
          <p className="page-subtitle">
            Comparando frente a <strong>{comparisonPeriodText}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ModuleStateSwitcher state={dataState} onChange={setDataState} />
          <button type="button" className="secondary-button">
            <Download className="size-4" /> Exportar ventas
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={comparableOnly}
            onChange={(e) => setComparableOnly(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          <div>
            <span className="text-xs font-bold text-slate-900">
              {terms.storePlural} comparables (Same-Store Sales): solo{" "}
              {terms.storePlural.toLowerCase()} abiertas en ambos periodos
            </span>
            <p className="text-[11px] text-slate-500">
              Excluye aperturas recientes o remodelaciones para medir el
              crecimiento orgánico real frente a {comparisonPeriodText}.
            </p>
          </div>
        </label>

        <div className="flex items-center gap-2">
          <span
            className={`status-pill ${
              comparableOnly ? "status-green" : "status-blue"
            }`}
          >
            {comparableOnly
              ? `Base comparable activa (${analytics.comparableLocationsCount} de ${analytics.totalLocationsCount} muestra)`
              : `Portafolio total (${analytics.totalLocationsCount} en muestra)`}
          </span>
        </div>
      </div>

      {dataState !== "ready" ? (
        <ModuleStateFeedback
          state={dataState}
          moduleLabel="Ventas"
          scopeLabel={filters.scope}
          periodLabel={periodMeta.label}
          onReset={() => setDataState("ready")}
        />
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {kpiItems.map((item) => {
              const Icon = item.icon
              const isFavorable = item.positiveGood
                ? item.variation >= 0
                : item.variation <= 0
              return (
                <article
                  key={item.label}
                  className="card p-4 transition hover:border-slate-300"
                  title={`${item.label}: ${item.value} (${formatVariationCO(item.variation)} vs. ${comparisonPeriodText})`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2.5 text-xl font-bold tracking-[-0.03em] text-slate-950">
                    {item.value}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-2 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold ${
                        isFavorable ? "text-[#047857]" : "text-[#be123c]"
                      }`}
                    >
                      {item.variation >= 0 ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                      {formatVariationCO(item.variation)}
                    </span>
                    <span className="truncate text-[10px] text-slate-400">
                      Ant: {item.comparison}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>

          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title">
                  Tendencia de ventas: periodo actual vs. comparación
                </h2>
                <p className="section-subtitle">
                  Comparando contra <strong>{comparisonPeriodText}</strong> ·
                  Valores expresados en COP ($ 1.234.567)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <i
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: client.color }}
                    />
                    Actual ({periodMeta.shortLabel})
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <i className="inline-block size-2.5 rounded-full bg-slate-400" />
                    {filters.compareMode === "prev_period"
                      ? "Periodo anterior"
                      : "Año anterior"}
                  </span>
                </div>
                <div className="flex rounded-lg bg-slate-100 p-1">
                  {(["Día", "Semana", "Mes"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGranularity(g)}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${
                        granularity === g
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="salesTrendFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={client.color}
                        stopOpacity={0.22}
                      />
                      <stop
                        offset="100%"
                        stopColor={client.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#edf0f4"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    dy={6}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) =>
                      `$ ${formatNumberCO(Math.round(Number(v) / 1000000))}M`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0]
                        ?.payload as typeof trendData[number] | undefined
                      if (!point) return null
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl">
                          <p className="font-bold text-slate-900">
                            {point.fullDate}
                            {point.note ? ` · ${point.note}` : ""}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">
                                Valor actual:
                              </span>
                              <strong className="text-slate-900">
                                {formatCOP(point.actual)}
                              </strong>
                            </p>
                            <p className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">
                                Comparación:
                              </span>
                              <span className="font-semibold text-slate-700">
                                {formatCOP(point.comparison)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-4">
                              <span className="text-slate-500">Variación:</span>
                              <span
                                className={`font-bold ${
                                  point.variation >= 0
                                    ? "text-[#047857]"
                                    : "text-[#be123c]"
                                }`}
                              >
                                {formatVariationCO(point.variation)}
                              </span>
                            </p>
                          </div>
                          <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                            Periodo comp.: {comparisonPeriodText}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="comparison"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke={client.color}
                    strokeWidth={2.6}
                    fill="url(#salesTrendFill)"
                    activeDot={{
                      r: 5,
                      fill: client.color,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <BreakdownCard
              title={`Ventas por ${terms.storeSingular.toLowerCase()}`}
              subtitle={`Participación y variación por ${terms.storeSingular.toLowerCase()}`}
              icon={Store}
              items={analytics.byStore}
              comparisonPeriodText={comparisonPeriodText}
            />
            <BreakdownCard
              title="Ventas por categoría"
              subtitle="Desempeño comercial por línea de negocio"
              icon={Tag}
              items={analytics.byCategory}
              comparisonPeriodText={comparisonPeriodText}
            />
            <BreakdownCard
              title="Ventas por medio de pago"
              subtitle="Efectivo, débito, crédito, transferencia y otros"
              icon={CreditCard}
              items={analytics.byPaymentMethod}
              comparisonPeriodText={comparisonPeriodText}
            />
          </div>

          <AnalyticsHeatmap
            title="Mapa de calor de ventas (Hora × Día de la semana)"
            subtitle={`Intensidad horaria en COP · Semana inicia en ${client.parameters.weekStartsOn.toLowerCase()}`}
            cells={analytics.salesHeatmap}
            weekStartsOn={client.parameters.weekStartsOn}
            valueKind="currency"
            unitLabel="COP"
            comparisonPeriodText={comparisonPeriodText}
            brandColor={client.color}
          />

          <SalesDrilldown
            client={client}
            stores={analytics.storesHierarchy}
            comparisonPeriodText={comparisonPeriodText}
          />
        </>
      )}
    </div>
  )
}

function BreakdownCard({
  title,
  subtitle,
  icon: Icon,
  items,
  comparisonPeriodText,
}: {
  title: string
  subtitle: string
  icon: typeof Store
  items: BreakdownItem[]
  comparisonPeriodText: string
}) {
  return (
    <section className="card flex flex-col justify-between p-5">
      <div>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Icon className="size-4 text-[var(--brand)]" />
              {title}
            </h2>
            <p className="section-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="h-[165px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={items}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0]?.payload as BreakdownItem | undefined
                  if (!row) return null
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
                      <p className="font-bold text-slate-900">{row.name}</p>
                      {row.subtitle && (
                        <p className="text-[10px] text-slate-400">
                          {row.subtitle}
                        </p>
                      )}
                      <div className="mt-2 space-y-1">
                        <p className="flex justify-between gap-4">
                          <span className="text-slate-500">Valor:</span>
                          <strong>{formatCOP(row.actual)}</strong>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-slate-500">Variación:</span>
                          <span
                            className={`font-bold ${
                              row.variation >= 0
                                ? "text-[#047857]"
                                : "text-[#be123c]"
                            }`}
                          >
                            {formatVariationCO(row.variation)}
                          </span>
                        </p>
                      </div>
                      <p className="mt-1.5 border-t border-slate-100 pt-1 text-[10px] text-slate-400">
                        {comparisonPeriodText}
                      </p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="actual" radius={[0, 6, 6, 0]} barSize={16}>
                {items.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-2 text-xs"
            title={`${item.name}: ${formatCOP(item.actual)} (${formatVariationCO(item.variation)} vs. ${comparisonPeriodText})`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-semibold text-slate-700">
                {item.name}
              </span>
              <span className="text-[10px] text-slate-400">
                ({item.share}%)
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-bold text-slate-900">
                {formatCOP(item.actual)}
              </span>
              <span
                className={`w-12 text-right text-[11px] font-bold ${
                  item.variation >= 0 ? "text-[#047857]" : "text-[#be123c]"
                }`}
              >
                {formatVariationCO(item.variation)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
