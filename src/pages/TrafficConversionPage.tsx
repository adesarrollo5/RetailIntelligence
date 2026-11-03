import { useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleGauge,
  Clock,
  DoorOpen,
  Download,
  Footprints,
  Layers,
  Lock,
  Sparkles,
  Store,
} from "lucide-react"
import { AnalyticsHeatmap } from "../components/AnalyticsHeatmap"
import {
  ModuleStateFeedback,
  ModuleStateSwitcher,
} from "../components/ModuleStateControls"
import {
  buildTrafficAnalytics,
  getComparisonPeriodText,
  getPeriodMeta,
} from "../data/analyticsData"
import { planRank } from "../data/demo"
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
  onSwitchToPlaza?: () => void
  onOpenPlanSettings?: () => void
}

export function TrafficConversionPage({
  client,
  filters,
  onSwitchToPlaza,
  onOpenPlanSettings,
}: Props) {
  const [dataState, setDataState] = useState<ModuleDataState>("ready")
  const terms = client.terminology
  const periodMeta = getPeriodMeta(filters.periodId)
  const comparisonPeriodText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )

  const isLockedByPlan =
    planRank[client.plan] < planRank.Avanzado &&
    !client.extraModules?.includes("trafico")

  if (isLockedByPlan) {
    return (
      <div className="page-wrap space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <Lock className="size-3.5" /> Disponible en plan Avanzado
            </span>
            <h1 className="page-title mt-2">
              {terms.visitorsLabel} y conversión
            </h1>
            <p className="page-subtitle">
              Cruce de contadores de personas con{" "}
              {terms.transactionPlural.toLowerCase()} del POS en {client.name}{" "}
              (Plan actual: {client.plan}).
            </p>
          </div>
        </div>

        <section className="card relative overflow-hidden p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none opacity-25 blur-[2px]"
          >
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                `${terms.visitorsLabel}: 94.850`,
                "Conversión: 19,6%",
                `Venta por ${terms.visitorsLabel.toLowerCase()}: $ 22.649`,
                "Hora pico: 17:00 — 18:00",
              ].map((fake) => (
                <div
                  key={fake}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="h-3 w-24 rounded bg-slate-300" />
                  <p className="mt-3 text-lg font-bold text-slate-700">
                    {fake}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 h-52 rounded-xl border border-slate-200 bg-slate-100" />
          </div>

          <div className="relative mx-auto -mt-56 max-w-xl rounded-2xl border border-amber-200 bg-white/95 p-7 text-center shadow-xl backdrop-blur-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
              <Lock className="size-7" />
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              <Lock className="size-3.5" /> Disponible en plan Avanzado
            </span>
            <h2 className="mt-3 text-xl font-bold text-slate-950">
              Módulo de {terms.visitorsLabel} y conversión bloqueado en el plan{" "}
              {client.plan}
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              <strong>{client.name}</strong> cuenta actualmente con el plan{" "}
              <strong>{client.plan}</strong>. Actualice al{" "}
              <strong>plan Avanzado</strong> para integrar cámaras y sensores de
              conteo peatonal, medir la tasa de conversión (
              {terms.transactionPlural.toLowerCase()} ÷{" "}
              {terms.visitorsLabel.toLowerCase()}), venta por visitante y mapas
              de calor horarios.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {onSwitchToPlaza && (
                <button
                  type="button"
                  onClick={onSwitchToPlaza}
                  className="primary-button"
                >
                  <Building2 className="size-4" /> Ver en Grupo Plaza Andina
                  (Plan Avanzado)
                </button>
              )}
              {onOpenPlanSettings && (
                <button
                  type="button"
                  onClick={onOpenPlanSettings}
                  className="secondary-button"
                >
                  <Sparkles className="size-4" /> Simular plan Avanzado en
                  Configuración
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    )
  }

  const analytics = buildTrafficAnalytics(
    client,
    filters.scope,
    filters.periodId,
    filters.compareMode,
  )

  const isOperator = client.type === "operator"

  return (
    <div className="page-wrap space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
            <Layers className="size-3.5" />
            Alcance: <strong>{filters.scope}</strong> · Periodo:{" "}
            <strong>{periodMeta.label}</strong>
          </p>
          <h1 className="page-title">
            {terms.visitorsLabel} y conversión comercial
          </h1>
          <p className="page-subtitle">
            Cruce de sensores de afluencia con{" "}
            {terms.transactionPlural.toLowerCase()} de POS · Comparado frente a{" "}
            <strong>{comparisonPeriodText}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ModuleStateSwitcher state={dataState} onChange={setDataState} />
          <button type="button" className="secondary-button">
            <Download className="size-4" /> Exportar afluencia
          </button>
        </div>
      </div>

      {dataState !== "ready" ? (
        <ModuleStateFeedback
          state={dataState}
          moduleLabel={`${terms.visitorsLabel} y conversión`}
          scopeLabel={filters.scope}
          periodLabel={periodMeta.label}
          onReset={() => setDataState("ready")}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
              className="card p-5"
              title={`${terms.visitorsLabel}: ${formatNumberCO(analytics.kpis.visitors.current)} (${formatVariationCO(analytics.kpis.visitors.variation)} vs. ${comparisonPeriodText})`}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  {terms.visitorsLabel} totales
                </p>
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Footprints className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                {formatNumberCO(analytics.kpis.visitors.current)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#047857]">
                  <ArrowUpRight className="size-3.5" />
                  {formatVariationCO(analytics.kpis.visitors.variation)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Ant: {formatNumberCO(analytics.kpis.visitors.comparison)}
                </span>
              </div>
            </article>

            <article
              className="card p-5"
              title={`Conversión (${terms.transactionPlural} ÷ ${terms.visitorsLabel}): ${formatDecimalCO(analytics.kpis.conversion.current, 1)}% (${formatVariationCO(analytics.kpis.conversion.variationPp, " pp")} vs. ${comparisonPeriodText})`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Conversión
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {terms.transactionPlural} ÷ {terms.visitorsLabel}
                  </p>
                </div>
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <CircleGauge className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                {formatDecimalCO(analytics.kpis.conversion.current, 1)}%
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#047857]">
                  <ArrowUpRight className="size-3.5" />
                  {formatVariationCO(
                    analytics.kpis.conversion.variationPp,
                    " pp",
                  )}{" "}
                  (
                  {formatVariationCO(
                    analytics.kpis.conversion.variationPercent,
                  )}
                  )
                </span>
                <span className="text-[11px] text-slate-400">
                  Ant:{" "}
                  {formatDecimalCO(analytics.kpis.conversion.comparison, 1)}%
                </span>
              </div>
            </article>

            <article
              className="card p-5"
              title={`Venta por visitante: ${formatCOP(analytics.kpis.salePerVisitor.current)} (${formatVariationCO(analytics.kpis.salePerVisitor.variation)} vs. ${comparisonPeriodText})`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Venta por {terms.visitorsLabel.toLowerCase()}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Ventas netas ÷ {terms.visitorsLabel}
                  </p>
                </div>
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Banknote className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                {formatCOP(analytics.kpis.salePerVisitor.current)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#047857]">
                  <ArrowUpRight className="size-3.5" />
                  {formatVariationCO(analytics.kpis.salePerVisitor.variation)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Ant: {formatCOP(analytics.kpis.salePerVisitor.comparison)}
                </span>
              </div>
            </article>

            <article
              className="card p-5"
              title={`Hora pico ${analytics.kpis.peakHour.slot}: ${formatNumberCO(analytics.kpis.peakHour.visitors)} ${terms.visitorsLabel.toLowerCase()} (${formatVariationCO(analytics.kpis.peakHour.variation)} vs. ${comparisonPeriodText})`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Hora pico de afluencia
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {analytics.kpis.peakHour.dayLabel}
                  </p>
                </div>
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Clock className="size-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                {analytics.kpis.peakHour.slot}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#047857]">
                  <ArrowUpRight className="size-3.5" />
                  {formatVariationCO(analytics.kpis.peakHour.variation)}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {formatNumberCO(analytics.kpis.peakHour.visitors)} en franja
                </span>
              </div>
            </article>
          </div>

          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="section-title">
                  Evolución combinada: {terms.visitorsLabel} (barras) y tasa de
                  conversión (línea)
                </h2>
                <p className="section-subtitle">
                  Comparado frente a <strong>{comparisonPeriodText}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <i
                    className="inline-block size-3 rounded-xs"
                    style={{ backgroundColor: client.color }}
                  />
                  {terms.visitorsLabel} (Barras)
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <i
                    className="inline-block h-0.5 w-3.5"
                    style={{ backgroundColor: client.accentColor }}
                  />
                  Conversión % (Línea)
                </span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.combinedSeries}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
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
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) => formatNumberCO(Number(v))}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    domain={[10, 24]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const pt = payload[0]
                        ?.payload as typeof analytics.combinedSeries[number] | undefined
                      if (!pt) return null
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl">
                          <p className="font-bold text-slate-900">
                            Fecha: {pt.label}/2025
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-5">
                              <span className="text-slate-500">
                                {terms.visitorsLabel}:
                              </span>
                              <span>
                                <strong>{formatNumberCO(pt.visitors)}</strong>{" "}
                                <em className="not-italic font-bold text-[#047857]">
                                  ({formatVariationCO(pt.visitorsVariation)})
                                </em>
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-5">
                              <span className="text-slate-500">
                                Conversión:
                              </span>
                              <span>
                                <strong>
                                  {formatDecimalCO(pt.conversion, 1)}%
                                </strong>{" "}
                                <em className="not-italic font-bold text-[#047857]">
                                  ({formatVariationCO(pt.conversionVariation)})
                                </em>
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                            Comparado con: {comparisonPeriodText}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="visitors"
                    fill={client.color}
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    stroke={client.accentColor}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: client.accentColor,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <AnalyticsHeatmap
            title={`Mapa de calor de ${terms.visitorsLabel.toLowerCase()} (Hora × Día de la semana)`}
            subtitle={`Afluencia horaria acumulada · Semana inicia en ${client.parameters.weekStartsOn.toLowerCase()}`}
            cells={analytics.visitorsHeatmap}
            weekStartsOn={client.parameters.weekStartsOn}
            valueKind="visitors"
            unitLabel={terms.visitorsLabel}
            comparisonPeriodText={comparisonPeriodText}
            brandColor={client.secondaryColor}
          />

          {isOperator && (
            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
              <section className="card p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="section-title flex items-center gap-2">
                      <DoorOpen className="size-4 text-[var(--brand)]" />
                      Tráfico por acceso o puerta del{" "}
                      {terms.mallSingular.toLowerCase()}
                    </h2>
                    <p className="section-subtitle">
                      Sensores cenitales en accesos peatonales y vehiculares
                    </p>
                  </div>
                  <span className="status-pill status-blue">5 accesos</span>
                </div>

                <div className="space-y-3.5">
                  {analytics.gatesTraffic.map((gate) => (
                    <div
                      key={gate.id}
                      className="rounded-xl border border-slate-200/90 p-3.5 transition hover:border-slate-300"
                      title={`${gate.name}: ${formatNumberCO(gate.visitors)} ${terms.visitorsLabel.toLowerCase()} (${formatVariationCO(gate.variation)} vs. ${comparisonPeriodText})`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {gate.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {gate.zone} · Acceso {gate.type.toLowerCase()}
                          </p>
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {gate.share}% del total
                        </span>
                      </div>

                      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${gate.share}%`,
                            backgroundColor: client.color,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {formatNumberCO(gate.visitors)}{" "}
                          {terms.visitorsLabel.toLowerCase()}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            gate.variation >= 0
                              ? "text-[#047857]"
                              : "text-[#be123c]"
                          }`}
                        >
                          {gate.variation >= 0 ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5" />
                          )}
                          {formatVariationCO(gate.variation)} vs. ant.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <h2 className="section-title flex items-center gap-2">
                    <Store className="size-4 text-[var(--brand)]" />
                    Tasa de captura por {terms.storeSingular.toLowerCase()} (
                    {terms.visitorsLabel.toLowerCase()} del{" "}
                    {terms.storeSingular.toLowerCase()} ÷{" "}
                    {terms.visitorsLabel.toLowerCase()} del{" "}
                    {terms.mallSingular.toLowerCase()})
                  </h2>
                  <p className="section-subtitle">
                    Mide qué porcentaje del flujo total del{" "}
                    {terms.mallSingular.toLowerCase()} logra atraer cada marca ·{" "}
                    {comparisonPeriodText}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{terms.storeSingular} / Marca</th>
                        <th>
                          {terms.visitorsLabel} del{" "}
                          {terms.storeSingular.toLowerCase()}
                        </th>
                        <th>Tasa de captura</th>
                        <th>Variación</th>
                        <th>Conversión interna</th>
                        <th>Venta / {terms.visitorsLabel.toLowerCase()}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.localCaptureRates.map((loc) => (
                        <tr
                          key={loc.id}
                          title={`${loc.localName}: Captura ${formatDecimalCO(loc.captureRate, 1)}% (${formatNumberCO(loc.localVisitors)} de ${formatNumberCO(loc.mallVisitors)} ${terms.visitorsLabel.toLowerCase()}) · ${comparisonPeriodText}`}
                        >
                          <td>
                            <strong>{loc.localName}</strong>
                            <span>
                              {loc.category} · {loc.zone}
                            </span>
                          </td>
                          <td className="font-semibold text-slate-700">
                            {formatNumberCO(loc.localVisitors)}
                            <span>
                              de {formatNumberCO(loc.mallVisitors)} en{" "}
                              {terms.mallSingular.toLowerCase()}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900">
                                {formatDecimalCO(loc.captureRate, 1)}%
                              </strong>
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, loc.captureRate * 5)}%`,
                                    backgroundColor: client.color,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex items-center gap-0.5 font-bold text-[#047857]">
                              <ArrowUpRight className="size-3.5" />
                              {formatVariationCO(loc.captureVariationPp, " pp")}
                            </span>
                          </td>
                          <td className="font-semibold text-slate-700">
                            {formatDecimalCO(loc.internalConversion, 1)}%
                          </td>
                          <td className="font-bold text-slate-900">
                            {formatCOP(loc.salesPerVisitor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
