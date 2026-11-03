import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CalendarClock, Percent, Receipt, Ruler, Wallet } from "lucide-react"
import { KpiCard } from "../KpiCard"
import { EmptyPanel, OccupancyBadge, occupancyLabel } from "./StoreBadges"
import {
  getPeriodMeta,
  getComparisonPeriodText,
} from "../../data/analyticsData"
import {
  buildThirteenMonthTrend,
  getContractMetrics,
  OCCUPANCY_AMBER_MAX,
  OCCUPANCY_GREEN_MAX,
} from "../../data/storeAnalytics"
import { isoToDisplay, type StoreRecord } from "../../data/storesData"
import type { Client, GlobalFilters } from "../../types"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
} from "../../utils/formatters"

type Props = { client: Client; store: StoreRecord; filters: GlobalFilters }

const termStyle = {
  Vigente: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Por vencer": "bg-amber-50 text-amber-800 ring-amber-200",
  Vencido: "bg-rose-50 text-rose-700 ring-rose-200",
  "Por iniciar": "bg-sky-50 text-sky-700 ring-sky-200",
} as const

function expiryText(days: number): string {
  if (days < 0) return `Venció hace ${formatNumberCO(Math.abs(days))} días`
  if (days === 0) return "Vence hoy"
  if (days < 60) return `Vence en ${formatNumberCO(days)} días`
  return `Vence en ${formatDecimalCO(days / 30.4, 0)} meses`
}

