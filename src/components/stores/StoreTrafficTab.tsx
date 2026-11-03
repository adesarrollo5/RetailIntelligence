import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Clock, DoorOpen, Lock, Percent, Users, Wallet } from "lucide-react"
import { AnalyticsHeatmap } from "../AnalyticsHeatmap"
import { KpiCard } from "../KpiCard"
import { EmptyPanel } from "./StoreBadges"
import {
  getComparisonPeriodText,
  getPeriodMeta,
} from "../../data/analyticsData"
import { planRank } from "../../data/demo"
import {
  buildHourDayHeatmap,
  buildStoreTraffic,
  getStoreMetrics,
} from "../../data/storeAnalytics"
import type { StoreRecord } from "../../data/storesData"
import type { Client, GlobalFilters } from "../../types"
import {
  calcVariationPercent,
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
  formatVariationCO,
} from "../../utils/formatters"

const MALL_SHARE: Record<string, number> = {
  "Plaza Andina Bogotá": 0.42,
  "Plaza Andina Medellín": 0.33,
  "Plaza Andina Cali": 0.25,
}

export function isTrafficLocked(client: Client): boolean {
  return (
    planRank[client.plan] < planRank.Avanzado &&
    !client.extraModules?.includes("trafico")
  )
}

export function StoreTrafficTab({
  client,
  store,
  filters,
  onOpenPlan,
}: {
  client: Client
  store: StoreRecord
  filters: GlobalFilters
  onOpenPlan?: () => void
}) {
  const terms = client.terminology
  const period = getPeriodMeta(filters.periodId)
  const compText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )

  if (isTrafficLocked(client)) {
    return (
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none opacity-25 blur-[2px]"
        >
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              `${terms.visitorsLabel}: 5.420`,
              "Conversión: 17,8%",
              "Hora pico: 17:00",
              "Permanencia: 14 min",
            ].map((t) => (
              <div
                key={t}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="h-3 w-20 rounded bg-slate-300" />
                <p className="mt-3 text-lg font-bold text-slate-700">{t}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-40 rounded-xl border border-slate-200 bg-slate-100" />
        </div>
        <div className="relative mx-auto -mt-44 max-w-lg rounded-2xl border border-amber-200 bg-white/95 p-7 text-center shadow-xl backdrop-blur-md">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <Lock className="size-6" />
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <Lock className="size-3.5" /> Disponible en plan Avanzado
          </span>
          <h3 className="mt-3 text-lg font-bold text-slate-950">
            Tráfico por {terms.storeSingular.toLowerCase()} bloqueado en el plan{" "}
            {client.plan}
          </h3>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            Actualice al plan Avanzado para integrar contadores de personas y
            medir {terms.visitorsLabel.toLowerCase()}, conversión y venta por
            visitante de cada {terms.storeSingular.toLowerCase()}.
          </p>
          {onOpenPlan && (
            <button
              type="button"
              className="primary-button mt-4"
              onClick={onOpenPlan}
            >
              Ver plan y módulos
            </button>
          )}
        </div>
      </section>
    )
  }

  const m = getStoreMetrics(store, filters.periodId, filters.compareMode)
  if (!store.hasCounter || !m.hasData) {
    return (
      <EmptyPanel
        title="Sin contador de personas"
        description={`${store.name} no tiene un contador de personas activo para ${period.shortLabel}. Instale o reconecte el sensor para medir ${terms.visitorsLabel.toLowerCase()} y conversión.`}
      />
    )
  }

  const t = buildStoreTraffic(
    store,
    filters.periodId,
    filters.compareMode,
    client.parameters.weekStartsOn,
    MALL_SHARE[store.parent] ?? 0.3,
  )
  const heat = buildHourDayHeatmap(
    store,
    t.visitors,
    client.parameters.weekStartsOn,
    "visitors",
    filters.compareMode,
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={terms.visitorsLabel}
          value={formatNumberCO(t.visitors)}
          change={formatVariationCO(
            calcVariationPercent(t.visitors, t.compVisitors),
          )}
          positive={t.visitors >= t.compVisitors}
          detail={`vs ${formatNumberCO(t.compVisitors)}`}
          icon={Users}
        />
        <KpiCard
          label="Tasa de conversión"
          value={`${formatDecimalCO(t.conversion, 1)}%`}
          change={`${
            m.conversionDeltaPp >= 0 ? "+" : ""
          }${formatDecimalCO(m.conversionDeltaPp, 1)} pp`}
          positive={m.conversionDeltaPp >= 0}
          detail={`vs ${formatDecimalCO(m.compConversion, 1)}%`}
          icon={Percent}
        />
        <KpiCard
          label={`Venta por ${terms.visitorsLabel.toLowerCase().replace(/s$/, "")}`}
          value={formatCOP(t.salesPerVisitor)}
          change={formatVariationCO(
            calcVariationPercent(
              t.salesPerVisitor,
              m.compVisitors
                ? Math.round(m.comparisonSales / m.compVisitors)
                : 0,
            ),
          )}
          positive
          detail="ventas ÷ visitantes"
          icon={Wallet}
        />
        {client.type === "operator" && (
          <KpiCard
            label={`Tasa de captura del ${terms.mallSingular.toLowerCase()}`}
            value={`${formatDecimalCO(t.captureRate, 2)}%`}
            change={`${
              t.captureRate - t.compCaptureRate >= 0 ? "+" : ""
            }${formatDecimalCO(t.captureRate - t.compCaptureRate, 2)} pp`}
            positive={t.captureRate >= t.compCaptureRate}
            detail={`de ${formatNumberCO(t.mallVisitors)} visitantes`}
            icon={DoorOpen}
          />
        )}
        <KpiCard
          label="Hora pico"
          value={t.peakHour}
          change="Mayor afluencia"
          positive
          detail={`${store.schedule.days}`}
          icon={Clock}
        />
        <KpiCard
          label="Permanencia promedio"
          value={`${t.dwellMinutes} min`}
          change="Dentro del local"
          positive
          detail={period.shortLabel}
          icon={Clock}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Afluencia por hora</h2>
          <p className="section-subtitle mb-3">Suma del periodo seleccionado</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t.byHour} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid
                  stroke="#edf0f4"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => formatNumberCO(Number(v))}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v) => `${formatNumberCO(Number(v))} visitantes`}
                />
                <Bar
                  dataKey="visitors"
                  name="Visitantes"
                  fill={client.color}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="section-title">Afluencia por día de la semana</h2>
          <p className="section-subtitle mb-3">Suma del periodo seleccionado</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t.byDay} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid
                  stroke="#edf0f4"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => formatNumberCO(Number(v))}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v) => `${formatNumberCO(Number(v))} visitantes`}
                />
                <Bar
                  dataKey="visitors"
                  name="Visitantes"
                  fill={client.secondaryColor}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <AnalyticsHeatmap
        title={`Mapa de calor: ${terms.visitorsLabel.toLowerCase()} por hora y día`}
        subtitle={`Contador de personas de ${store.name}`}
        cells={heat}
        weekStartsOn={client.parameters.weekStartsOn}
        valueKind="visitors"
        unitLabel={terms.visitorsLabel}
        comparisonPeriodText={compText}
        brandColor={client.color}
      />
    </div>
  )
}
