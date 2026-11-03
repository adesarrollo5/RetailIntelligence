import { useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import {
  colombiaOutlinePath,
  getMunicipality,
  MAP_H,
  MAP_W,
  mapContextLabels,
  project,
} from "../../data/colombiaGeo"
import { formatCOP, formatNumberCO } from "../../utils/formatters"

export type MapPoint = {
  muniCode: string
  stores: number
  sales: number
}

type Props = {
  points: MapPoint[]
  selectedMuniCode: string
  onSelect: (muniCode: string) => void
  storeLabelPlural: string
  periodLabel: string
}

function compactCOP(value: number): string {
  if (value >= 1e9)
    return `$ ${(value / 1e9).toFixed(1).replace(".", ",")} mil M`
  if (value >= 1e6) return `$ ${Math.round(value / 1e6)} M`
  return formatCOP(value)
}

export function ColombiaMap({
  points,
  selectedMuniCode,
  onSelect,
  storeLabelPlural,
  periodLabel,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const prepared = useMemo(() => {
    const maxSales = Math.max(1, ...points.map((p) => p.sales))
    return points
      .map((p) => {
        const muni = getMunicipality(p.muniCode)
        if (!muni) return null
        const pos = project(muni.lat, muni.lng)
        const r = 5 + 19 * Math.sqrt(p.sales / maxSales)
        return { ...p, muni, pos, r }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.r - a.r)
  }, [points])

  const hover = prepared.find((p) => p.muniCode === hovered)
  const topLabels = new Set(
    [...prepared]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 9)
      .map((p) => p.muniCode),
  )

  const graticule: React.ReactNode[] = []
  for (let lat = -4; lat <= 12; lat += 2) {
    const y = project(lat, -79).y
    graticule.push(<line key={`la${lat}`} x1={0} x2={MAP_W} y1={y} y2={y} />)
  }
  for (let lng = -78; lng <= -67; lng += 2) {
    const x = project(0, lng).x
    graticule.push(<line key={`lo${lng}`} x1={x} x2={x} y1={0} y2={MAP_H} />)
  }

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="img"
        aria-label={`Mapa simplificado de Colombia con ${prepared.length} ciudades con ${storeLabelPlural.toLowerCase()}`}
        className="mx-auto block h-auto max-h-[640px] w-full"
      >
        <rect width={MAP_W} height={MAP_H} rx={14} fill="#f1f5f9" />
        <g stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 5">
          {graticule}
        </g>
        {mapContextLabels.map((l) => {
          const p = project(l.lat, l.lng)
          return (
            <text
              key={l.text}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize={11}
              fontStyle="italic"
              fill="#94a3b8"
            >
              {l.text}
            </text>
          )
        })}
        <path
          d={colombiaOutlinePath}
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={colombiaOutlinePath}
          fill="var(--brand-soft)"
          opacity={0.45}
          strokeLinejoin="round"
        />

        {prepared.map((p) => {
          const selected = selectedMuniCode === p.muniCode
          const active = hovered === p.muniCode
          return (
            <g
              key={p.muniCode}
              tabIndex={0}
              role="button"
              aria-label={`${p.muni.name}: ${p.stores} ${storeLabelPlural.toLowerCase()}, ${formatCOP(p.sales)} en ventas`}
              aria-pressed={selected}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHovered(p.muniCode)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(p.muniCode)}
              onBlur={() => setHovered(null)}
              onClick={() => onSelect(selected ? "" : p.muniCode)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(selected ? "" : p.muniCode)
                }
              }}
            >
              <circle
                cx={p.pos.x}
                cy={p.pos.y}
                r={p.r + (active ? 3 : 0)}
                fill="var(--brand)"
                fillOpacity={selected ? 0.85 : 0.5}
                stroke={selected ? "var(--brand-dark)" : "var(--brand)"}
                strokeWidth={selected ? 3 : 1.5}
              />
              <circle
                cx={p.pos.x}
                cy={p.pos.y}
                r={2.2}
                fill="#ffffff"
                pointerEvents="none"
              />
              {(topLabels.has(p.muniCode) || selected || active) && (
                <text
                  x={p.pos.x + p.r + 5}
                  y={p.pos.y + 4}
                  fontSize={12}
                  fontWeight={700}
                  fill="#0f172a"
                  stroke="#ffffff"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {p.muni.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 w-52 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl"
          style={{
            left: `${Math.min(80, Math.max(20, (hover.pos.x / MAP_W) * 100))}%`,
            top: `${(hover.pos.y / MAP_H) * 100 - 1.5}%`,
          }}
        >
          <p className="flex items-center gap-1.5 font-bold text-slate-900">
            <MapPin className="size-3.5 text-[var(--brand)]" />
            {hover.muni.name}
          </p>
          <p className="mt-1.5 text-slate-500">
            {formatNumberCO(hover.stores)} {storeLabelPlural.toLowerCase()}
          </p>
          <p className="font-bold text-slate-900">{formatCOP(hover.sales)}</p>
          <p className="text-[10px] text-slate-400">
            Ventas netas · {periodLabel}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-end gap-1">
            <span className="size-2.5 rounded-full bg-[var(--brand)]/50 ring-1 ring-[var(--brand)]" />
            <span className="size-4 rounded-full bg-[var(--brand)]/50 ring-1 ring-[var(--brand)]" />
            <span className="size-6 rounded-full bg-[var(--brand)]/50 ring-1 ring-[var(--brand)]" />
          </span>
          Tamaño según ventas netas
        </div>
        <span>{prepared.length} ciudades · clic para filtrar</span>
      </div>
      <p className="sr-only">
        {prepared
          .map((p) => `${p.muni.name}: ${compactCOP(p.sales)}`)
          .join("; ")}
      </p>
    </div>
  )
}