export function StoreContractTab({ client, store, filters }: Props) {
  const c = getContractMetrics(store, filters.periodId, filters.compareMode)
  const period = getPeriodMeta(filters.periodId)
  const compText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )

  if (!c || !store.contract) {
    return (
      <EmptyPanel
        title="Sin contrato registrado"
        description={`No hay un contrato de arrendamiento asociado a ${store.name}. Regístrelo para calcular el costo de ocupación.`}
      />
    )
  }

  const deltaPp = Number((c.occupancyPct - c.compOccupancyPct).toFixed(1))
  const trend = buildThirteenMonthTrend(store).map((p) => ({
    label: p.label,
    pct:
      p.actual > 0
        ? Number(((store.contract!.monthlyRent / p.actual) * 100).toFixed(1))
        : null,
  }))
  const maxPct = Math.max(
    OCCUPANCY_AMBER_MAX + 4,
    ...trend.map((t) => t.pct ?? 0),
  )
  const yMax = Math.ceil(maxPct / 2) * 2

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Canon mensual"
          value={formatCOP(store.contract.monthlyRent)}
          change={`${formatCOP(c.rentPerSqm)} / m²`}
          positive
          detail={`${formatNumberCO(store.sqm)} m²`}
          icon={Wallet}
        />
        <KpiCard
          label={`Canon del periodo (${c.months} ${
            c.months === 1 ? "mes" : "meses"
          })`}
          value={formatCOP(c.rentPeriod)}
          change={period.shortLabel}
          positive
          detail={`vs ${formatCOP(c.compRentPeriod)}`}
          icon={Receipt}
        />
        <KpiCard
          label="Costo de ocupación"
          value={
            c.level === "nodata"
              ? "—"
              : `${formatDecimalCO(c.occupancyPct, 1)} %`
          }
          change={
            c.level === "nodata"
              ? "Sin ventas"
              : `${deltaPp > 0 ? "+" : ""}${formatDecimalCO(deltaPp, 1)} pp`
          }
          positive={deltaPp <= 0}
          detail={`vs ${formatDecimalCO(c.compOccupancyPct, 1)} %`}
          icon={Percent}
        />
        <KpiCard
          label="Vigencia"
          value={c.termStatus}
          change={expiryText(c.daysToExpiry)}
          positive={
            c.termStatus === "Vigente" || c.termStatus === "Por iniciar"
          }
          detail={`hasta ${isoToDisplay(store.contract.end)}`}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <section className="card p-5 sm:p-6 xl:col-span-2">
          <h2 className="section-title">Semáforo de ocupación</h2>
          <p className="section-subtitle">
            Costo de ocupación = canon del periodo ÷ ventas netas del periodo
          </p>

          <div className="mt-5 flex items-center gap-4">
            <OccupancyBadge level={c.level} pct={c.occupancyPct} showLabel />
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Canon del periodo</span>
              <strong className="text-slate-800">
                {formatCOP(c.rentPeriod)}
              </strong>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">÷ Ventas netas</span>
              <strong className="text-slate-800">
                {c.netSales > 0 ? formatCOP(c.netSales) : "Sin ventas"}
              </strong>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-600">
                = Costo de ocupación
              </span>
              <strong className="text-sm text-slate-900">
                {c.level === "nodata"
                  ? "—"
                  : `${formatDecimalCO(c.occupancyPct, 1)} %`}
              </strong>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Comparación: {compText}
            </p>
          </div>

          <ul className="mt-5 space-y-2 text-xs">
            {([
              ["ok", `Hasta ${OCCUPANCY_GREEN_MAX} %`],
              [
                "warn",
                `Más de ${OCCUPANCY_GREEN_MAX} % y hasta ${OCCUPANCY_AMBER_MAX} %`,
              ],
              ["high", `Más de ${OCCUPANCY_AMBER_MAX} %`],
            ] as const).map(([lvl, range]) => (
              <li
                key={lvl}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  c.level === lvl
                    ? "border-slate-300 bg-white shadow-sm"
                    : "border-transparent"
                }`}
              >
                <OccupancyBadge level={lvl} showLabel />
                <span className="text-slate-500">{range}</span>
              </li>
            ))}
          </ul>
          {c.level === "high" && (
            <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800">
              El canon supera el {OCCUPANCY_AMBER_MAX} % de las ventas. Revise
              la renegociación o un esquema de canon variable con esta{" "}
              {client.terminology.storeSingular.toLowerCase()}.
            </p>
          )}
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-3">
          <h2 className="section-title">
            Costo de ocupación · últimos 13 meses
          </h2>
          <p className="section-subtitle mb-3">
            Canon mensual vigente ÷ ventas netas de cada mes
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              >
                <ReferenceArea
                  y1={0}
                  y2={OCCUPANCY_GREEN_MAX}
                  fill="#10b981"
                  fillOpacity={0.07}
                />
                <ReferenceArea
                  y1={OCCUPANCY_GREEN_MAX}
                  y2={OCCUPANCY_AMBER_MAX}
                  fill="#f59e0b"
                  fillOpacity={0.09}
                />
                <ReferenceArea
                  y1={OCCUPANCY_AMBER_MAX}
                  y2={yMax}
                  fill="#f43f5e"
                  fillOpacity={0.07}
                />
                <CartesianGrid
                  stroke="#edf0f4"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  interval={1}
                />
                <YAxis
                  domain={[0, yMax]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => `${v} %`}
                  width={42}
                />
                <ReferenceLine
                  y={OCCUPANCY_GREEN_MAX}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={OCCUPANCY_AMBER_MAX}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                />
                <Tooltip
                  formatter={(v) => [
                    `${formatDecimalCO(Number(v), 1)} %`,
                    "Costo de ocupación",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke={client.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: client.color, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Condiciones del contrato</h2>
            <p className="section-subtitle">
              Arrendamiento de {store.name} · {store.parent}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${termStyle[c.termStatus]}`}
          >
            {c.termStatus}
          </span>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Inicio · {isoToDisplay(store.contract.start)}</span>
            <span>Fin · {isoToDisplay(store.contract.end)}</span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={Math.round(c.elapsedPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la vigencia del contrato"
          >
            <div
              className={`h-full rounded-full ${
                c.termStatus === "Vencido"
                  ? "bg-rose-500"
                  : c.termStatus === "Por vencer"
                    ? "bg-amber-500"
                    : "bg-[var(--brand)]"
              }`}
              style={{ width: `${c.elapsedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatDecimalCO(c.elapsedPct, 0)} % de la vigencia transcurrida ·{" "}
            {expiryText(c.daysToExpiry)}
          </p>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Canon mensual", formatCOP(store.contract.monthlyRent)],
            ["Canon por m²", `${formatCOP(c.rentPerSqm)} / m²`],
            ["Ajuste del canon", store.contract.adjustment],
            [
              "Duración total",
              `${formatDecimalCO(c.totalDays / 30.4, 0)} meses`,
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="flex items-center gap-1 text-[11px] text-slate-400">
                {k === "Canon por m²" && <Ruler className="size-3" />}
                {k}
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[11px] text-slate-400">
          Estado actual del semáforo: {occupancyLabel(c.level)}. Los datos
          contractuales son confidenciales del operador y no se muestran a las
          marcas arrendatarias.
        </p>
      </section>
    </div>
  )
}
