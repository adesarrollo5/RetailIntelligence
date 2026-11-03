import { useState } from "react"
import { ArrowDownRight, ArrowUpRight, Flame } from "lucide-react"
import {
  commercialHours,
  getWeekDaysOrder,
  type HeatmapCell,
} from "../data/analyticsData"
import {
  formatCOP,
  formatNumberCO,
  formatVariationCO,
} from "../utils/formatters"

type Props = {
  title: string
  subtitle: string
  cells: HeatmapCell[]
  weekStartsOn: "Lunes" | "Domingo"
  valueKind: "currency" | "visitors"
  unitLabel: string
  comparisonPeriodText: string
  brandColor: string
}

export function AnalyticsHeatmap({
  title,
  subtitle,
  cells,
  weekStartsOn,
  valueKind,
  unitLabel,
  comparisonPeriodText,
  brandColor,
}: Props) {
  const days = getWeekDaysOrder(weekStartsOn)
  const values = cells.map((c) => c.value)
  const maxVal = Math.max(1, ...values)
  const minVal = Math.min(...values)

  const peakCell =
    cells.reduce(
      (best, cur) => (cur.value > best.value ? cur : best),
      cells[0],
    ) ?? cells[0]

  const [hovered, setHovered] = useState<HeatmapCell>(peakCell)

  const formatValue = (val: number) =>
    valueKind === "currency"
      ? formatCOP(val)
      : `${formatNumberCO(val)} ${unitLabel.toLowerCase()}`

  const getIntensity = (val: number) => {
    if (maxVal === minVal) return 0.5
    return Math.max(0.1, Math.min(1, (val - minVal) / (maxVal - minVal)))
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Flame className="size-4 text-[var(--brand)]" />
            {title}
          </h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        {hovered && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-xs shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                {hovered.day} · {hovered.hour}
              </span>
              <strong className="text-sm font-bold text-slate-950">
                {formatValue(hovered.value)}
              </strong>
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  hovered.variation >= 0 ? "text-[#047857]" : "text-[#be123c]"
                }`}
              >
                {hovered.variation >= 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {formatVariationCO(hovered.variation)}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Comparado ({formatValue(hovered.comparison)}) ·{" "}
              <strong>{comparisonPeriodText}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[660px]">
          <div className="mb-1.5 grid grid-cols-[54px_repeat(12,minmax(0,1fr))] gap-1.5 text-center text-[10px] font-bold text-slate-400">
            <span className="text-left">Día</span>
            {commercialHours.map((hr) => (
              <span key={hr}>{hr}</span>
            ))}
          </div>

          <div className="space-y-1.5">
            {days.map((day) => (
              <div
                key={day}
                className="grid grid-cols-[54px_repeat(12,minmax(0,1fr))] items-center gap-1.5"
              >
                <span className="text-xs font-bold text-slate-700">{day}</span>
                {commercialHours.map((hour) => {
                  const cell = cells.find(
                    (c) => c.day === day && c.hour === hour,
                  )
                  if (!cell) return <span key={hour} />
                  const intensity = getIntensity(cell.value)
                  const isSelected =
                    hovered?.day === cell.day && hovered?.hour === cell.hour
                  return (
                    <button
                      key={hour}
                      type="button"
                      onMouseEnter={() => setHovered(cell)}
                      onFocus={() => setHovered(cell)}
                      onClick={() => setHovered(cell)}
                      title={`${cell.day} ${cell.hour}: ${formatValue(cell.value)} (${formatVariationCO(cell.variation)} vs. ${comparisonPeriodText})`}
                      className={`h-8 rounded-md border transition ${
                        isSelected
                          ? "ring-2 ring-slate-900 border-white"
                          : "border-transparent hover:border-slate-400"
                      }`}
                      style={{
                        backgroundColor: brandColor,
                        opacity: Number((0.12 + intensity * 0.88).toFixed(2)),
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span>
              Pase el cursor o toque cualquier celda para ver{" "}
              <strong>valor, variación y periodo de comparación</strong>.
            </span>
            <div className="flex items-center gap-1.5">
              <span>Menor actividad</span>
              {[0.18, 0.36, 0.56, 0.78, 1].map((op) => (
                <span
                  key={op}
                  className="inline-block size-3 rounded-xs"
                  style={{ backgroundColor: brandColor, opacity: op }}
                />
              ))}
              <span>Hora pico</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
