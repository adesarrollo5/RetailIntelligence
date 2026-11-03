import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { SeriesPoint } from "../../data/storeAnalytics"
import {
  calcVariationPercent,
  formatCOP,
  formatNumberCO,
  formatVariationCO,
} from "../../utils/formatters"

type Props = {
  data: SeriesPoint[]
  color: string
  gradientId: string
  height?: number
  valueKind?: "currency" | "number"
  unitLabel?: string
  comparisonText: string
}

export function StoreTrendChart({
  data,
  color,
  gradientId,
  height = 280,
  valueKind = "currency",
  unitLabel = "",
  comparisonText,
}: Props) {
  const fmt = (v: number) =>
    valueKind === "currency"
      ? formatCOP(v)
      : `${formatNumberCO(v)} ${unitLabel}`
  const tick = (v: number) => {
    if (valueKind === "number") return formatNumberCO(v)
    if (v >= 1e9) return `$ ${(v / 1e9).toFixed(1).replace(".", ",")} mil M`
    return `$ ${formatNumberCO(Math.round(v / 1e6))} M`
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
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
            interval="preserveStartEnd"
            minTickGap={14}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={valueKind === "currency" ? 70 : 52}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v) => tick(Number(v))}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]?.payload as SeriesPoint | undefined
              if (!p) return null
              const variation = calcVariationPercent(p.actual, p.comparison)
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xl">
                  <p className="font-bold text-slate-900">{p.label}</p>
                  <div className="mt-2 space-y-1">
                    <p className="flex justify-between gap-4">
                      <span className="text-slate-500">Actual:</span>
                      <strong className="text-slate-900">
                        {fmt(p.actual)}
                      </strong>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-slate-500">Comparación:</span>
                      <span className="font-semibold text-slate-700">
                        {fmt(p.comparison)}
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-slate-500">Variación:</span>
                      <span
                        className={`font-bold ${
                          variation >= 0 ? "text-[#047857]" : "text-[#be123c]"
                        }`}
                      >
                        {formatVariationCO(variation)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                    {comparisonText}
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
            stroke={color}
            strokeWidth={2.6}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
