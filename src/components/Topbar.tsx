import {
  Bell,
  CalendarDays,
  ChevronDown,
  HelpCircle,
  Menu,
  Search,
} from "lucide-react"
import { periodCatalog } from "../data/analyticsData"
import type {
  Client,
  CompareMode,
  GlobalFilters,
  PeriodId,
  Role,
} from "../types"

export function Topbar({
  client,
  role,
  filters,
  onChangeFilters,
  onMenu,
  onDemo,
}: {
  client: Client
  role: Role
  filters: GlobalFilters
  onChangeFilters: (next: GlobalFilters) => void
  onMenu: () => void
  onDemo: () => void
}) {
  const primaryScopeLabel =
    client.type === "operator"
      ? `Todos los ${client.terminology.mallPlural.toLowerCase()}`
      : `Todas las ${client.terminology.storePlural.toLowerCase()}`

  const scopeChoices = [primaryScopeLabel, ...client.scopeOptions.slice(1)]

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenu}
        className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {/* Selector global de alcance */}
        <div className="relative">
          <select
            aria-label="Selector global de alcance"
            value={
              scopeChoices.includes(filters.scope)
                ? filters.scope
                : primaryScopeLabel
            }
            onChange={(e) =>
              onChangeFilters({ ...filters, scope: e.target.value })
            }
            className="topbar-select max-w-[235px] appearance-none pr-7 cursor-pointer outline-none"
          >
            {scopeChoices.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Selector global de periodo */}
        <div className="relative hidden sm:flex items-center">
          <CalendarDays className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400" />
          <select
            aria-label="Selector global de periodo"
            value={filters.periodId}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                periodId: e.target.value as PeriodId,
              })
            }
            className="topbar-select appearance-none pl-8 pr-7 cursor-pointer outline-none"
          >
            {periodCatalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Selector global de comparación: vs. periodo anterior / vs. año anterior */}
        <div className="relative hidden md:flex items-center">
          <select
            aria-label="Modo de comparación"
            value={filters.compareMode}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                compareMode: e.target.value as CompareMode,
              })
            }
            className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-100/90 pl-2.5 pr-6 text-[11px] font-bold text-slate-600 outline-none hover:border-slate-300"
          >
            <option value="prev_period">vs. periodo anterior</option>
            <option value="prev_year">vs. año anterior</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      <div className="ml-3 flex items-center gap-1 sm:gap-2">
        <button className="topbar-icon hidden sm:grid">
          <Search className="size-[18px]" />
        </button>
        <button className="topbar-icon hidden sm:grid">
          <HelpCircle className="size-[18px]" />
        </button>
        <button className="topbar-icon relative">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <button
          onClick={onDemo}
          className="ml-1 flex items-center gap-2 rounded-xl py-1 pl-1 pr-1 sm:pr-2 hover:bg-slate-50"
        >
          <span
            className="grid size-9 place-items-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: client.color }}
          >
            {client.initials}
          </span>
          <span className="hidden text-left xl:block">
            <span className="block text-xs font-bold text-slate-700">
              Laura Gómez
            </span>
            <span className="block text-[10px] text-slate-400">{role}</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-slate-400 xl:block" />
        </button>
      </div>
    </header>
  )
}
