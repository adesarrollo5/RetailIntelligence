import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

type Props = {
  label: string
  value: string
  change: string
  positive?: boolean
  detail: string
  icon: LucideIcon
}

export function KpiCard({
  label,
  value,
  change,
  positive = true,
  detail,
  icon: Icon,
}: Props) {
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-[25px] font-bold tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-bold ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {change}
        </span>
        <span className="text-[11px] text-slate-400">{detail}</span>
      </div>
    </article>
  )
}
