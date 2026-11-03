import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronLeft,
  CircleGauge,
  FileBarChart,
  GitCompareArrows,
  Goal,
  LayoutDashboard,
  Lock,
  PlugZap,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react"
import type { Client, PageId, Plan, Role, RoleDefinition } from "../types"
import { pagePlan, planRank, rolePages } from "../data/demo"
import { BrandMark } from "./BrandMark"

type Item = {
  id: PageId
  label: string
  icon: LucideIcon
  minPlan?: Plan
}
const mainItems: Item[] = [
  { id: "inicio", label: "Inicio", icon: LayoutDashboard },
  { id: "tiendas", label: "Tiendas", icon: Store },
  { id: "integraciones", label: "Integraciones", icon: PlugZap },
]
const analysisItems: Item[] = [
  { id: "ventas", label: "Ventas", icon: BarChart3 },
  { id: "inventario", label: "Inventario", icon: Boxes },
  { id: "productos", label: "Productos", icon: ShoppingBag },
  { id: "trafico", label: "Tráfico y conversión", icon: CircleGauge },
  { id: "comparativos", label: "Comparativos", icon: GitCompareArrows },
  { id: "metas", label: "Metas", icon: Goal },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "reportes", label: "Reportes", icon: FileBarChart },
]
const manageItems: Item[] = [
  { id: "usuarios", label: "Usuarios y roles", icon: Users },
  { id: "configuracion", label: "Configuración", icon: Settings },
]

type Props = {
  client: Client
  role: Role
  roles: RoleDefinition[]
  page: PageId
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onCloseMobile: () => void
  onNavigate: (page: PageId) => void
  onOpenDemo: () => void
}

export function Sidebar(props: Props) {
  const dynamicMainItems: Item[] = mainItems.map((it) =>
    it.id === "tiendas"
      ? { ...it, label: props.client.terminology.storePlural }
      : it,
  )
  const dynamicAnalysisItems: Item[] = analysisItems.map((it) =>
    it.id === "trafico"
      ? {
          ...it,
          label: `${props.client.terminology.visitorsLabel} y conversión`,
        }
      : it,
  )

  const canSee = (item: Item) => {
    if (item.id === "usuarios" || item.id === "configuracion") {
      return props.role === "Administrador"
    }
    const isExtraEnabled = Boolean(props.client.extraModules?.includes(item.id))
    const roleDef = props.roles.find((r) => r.name === props.role)
    if (roleDef) {
      const permission = Boolean(roleDef.permissions[item.id]?.ver)
      if (item.id === "trafico") return permission
      const needed = item.minPlan || pagePlan[item.id]
      return (
        permission &&
        (!needed ||
          isExtraEnabled ||
          planRank[props.client.plan] >= planRank[needed])
      )
    }
    const allowed = rolePages[props.role]
    const permission =
      allowed === "all" || (Array.isArray(allowed) && allowed.includes(item.id))
    if (item.id === "trafico") return permission
    const needed = item.minPlan || pagePlan[item.id]
    return (
      permission &&
      (!needed ||
        isExtraEnabled ||
        planRank[props.client.plan] >= planRank[needed])
    )
  }
  const navGroup = (title: string, items: Item[]) => {
    const visible = items.filter(canSee)
    if (visible.length === 0) return null
    return (
      <div className="mb-5">
        {!props.collapsed && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>
        )}
        <div className="space-y-1">
          {visible.map((item) => {
            const Icon = item.icon
            const active = props.page === item.id
            const needed = item.minPlan || pagePlan[item.id]
            const isExtraEnabled = Boolean(
              props.client.extraModules?.includes(item.id),
            )
            const isPlanLocked =
              Boolean(needed) &&
              !isExtraEnabled &&
              planRank[props.client.plan] < planRank[(needed as Plan)]
            return (
              <button
                key={item.id}
                title={props.collapsed ? item.label : undefined}
                onClick={() => {
                  props.onNavigate(item.id)
                  props.onCloseMobile()
                }}
                className={`nav-item ${active ? "nav-item-active" : ""} ${
                  props.collapsed ? "justify-center px-0" : ""
                }`}
              >
                <Icon
                  className="size-[18px] shrink-0"
                  strokeWidth={active ? 2.3 : 1.8}
                />
                {!props.collapsed && (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
                    <span className="truncate">{item.label}</span>
                    {isPlanLocked && (
                      <Lock className="size-3 shrink-0 text-amber-600" />
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {props.mobileOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={props.onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex border-r border-slate-200 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen ${
          props.collapsed ? "lg:w-[76px]" : "lg:w-[244px]"
        } ${
          props.mobileOpen
            ? "w-[270px] translate-x-0"
            : "w-[270px] -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={`flex h-[72px] items-center border-b border-slate-100 ${
              props.collapsed ? "justify-center px-2" : "justify-between px-5"
            }`}
          >
            <BrandMark client={props.client} compact={props.collapsed} />
            <button
              className="text-slate-400 lg:hidden"
              onClick={props.onCloseMobile}
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
            {navGroup("General", dynamicMainItems)}
            {navGroup("Analítica", dynamicAnalysisItems)}
            {navGroup("Administración", manageItems)}
          </nav>
          <div className="border-t border-slate-100 p-3">
            <button
              onClick={props.onOpenDemo}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl bg-slate-50 p-2.5 text-left hover:bg-slate-100 ${
                props.collapsed ? "justify-center" : ""
              }`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
                <Building2 className="size-4" />
              </span>
              {!props.collapsed && (
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-700">
                    Cambiar vista demo
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {props.role}
                  </span>
                </span>
              )}
            </button>
            <button
              onClick={props.onCollapse}
              className="hidden w-full items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:flex"
            >
              <ChevronLeft
                className={`size-4 transition-transform ${
                  props.collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
