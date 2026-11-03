import { useMemo, useState } from "react"
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  Layers,
  LogOut,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react"
import { colombianHolidays2025, pagePlan, planRank } from "../data/demo"
import {
  planSummaryMeta,
  platformPlanComparisonRows,
} from "../data/platformData"
import type {
  Client,
  ClientId,
  PageId,
  Plan,
  PlatformAuditCategory,
  PlatformAuditEntry,
  PlatformIntegrationSource,
  PlatformIntegrationStatus,
  TenantUser,
} from "../types"
import { darkenHex, softTintHex } from "../utils/contrast"

type ConsoleSection = "clientes" | "planes" | "integraciones" | "auditoria"

type Props = {
  platformRole: "Super Admin" | "Soporte"
  onChangePlatformRole: (role: "Super Admin" | "Soporte") => void
  clientsMap: Record<ClientId, Client>
  usersByClient: Record<ClientId, TenantUser[]>
  integrations: PlatformIntegrationSource[]
  auditLogs: PlatformAuditEntry[]
  onCreateClient: (
    newClient: Client,
    initialAdmin: {
      name: string
      email: string
      title: string
    },
  ) => void
  onUpdateClientConfig: (
    clientId: ClientId,
    updates: {
      plan?: Plan
      extraModules?: PageId[]
      maxLocations?: number
      maxUsers?: number
      status?: "Activo" | "Suspendido"
    },
    auditDescription: string,
    auditCategory: PlatformAuditCategory,
  ) => void
  onViewAsClient: (clientId: ClientId, reason?: string) => void
  onLogout: () => void
}

const ALL_OVERRIDABLE_MODULES: {
  id: PageId
  label: string
  minPlan: Plan
  description: string
}[] = [
  {
    id: "inventario",
    label: "Inventario",
    minPlan: "Profesional",
    description: "Rotación, días de cobertura y quiebres de stock.",
  },
  {
    id: "productos",
    label: "Productos",
    minPlan: "Profesional",
    description: "Desempeño por SKU, curva ABC y márgenes.",
  },
  {
    id: "comparativos",
    label: "Comparativos",
    minPlan: "Profesional",
    description: "Same-Store Sales (SSS) y benchmarking entre ubicaciones.",
  },
  {
    id: "metas",
    label: "Metas y presupuestos",
    minPlan: "Profesional",
    description: "Seguimiento de cumplimiento comercial mensual y diario.",
  },
  {
    id: "trafico",
    label: "Tráfico y conversión",
    minPlan: "Avanzado",
    description: "Cruce de sensores de afluencia con transacciones POS.",
  },
  {
    id: "alertas",
    label: "Alertas inteligentes",
    minPlan: "Avanzado",
    description: "Detección automática de anomalías en ventas o caídas POS.",
  },
]

const PRESET_COLORS = [
  { name: "Azul Andino", hex: "#2456e6" },
  { name: "Verde Esmeralda", hex: "#0f766e" },
  { name: "Índigo Corporativo", hex: "#4338ca" },
  { name: "Carmesí Retail", hex: "#be123c" },
  { name: "Ámbar Dorado", hex: "#b45309" },
  { name: "Pizarra Ejecutivo", hex: "#1e293b" },
]

export function PlatformConsolePage({
  platformRole,
  onChangePlatformRole,
  clientsMap,
  usersByClient,
  integrations,
  auditLogs,
  onCreateClient,
  onUpdateClientConfig,
  onViewAsClient,
  onLogout,
}: Props) {
  const [section, setSection] = useState<ConsoleSection>("clientes")
  const [selectedClientId, setSelectedClientId] = useState<ClientId | null>(
    null,
  )
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filters for Clients Table
  const [clientSearch, setClientSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"todos" | "operator" | "brand">(
    "todos",
  )
  const [planFilter, setPlanFilter] = useState<"todos" | Plan>("todos")
  const [healthFilter, setHealthFilter] =
    useState<"todos" | PlatformIntegrationStatus>("todos")
  const [statusFilter, setStatusFilter] =
    useState<"todos" | "Activo" | "Suspendido">("todos")

  // Filters for Integrations Health
  const [intStatusFilter, setIntStatusFilter] =
    useState<"todos" | PlatformIntegrationStatus>("todos")
  const [intClientFilter, setIntClientFilter] = useState<"todos" | ClientId>(
    "todos",
  )
  const [intSearch, setIntSearch] = useState("")
  const [selectedIntegration, setSelectedIntegration] =
    useState<PlatformIntegrationSource | null>(null)

  // Filters for Audit Log
  const [auditClientFilter, setAuditClientFilter] =
    useState<"todos" | ClientId>("todos")
  const [auditCategoryFilter, setAuditCategoryFilter] =
    useState<"todos" | PlatformAuditCategory>("todos")
  const [auditSearch, setAuditSearch] = useState("")

  // Create Client Wizard State
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  const [wizName, setWizName] = useState("")
  const [wizShortName, setWizShortName] = useState("")
  const [wizType, setWizType] = useState<"operator" | "brand">("operator")
  const [wizCity, setWizCity] = useState("Bogotá y Sabana Centro")
  const [wizLocations, setWizLocations] = useState(32)
  const [wizPlan, setWizPlan] = useState<Plan>("Profesional")
  const [wizMaxLocations, setWizMaxLocations] = useState(60)
  const [wizMaxUsers, setWizMaxUsers] = useState(25)
  const [wizExtraModules, setWizExtraModules] = useState<PageId[]>(["trafico"])
  const [wizSubdomain, setWizSubdomain] = useState("")
  const [wizColor, setWizColor] = useState("#4338ca")
  const [wizLogoUrl, setWizLogoUrl] = useState<string | null>(null)
  const [wizAdminName, setWizAdminName] = useState("")
  const [wizAdminEmail, setWizAdminEmail] = useState("")
  const [wizAdminTitle, setWizAdminTitle] = useState(
    "Director de Operaciones y BI",
  )

  const selectedClient = selectedClientId
    ? (clientsMap[selectedClientId] ?? null)
    : null

  const isSuperAdmin = platformRole === "Super Admin"
  const clientsList = useMemo(() => Object.values(clientsMap), [clientsMap])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 4000)
  }

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      const q = clientSearch.trim().toLowerCase()
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.shortName.toLowerCase().includes(q) &&
        !c.appearance.subdomain.toLowerCase().includes(q) &&
        !c.city.toLowerCase().includes(q)
      ) {
        return false
      }
      if (typeFilter !== "todos" && c.type !== typeFilter) return false
      if (planFilter !== "todos" && c.plan !== planFilter) return false
      if (healthFilter !== "todos" && c.integrationHealth !== healthFilter)
        return false
      if (statusFilter !== "todos" && c.status !== statusFilter) return false
      return true
    })
  }, [
    clientsList,
    clientSearch,
    typeFilter,
    planFilter,
    healthFilter,
    statusFilter,
  ])

  // Sorted and Filtered Integrations (Errors ALWAYS first!)
  const statusPriority: Record<PlatformIntegrationStatus, number> = {
    Error: 0,
    Atención: 1,
    Conectado: 2,
  }

  const sortedFilteredIntegrations = useMemo(() => {
    return [...integrations]
      .filter((item) => {
        if (intStatusFilter !== "todos" && item.status !== intStatusFilter)
          return false
        if (intClientFilter !== "todos" && item.clientId !== intClientFilter)
          return false
        const q = intSearch.trim().toLowerCase()
        if (
          q &&
          !item.connectorName.toLowerCase().includes(q) &&
          !item.clientName.toLowerCase().includes(q) &&
          !item.kind.toLowerCase().includes(q) &&
          !item.diagnostic.toLowerCase().includes(q)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => statusPriority[a.status] - statusPriority[b.status])
  }, [integrations, intStatusFilter, intClientFilter, intSearch])

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (
        auditClientFilter !== "todos" &&
        entry.clientId !== auditClientFilter
      ) {
        return false
      }
      if (
        auditCategoryFilter !== "todos" &&
        entry.category !== auditCategoryFilter
      ) {
        return false
      }
      const q = auditSearch.trim().toLowerCase()
      if (
        q &&
        !entry.actorEmail.toLowerCase().includes(q) &&
        !entry.clientName.toLowerCase().includes(q) &&
        !entry.action.toLowerCase().includes(q) &&
        !entry.targetObject.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [auditLogs, auditClientFilter, auditCategoryFilter, auditSearch])

  // Global KPIs
  const totalLocations = clientsList.reduce((acc, c) => acc + c.locations, 0)
  const totalMaxLocations = clientsList.reduce(
    (acc, c) => acc + c.maxLocations,
    0,
  )
  const totalUsers = clientsList.reduce(
    (acc, c) => acc + (usersByClient[c.id]?.length ?? 0),
    0,
  )
  const errorIntegrationsCount = integrations.filter(
    (i) => i.status === "Error",
  ).length
  const warningIntegrationsCount = integrations.filter(
    (i) => i.status === "Atención",
  ).length

  const openCreateWizard = () => {
    setWizardStep(1)
    setWizName("Parque Caracolí Centro Comercial")
    setWizShortName("Parque Caracolí")
    setWizType("operator")
    setWizCity("Bucaramanga y Floridablanca")
    setWizLocations(48)
    setWizPlan("Profesional")
    setWizMaxLocations(60)
    setWizMaxUsers(25)
    setWizExtraModules(["trafico"])
    setWizSubdomain("parquecaracoli")
    setWizColor("#4338ca")
    setWizLogoUrl(null)
    setWizAdminName("Camila Restrepo")
    setWizAdminEmail("c.restrepo@parquecaracoli.com.co")
    setWizAdminTitle("Directora de Operaciones")
    setWizardOpen(true)
  }

  const handleCompleteWizard = () => {
    const cleanName = wizName.trim() || "Nuevo Cliente Retail"
    const cleanShort =
      wizShortName.trim() || cleanName.split(" ").slice(0, 2).join(" ")
    const slug =
      (wizSubdomain.trim() || cleanShort)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "") || `cliente${Date.now()}`

    const words = cleanShort.trim().split(/\s+/)
    const initials =
      words.length >= 2
        ? `${words[0][0] ?? "R"}${words[1][0] ?? "I"}`.toUpperCase()
        : cleanShort.slice(0, 2).toUpperCase()

    const isOp = wizType === "operator"
    const newClient: Client = {
      id: slug,
      name: cleanName,
      shortName: cleanShort,
      type: wizType,
      plan: wizPlan,
      status: "Activo",
      city: wizCity.trim() || "Bogotá D.C.",
      color: wizColor,
      colorDark: darkenHex(wizColor, 0.25),
      accent: softTintHex(wizColor, 0.88),
      secondaryColor: "#0ea5e9",
      accentColor: "#6366f1",
      initials,
      entityLabel: isOp ? "local" : "tienda",
      entityLabelPlural: isOp ? "locales" : "tiendas",
      locations: Math.max(1, Number(wizLocations) || 10),
      maxLocations: Math.max(
        Number(wizLocations) || 10,
        Number(wizMaxLocations) || 30,
      ),
      maxUsers: Math.max(3, Number(wizMaxUsers) || 15),
      extraModules: wizExtraModules,
      integrationHealth: "Conectado",
      scopeOptions: isOp
        ? [
            "Todos los centros comerciales",
            `${cleanShort} Principal`,
            `${cleanShort} Norte`,
          ]
        : [
            "Todas las tiendas",
            "Región Andina",
            "Región Antioquia",
            "Región Caribe",
          ],
      appearance: {
        productName: `${cleanShort} Analytics`,
        primaryColor: wizColor,
        secondaryColor: "#0ea5e9",
        accentColor: "#6366f1",
        fontFamily: "Plus Jakarta Sans",
        logoLight: wizLogoUrl ? "custom" : "monogram",
        logoDark: wizLogoUrl ? "custom" : "monogram",
        favicon: wizLogoUrl ? "custom" : "rounded",
        customLogoLightUrl: wizLogoUrl ?? undefined,
        customLogoDarkUrl: wizLogoUrl ?? undefined,
        customFaviconUrl: wizLogoUrl ?? undefined,
        subdomain: slug,
        customDomain: wizPlan === "Avanzado" ? `analitica.${slug}.com.co` : "",
        dnsVerified: wizPlan === "Avanzado",
      },
      terminology: isOp
        ? {
            storeSingular: "Local",
            storePlural: "Locales",
            mallSingular: "Centro comercial",
            mallPlural: "Centros comerciales",
            visitorsLabel: "Visitantes",
            transactionSingular: "Factura",
            transactionPlural: "Facturas",
          }
        : {
            storeSingular: "Tienda",
            storePlural: "Tiendas",
            mallSingular: "Ubicación comercial",
            mallPlural: "Ubicaciones comerciales",
            visitorsLabel: "Entradas a tienda",
            transactionSingular: "Ticket POS",
            transactionPlural: "Tickets POS",
          },
      parameters: {
        timezone: "America/Bogota",
        cutoffHour: "23:00",
        weekStartsOn: "Lunes",
        salesTaxMode: "sin_iva",
        ivaRate: 19,
        useColombianHolidays: true,
        markQuincenasAndPrimas: true,
        holidays: colombianHolidays2025,
      },
    }

    onCreateClient(newClient, {
      name: wizAdminName.trim() || "Administrador Principal",
      email: wizAdminEmail.trim() || `admin@${slug}.com.co`,
      title: wizAdminTitle.trim() || "Administrador General",
    })
    setWizardOpen(false)
    setSelectedClientId(newClient.id)
    triggerToast(
      `Cliente "${newClient.name}" creado e invitación enviada a ${wizAdminEmail || `admin@${slug}.com.co`}. Disponible en Acceso demo del Login.`,
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Platform Bar — Neutral Dark Slate (No Client Branding) */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-slate-800 ring-1 ring-white/15">
              <Shield className="size-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  Retail Intelligence
                </span>
                <span className="rounded-md border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  Consola de Plataforma
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gobierno multi-tenant · Entorno neutro sin marca blanca de
                cliente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Switcher between Super Admin and Soporte */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
              <span className="px-2.5 text-[11px] font-medium text-slate-400">
                Rol activo:
              </span>
              {(["Super Admin", "Soporte"] as const).map((r) => {
                const active = platformRole === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onChangePlatformRole(r)
                      triggerToast(
                        r === "Super Admin"
                          ? "Rol cambiado a Super Admin (Permisos de edición habilitados)"
                          : "Rol cambiado a Soporte (Modo solo lectura + Ver como cliente)",
                      )
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? r === "Super Admin"
                          ? "bg-sky-500 text-slate-950 shadow-xs"
                          : "bg-amber-400 text-slate-950 shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {r === "Super Admin" ? (
                      <ShieldCheck className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {r}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              title="Volver a la pantalla de inicio de sesión y Acceso demo"
            >
              <LogOut className="size-3.5 text-slate-400" />
              <span>Salir al Login</span>
            </button>
          </div>
        </div>

        {/* Read-only notice when in Support role */}
        {!isSuperAdmin && (
          <div className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-200 sm:px-6">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Eye className="size-3.5 text-amber-400" />
                <strong>Vista de Soporte (Solo lectura):</strong> Puede auditar
                clientes, revisar diagnósticos de integraciones y usar{" "}
                <strong>«Ver como cliente»</strong>. La creación o modificación
                de planes y límites está reservada a Super Admin.
              </span>
              <span className="text-[11px] text-amber-300/90">
                Agente: soporte@retailintelligence.co
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span className="leading-relaxed">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Console Body with Neutral Sidebar + Content Area */}
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        {/* Neutral Left Navigation */}
        <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:min-h-[calc(100vh-61px)] lg:w-64 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Módulos de plataforma
            </p>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              {[
                {
                  id: "clientes" as const,
                  label: "Clientes",
                  icon: Building2,
                  badge: String(clientsList.length),
                },
                {
                  id: "planes" as const,
                  label: "Planes y módulos",
                  icon: Layers,
                  badge: "3 planes",
                },
                {
                  id: "integraciones" as const,
                  label: "Salud de integraciones",
                  icon: Activity,
                  badge:
                    errorIntegrationsCount > 0
                      ? `${errorIntegrationsCount} error`
                      : String(integrations.length),
                  badgeAlert: errorIntegrationsCount > 0,
                },
                {
                  id: "auditoria" as const,
                  label: "Auditoría",
                  icon: ClipboardList,
                  badge: String(auditLogs.length),
                },
              ].map((item) => {
                const Icon = item.icon
                const active = section === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id)
                      if (item.id !== "clientes") {
                        setSelectedClientId(null)
                      }
                    }}
                    className={`flex shrink-0 items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.badgeAlert
                          ? active
                            ? "bg-rose-500 text-white"
                            : "bg-rose-100 text-rose-700"
                          : active
                            ? "bg-slate-700 text-slate-200"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="hidden border-t border-slate-100 p-4 lg:block">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-bold text-slate-800">
                Aislamiento de marca blanca
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Esta consola opera con diseño neutro de plataforma. Al usar{" "}
                <strong>Ver como cliente</strong> se carga el entorno del
                cliente con una barra fija de soporte y registro en auditoría.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Global Summary Strip */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Clientes en plataforma</span>
                <Building2 className="size-4 text-slate-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {clientsList.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {clientsList.filter((c) => c.status === "Activo").length}{" "}
                activos ·{" "}
                {clientsList.filter((c) => c.status === "Suspendido").length}{" "}
                suspendidos
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Tiendas / Locales conectados</span>
                <Store className="size-4 text-slate-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalLocations}{" "}
                <span className="text-sm font-normal text-slate-400">
                  / {totalMaxLocations}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Capacidad utilizada:{" "}
                {Math.round(
                  (totalLocations / Math.max(1, totalMaxLocations)) * 100,
                )}
                %
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Usuarios de clientes</span>
                <Users className="size-4 text-slate-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalUsers}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                2FA TOTP requerido en todos los tenants
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Salud global de integraciones</span>
                <Activity className="size-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600">
                  {errorIntegrationsCount} en error
                </span>
                <span className="text-xs font-semibold text-amber-600">
                  · {warningIntegrationsCount} en atención
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSection("integraciones")}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
              >
                Ir al monitor de fuentes <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>

          {/* ==================== SECTION 1: CLIENTES ==================== */}
          {section === "clientes" && !selectedClient && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Directorio de clientes (Tenants)
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Administre operadores de centros comerciales y marcas
                    retail, planes, límites e inicio de sesión asistida.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={openCreateWizard}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition ${
                    isSuperAdmin
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  <Plus className="size-4" />
                  Crear cliente
                  {!isSuperAdmin && (
                    <span className="rounded bg-slate-300 px-1.5 py-0.5 text-[10px] text-slate-600">
                      Solo Super Admin
                    </span>
                  )}
                </button>
              </div>

              {/* Search & Filters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="relative xl:col-span-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar cliente, subdominio..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500">Tipo:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) =>
                        setTypeFilter(
                          e.target.value as "todos" | "operator" | "brand",
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="operator">Centro comercial</option>
                      <option value="brand">Marca</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500">Plan:</span>
                    <select
                      value={planFilter}
                      onChange={(e) =>
                        setPlanFilter(e.target.value as "todos" | Plan)
                      }
                      className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                    >
                      <option value="todos">Todos los planes</option>
                      <option value="Avanzado">Avanzado</option>
                      <option value="Profesional">Profesional</option>
                      <option value="Esencial">Esencial</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500">
                      Integración:
                    </span>
                    <select
                      value={healthFilter}
                      onChange={(e) =>
                        setHealthFilter(
                          e.target.value as "todos" | PlatformIntegrationStatus,
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="Error">Error</option>
                      <option value="Atención">Atención</option>
                      <option value="Conectado">Conectado</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-500">
                      Estado:
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "todos" | "Activo" | "Suspendido",
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="Activo">Activo</option>
                      <option value="Suspendido">Suspendido</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Clients Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3.5">Nombre y subdominio</th>
                        <th className="px-4 py-3.5">Tipo</th>
                        <th className="px-4 py-3.5">Plan</th>
                        <th className="px-4 py-3.5">Tiendas / Locales</th>
                        <th className="px-4 py-3.5">Usuarios</th>
                        <th className="px-4 py-3.5">Estado de integración</th>
                        <th className="px-4 py-3.5">Estado</th>
                        <th className="px-4 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClients.map((c) => {
                        const clientUsersCount =
                          usersByClient[c.id]?.length ?? 0
                        return (
                          <tr
                            key={c.id}
                            className="transition hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {c.appearance.customLogoLightUrl ? (
                                  <img
                                    src={c.appearance.customLogoLightUrl}
                                    alt={c.shortName}
                                    className="size-9 rounded-lg object-contain ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <span
                                    className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-black text-white"
                                    style={{ backgroundColor: c.color }}
                                  >
                                    {c.initials}
                                  </span>
                                )}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedClientId(c.id)}
                                    className="font-bold text-slate-900 hover:text-sky-700 hover:underline"
                                  >
                                    {c.name}
                                  </button>
                                  <p className="text-[11px] text-slate-500">
                                    {c.appearance.subdomain}
                                    .retailintelligence.co · {c.city}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  c.type === "operator"
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-teal-50 text-teal-700"
                                }`}
                              >
                                {c.type === "operator" ? (
                                  <Building2 className="size-3" />
                                ) : (
                                  <Store className="size-3" />
                                )}
                                {c.type === "operator"
                                  ? "Centro comercial"
                                  : "Marca"}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                    c.plan === "Avanzado"
                                      ? "bg-slate-900 text-white"
                                      : c.plan === "Profesional"
                                        ? "bg-sky-100 text-sky-800"
                                        : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {c.plan}
                                </span>
                                {c.extraModules.length > 0 && (
                                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                    +{c.extraModules.length} mód. extra
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="w-28">
                                <div className="flex justify-between text-xs font-semibold text-slate-800">
                                  <span>
                                    {c.locations} {c.entityLabelPlural}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    / {c.maxLocations}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-700"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (c.locations /
                                            Math.max(1, c.maxLocations)) *
                                            100,
                                        ),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="w-24">
                                <div className="flex justify-between text-xs font-semibold text-slate-800">
                                  <span>{clientUsersCount}</span>
                                  <span className="text-[11px] text-slate-400">
                                    / {c.maxUsers}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-700"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round(
                                          (clientUsersCount /
                                            Math.max(1, c.maxUsers)) *
                                            100,
                                        ),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setIntClientFilter(c.id)
                                  setSection("integraciones")
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition hover:opacity-80 ${
                                  c.integrationHealth === "Error"
                                    ? "bg-rose-100 text-rose-800"
                                    : c.integrationHealth === "Atención"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                <span
                                  className={`size-2 rounded-full ${
                                    c.integrationHealth === "Error"
                                      ? "bg-rose-600"
                                      : c.integrationHealth === "Atención"
                                        ? "bg-amber-500"
                                        : "bg-emerald-600"
                                  }`}
                                />
                                {c.integrationHealth}
                              </button>
                            </td>

                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  c.status === "Activo"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedClientId(c.id)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Detalle
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewAsClient(
                                      c.id,
                                      "Acceso a aplicación del cliente desde tabla de clientes",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                  <Eye className="size-3.5 text-sky-400" />
                                  Ver como cliente
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CLIENT DETAIL VIEW ==================== */}
          {section === "clientes" && selectedClient && (
            <ClientDetailPanel
              client={selectedClient}
              users={usersByClient[selectedClient.id] ?? []}
              integrations={integrations.filter(
                (i) => i.clientId === selectedClient.id,
              )}
              isSuperAdmin={isSuperAdmin}
              onBack={() => setSelectedClientId(null)}
              onViewAsClient={() =>
                onViewAsClient(
                  selectedClient.id,
                  "Sesión asistida iniciada desde vista de detalle del cliente",
                )
              }
              onUpdateClientConfig={(updates, desc, cat) => {
                onUpdateClientConfig(selectedClient.id, updates, desc, cat)
                triggerToast(`Cambios guardados en ${selectedClient.name}.`)
              }}
            />
          )}

          {/* ==================== SECTION 2: PLANES Y MÓDULOS ==================== */}
          {section === "planes" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Planes comerciales y matriz de módulos
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Comparativa de capacidades entre los planes Esencial,
                    Profesional y Avanzado, incluyendo SSO y dominio propio.
                  </p>
                </div>
              </div>

              {/* Plan Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {(["Esencial", "Profesional", "Avanzado"] as Plan[]).map(
                  (planName) => {
                    const meta = planSummaryMeta[planName]
                    const assignedClients = clientsList.filter(
                      (c) => c.plan === planName,
                    )
                    return (
                      <div
                        key={planName}
                        className={`rounded-2xl border bg-white p-5 shadow-xs ${
                          planName === "Avanzado"
                            ? "border-slate-900 ring-1 ring-slate-900"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              planName === "Avanzado"
                                ? "bg-slate-900 text-white"
                                : planName === "Profesional"
                                  ? "bg-sky-100 text-sky-900"
                                  : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            Plan {planName}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {assignedClients.length}{" "}
                            {assignedClients.length === 1
                              ? "cliente activo"
                              : "clientes activos"}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-900">
                          {meta.tagline}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {meta.targetAudience}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                          <div>
                            <span className="text-slate-400">
                              Ubicaciones base:
                            </span>
                            <p className="font-bold text-slate-800">
                              Hasta {meta.defaultMaxLocations}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">
                              Usuarios base:
                            </span>
                            <p className="font-bold text-slate-800">
                              Hasta {meta.defaultMaxUsers}
                            </p>
                          </div>
                        </div>

                        {assignedClients.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                            {assignedClients.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(c.id)
                                  setSection("clientes")
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.shortName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  },
                )}
              </div>

              {/* Full Plan Comparison Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4">
                          Capacidad / Módulo / Seguridad
                        </th>
                        <th className="px-4 py-4">Categoría</th>
                        <th className="px-4 py-4 text-center">Esencial</th>
                        <th className="px-4 py-4 text-center">Profesional</th>
                        <th className="bg-slate-900/5 px-4 py-4 text-center text-slate-900">
                          Avanzado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {platformPlanComparisonRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {row.name}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {row.category}
                            </span>
                          </td>
                          {([
                            "esencial",
                            "profesional",
                            "avanzado",
                          ] as const).map((col) => {
                            const val = row[col]
                            return (
                              <td
                                key={col}
                                className={`px-4 py-3.5 text-center ${
                                  col === "avanzado"
                                    ? "bg-slate-900/[0.02]"
                                    : ""
                                }`}
                              >
                                {typeof val === "boolean" ? (
                                  val ? (
                                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                      <Check className="size-3.5" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                      No incluido
                                    </span>
                                  )
                                ) : (
                                  <span className="font-bold text-slate-800">
                                    {val}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SECTION 3: SALUD DE INTEGRACIONES ==================== */}
          {section === "integraciones" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Salud global de integraciones
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Monitoreo en tiempo real de todas las fuentes POS, ERP y
                    contadores de personas de los clientes, priorizando errores
                    críticos.
                  </p>
                </div>
              </div>

              {/* Quick Status Filter Pills + Client Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    {
                      id: "todos",
                      label: `Todas (${integrations.length})`,
                    },
                    {
                      id: "Error",
                      label: `Errores (${errorIntegrationsCount})`,
                    },
                    {
                      id: "Atención",
                      label: `Atención (${warningIntegrationsCount})`,
                    },
                    {
                      id: "Conectado",
                      label: `Conectadas (${
                        integrations.length -
                        errorIntegrationsCount -
                        warningIntegrationsCount
                      })`,
                    },
                  ] as const).map((pill) => {
                    const active = intStatusFilter === pill.id
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setIntStatusFilter(pill.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? pill.id === "Error"
                              ? "bg-rose-600 text-white"
                              : pill.id === "Atención"
                                ? "bg-amber-500 text-slate-950"
                                : "bg-slate-900 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pill.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={intClientFilter}
                    onChange={(e) => setIntClientFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="todos">Todos los clientes</option>
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={intSearch}
                      onChange={(e) => setIntSearch(e.target.value)}
                      placeholder="Buscar conector o diagnóstico..."
                      className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Integrations Table (Errors First) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3.5">Estado (Errores 1°)</th>
                        <th className="px-4 py-3.5">Cliente</th>
                        <th className="px-4 py-3.5">Fuente / Conector</th>
                        <th className="px-4 py-3.5">Alcance</th>
                        <th className="px-4 py-3.5">Última sinc.</th>
                        <th className="px-4 py-3.5">Calidad</th>
                        <th className="px-4 py-3.5">Diagnóstico</th>
                        <th className="px-4 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedFilteredIntegrations.map((src) => (
                        <tr
                          key={src.id}
                          className={`transition ${
                            src.status === "Error"
                              ? "bg-rose-50/40 hover:bg-rose-50/70"
                              : src.status === "Atención"
                                ? "bg-amber-50/30 hover:bg-amber-50/60"
                                : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                src.status === "Error"
                                  ? "bg-rose-100 text-rose-800"
                                  : src.status === "Atención"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full ${
                                  src.status === "Error"
                                    ? "bg-rose-600"
                                    : src.status === "Atención"
                                      ? "bg-amber-500"
                                      : "bg-emerald-600"
                                }`}
                              />
                              {src.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="grid size-6 shrink-0 place-items-center rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: src.clientColor }}
                              >
                                {src.clientInitials}
                              </span>
                              <span className="font-bold text-slate-900">
                                {src.clientName}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900">
                              {src.connectorName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {src.kind}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            {src.scope}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                            {src.lastSync}
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`font-bold ${
                                src.quality >= 90
                                  ? "text-emerald-700"
                                  : src.quality >= 80
                                    ? "text-amber-700"
                                    : "text-rose-700"
                              }`}
                            >
                              {src.quality}%
                            </span>
                          </td>

                          <td className="max-w-xs px-4 py-3.5 text-slate-600">
                            <p className="truncate font-medium">
                              {src.diagnostic}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedIntegration(src)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                              >
                                Ver detalle
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onViewAsClient(
                                    src.clientId,
                                    `Diagnóstico de fuente: ${src.connectorName}`,
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                <Eye className="size-3.5 text-sky-400" />
                                Ver cliente
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Integration Source Detail Drawer / Modal */}
              {selectedIntegration && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
                  onMouseDown={() => setSelectedIntegration(null)}
                >
                  <div
                    className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            selectedIntegration.status === "Error"
                              ? "bg-rose-100 text-rose-800"
                              : selectedIntegration.status === "Atención"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Estado: {selectedIntegration.status}
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {selectedIntegration.connectorName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Cliente:{" "}
                          <strong>{selectedIntegration.clientName}</strong> ·{" "}
                          {selectedIntegration.kind} ·{" "}
                          {selectedIntegration.scope}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIntegration(null)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                      >
                        <X className="size-5" />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                      <div>
                        <span className="text-slate-400">
                          Calidad de datos:
                        </span>
                        <p className="mt-0.5 text-base font-bold text-slate-900">
                          {selectedIntegration.quality}%
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Latencia media:</span>
                        <p className="mt-0.5 text-base font-bold text-slate-900">
                          {selectedIntegration.latencyMs} ms
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Registros (24h):</span>
                        <p className="mt-0.5 text-base font-bold text-slate-900">
                          {selectedIntegration.records24h.toLocaleString(
                            "es-CO",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                      <div className="rounded-xl border border-slate-200 p-3.5">
                        <p className="font-bold text-slate-800">
                          Diagnóstico operativo
                        </p>
                        <p className="mt-1 text-slate-600">
                          {selectedIntegration.diagnostic}
                        </p>
                      </div>

                      {selectedIntegration.errorDetail && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-900">
                          <p className="font-bold">
                            Traza técnica del conector
                          </p>
                          <p className="mt-1 font-mono text-[11px] leading-relaxed">
                            {selectedIntegration.errorDetail}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedIntegration(null)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedIntegration.clientId
                          const connector = selectedIntegration.connectorName
                          setSelectedIntegration(null)
                          onViewAsClient(
                            targetId,
                            `Inspección de fuente en falla: ${connector}`,
                          )
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        <Eye className="size-3.5 text-sky-400" />
                        Ver como cliente ({selectedIntegration.clientName})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SECTION 4: AUDITORÍA ==================== */}
          {section === "auditoria" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Historial global de auditoría
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Registro inmutable de acciones administrativas, cambios de
                    plan, creación de clientes y sesiones de soporte («Ver como
                    cliente»).
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Buscar por correo, acción u objeto..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-500">Cliente:</span>
                  <select
                    value={auditClientFilter}
                    onChange={(e) => setAuditClientFilter(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                  >
                    <option value="todos">Todos los clientes</option>
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-500">
                    Categoría:
                  </span>
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) =>
                      setAuditCategoryFilter(
                        e.target.value as "todos" | PlatformAuditCategory,
                      )
                    }
                    className="min-w-0 flex-1 bg-transparent font-semibold text-slate-800 outline-none"
                  >
                    <option value="todos">Todas las categorías</option>
                    <option value="soporte">
                      Modo soporte (Ver como cliente)
                    </option>
                    <option value="cliente">Alta y estado de clientes</option>
                    <option value="plan">Planes, módulos y límites</option>
                    <option value="seguridad">Seguridad y dominios</option>
                  </select>
                </label>
              </div>

              {/* Audit Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3.5">Fecha y hora</th>
                        <th className="px-4 py-3.5">Usuario</th>
                        <th className="px-4 py-3.5">Cliente</th>
                        <th className="px-4 py-3.5">Acción</th>
                        <th className="px-4 py-3.5">Objeto afectado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-500">
                            {log.timestamp}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-900">
                              {log.actorEmail}
                            </p>
                            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {log.clientName}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                log.category === "soporte"
                                  ? "bg-amber-100 text-amber-900"
                                  : log.category === "plan"
                                    ? "bg-sky-100 text-sky-900"
                                    : log.category === "cliente"
                                      ? "bg-emerald-100 text-emerald-900"
                                      : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {log.targetObject}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== MULTI-STEP WIZARD: CREAR CLIENTE ==================== */}
      {wizardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onMouseDown={() => setWizardOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-6 py-4 text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                  Alta de nuevo tenant · Paso {wizardStep} de 4
                </span>
                <h2 className="mt-0.5 text-lg font-bold">
                  Crear cliente en Retail Intelligence
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs">
              {[
                { step: 1, label: "1. Datos y tipo" },
                { step: 2, label: "2. Plan y módulos" },
                { step: 3, label: "3. Subdominio y marca" },
                { step: 4, label: "4. Primer Admin" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setWizardStep(s.step as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-2 text-left font-bold ${
                    wizardStep === s.step
                      ? "text-slate-950"
                      : wizardStep > s.step
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${
                      wizardStep === s.step
                        ? "bg-slate-900 text-white"
                        : wizardStep > s.step
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {wizardStep > s.step ? "✓" : s.step}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Wizard Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Tipo de cliente
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          id: "operator" as const,
                          title: "Centro comercial",
                          desc: "Operador inmobiliario con locales, niveles, plazoletas y sensores de puertas.",
                          icon: Building2,
                        },
                        {
                          id: "brand" as const,
                          title: "Marca",
                          desc: "Cadena retail con tiendas en calle, centros comerciales u outlets.",
                          icon: Store,
                        },
                      ].map((opt) => {
                        const Icon = opt.icon
                        const active = wizType === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setWizType(opt.id)}
                            className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                              active
                                ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <Icon className="size-5 text-slate-800" />
                            <p className="mt-2 text-sm font-bold text-slate-900">
                              {opt.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                              {opt.desc}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Razón social / Nombre del cliente
                      </span>
                      <input
                        type="text"
                        value={wizName}
                        onChange={(e) => setWizName(e.target.value)}
                        className="field text-xs"
                        placeholder="Ej. Parque Caracolí Centro Comercial"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Nombre corto (visible en menú y login)
                      </span>
                      <input
                        type="text"
                        value={wizShortName}
                        onChange={(e) => {
                          setWizShortName(e.target.value)
                          setWizSubdomain(
                            e.target.value
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9]/g, ""),
                          )
                        }}
                        className="field text-xs"
                        placeholder="Ej. Parque Caracolí"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Ciudades de operación (DANE)
                      </span>
                      <input
                        type="text"
                        value={wizCity}
                        onChange={(e) => setWizCity(e.target.value)}
                        className="field text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        {wizType === "operator"
                          ? "Locales activos iniciales"
                          : "Tiendas activas iniciales"}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={wizLocations}
                        onChange={(e) =>
                          setWizLocations(Number(e.target.value) || 1)
                        }
                        className="field text-xs"
                      />
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      Seleccione el plan base
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["Esencial", "Profesional", "Avanzado"] as Plan[]).map(
                        (p) => {
                          const active = wizPlan === p
                          const meta = planSummaryMeta[p]
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setWizPlan(p)
                                setWizMaxLocations(meta.defaultMaxLocations)
                                setWizMaxUsers(meta.defaultMaxUsers)
                                setWizExtraModules((prev) =>
                                  prev.filter((m) => {
                                    const req = pagePlan[m]
                                    return req
                                      ? planRank[p] < planRank[req]
                                      : false
                                  }),
                                )
                              }}
                              className={`rounded-xl border p-3.5 text-left transition ${
                                active
                                  ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <p className="text-sm font-bold text-slate-900">
                                {p}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {meta.tagline}
                              </p>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Límite máximo de{" "}
                        {wizType === "operator" ? "locales" : "tiendas"}
                      </span>
                      <input
                        type="number"
                        min={wizLocations}
                        value={wizMaxLocations}
                        onChange={(e) =>
                          setWizMaxLocations(Number(e.target.value) || 15)
                        }
                        className="field text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Límite máximo de usuarios
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={wizMaxUsers}
                        onChange={(e) =>
                          setWizMaxUsers(Number(e.target.value) || 5)
                        }
                        className="field text-xs"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold text-slate-700">
                      Habilitar módulos individuales por encima del plan{" "}
                      {wizPlan}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {ALL_OVERRIDABLE_MODULES.map((mod) => {
                        const includedInPlan =
                          planRank[wizPlan] >= planRank[mod.minPlan]
                        const enabledExtra = wizExtraModules.includes(mod.id)
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
                              includedInPlan
                                ? "border-slate-200 bg-slate-50 opacity-75"
                                : enabledExtra
                                  ? "border-sky-500 bg-sky-50/40"
                                  : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={includedInPlan}
                              checked={includedInPlan || enabledExtra}
                              onChange={() => {
                                if (includedInPlan) return
                                setWizExtraModules((prev) =>
                                  prev.includes(mod.id)
                                    ? prev.filter((x) => x !== mod.id)
                                    : [...prev, mod.id],
                                )
                              }}
                              className="mt-0.5 size-4 accent-slate-900"
                            />
                            <div>
                              <p className="font-bold text-slate-900">
                                {mod.label}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {includedInPlan
                                  ? `Incluido en plan ${wizPlan}`
                                  : `Módulo extra (plan ${mod.minPlan})`}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">
                      Subdominio asignado
                    </span>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <span className="text-slate-400">https://</span>
                      <input
                        type="text"
                        value={wizSubdomain}
                        onChange={(e) =>
                          setWizSubdomain(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent font-bold text-slate-900 outline-none"
                      />
                      <span className="font-semibold text-slate-500">
                        .retailintelligence.co
                      </span>
                    </div>
                  </label>

                  <div>
                    <span className="mb-2 block text-xs font-bold text-slate-700">
                      Logo inicial del cliente (Opcional · PNG, SVG o iniciales)
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <span>Subir archivo de logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setWizLogoUrl(reader.result)
                              }
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                      {wizLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setWizLogoUrl(null)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Usar monograma (
                          {(wizShortName || "NC").slice(0, 2).toUpperCase()})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-xs font-bold text-slate-700">
                      Color primario de marca (Branding inicial)
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setWizColor(c.hex)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                            wizColor === c.hex
                              ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span
                            className="size-4 rounded-full"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={wizColor}
                        onChange={(e) => setWizColor(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                      />
                    </div>
                  </div>

                  {/* Live Preview of Login Demo Card */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Vista previa en panel «Acceso demo» del Login
                    </p>
                    <div className="flex max-w-xs items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                      {wizLogoUrl ? (
                        <img
                          src={wizLogoUrl}
                          alt={wizShortName}
                          className="size-9 rounded-lg object-contain ring-1 ring-slate-200"
                        />
                      ) : (
                        <span
                          className="grid size-9 place-items-center rounded-lg text-[10px] font-black text-white"
                          style={{ backgroundColor: wizColor }}
                        >
                          {(wizShortName || "NC").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-800">
                          {wizShortName || "Nuevo Cliente"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {wizPlan} · Administrador
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950">
                    Se enviará un correo de invitación con enlace de activación
                    y configuración obligatoria de 2FA al primer{" "}
                    <strong>Administrador</strong> del cliente.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Nombre del primer Administrador
                      </span>
                      <input
                        type="text"
                        value={wizAdminName}
                        onChange={(e) => setWizAdminName(e.target.value)}
                        className="field text-xs"
                        placeholder="Ej. Camila Restrepo"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Correo electrónico corporativo
                      </span>
                      <input
                        type="email"
                        value={wizAdminEmail}
                        onChange={(e) => setWizAdminEmail(e.target.value)}
                        className="field text-xs"
                        placeholder="c.restrepo@empresa.com.co"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">
                      Cargo
                    </span>
                    <input
                      type="text"
                      value={wizAdminTitle}
                      onChange={(e) => setWizAdminTitle(e.target.value)}
                      className="field text-xs"
                    />
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                    <p className="font-bold text-slate-900">
                      Resumen de aprovisionamiento
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      <li>
                        • <strong>Cliente:</strong> {wizName} (
                        {wizType === "operator" ? "Centro comercial" : "Marca"})
                      </li>
                      <li>
                        • <strong>Plan y límites:</strong> {wizPlan} · Hasta{" "}
                        {wizMaxLocations} ubicaciones y {wizMaxUsers} usuarios
                      </li>
                      <li>
                        • <strong>Módulos extra:</strong>{" "}
                        {wizExtraModules.length > 0
                          ? wizExtraModules.join(", ")
                          : "Ninguno"}
                      </li>
                      <li>
                        • <strong>Subdominio:</strong> {wizSubdomain}
                        .retailintelligence.co
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  wizardStep > 1
                    ? setWizardStep((s) => (s - 1) as 1 | 2 | 3 | 4)
                    : setWizardOpen(false)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {wizardStep > 1 ? "Anterior" : "Cancelar"}
              </button>

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Siguiente paso <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteWizard}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Check className="size-4" />
                  Crear cliente y enviar invitación
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClientDetailPanel({
  client,
  users,
  integrations,
  isSuperAdmin,
  onBack,
  onViewAsClient,
  onUpdateClientConfig,
}: {
  client: Client
  users: TenantUser[]
  integrations: PlatformIntegrationSource[]
  isSuperAdmin: boolean
  onBack: () => void
  onViewAsClient: () => void
  onUpdateClientConfig: (
    updates: {
      plan?: Plan
      extraModules?: PageId[]
      maxLocations?: number
      maxUsers?: number
      status?: "Activo" | "Suspendido"
    },
    auditDescription: string,
    auditCategory: PlatformAuditCategory,
  ) => void
}) {
  const [draftPlan, setDraftPlan] = useState<Plan>(client.plan)
  const [draftExtraModules, setDraftExtraModules] = useState<PageId[]>(
    client.extraModules,
  )
  const [draftMaxLocations, setDraftMaxLocations] = useState<number>(
    client.maxLocations,
  )
  const [draftMaxUsers, setDraftMaxUsers] = useState<number>(client.maxUsers)

  const toggleExtraModule = (modId: PageId) => {
    if (!isSuperAdmin) return
    setDraftExtraModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId],
    )
  }

  const handleSavePlanAndLimits = () => {
    onUpdateClientConfig(
      {
        plan: draftPlan,
        extraModules: draftExtraModules,
        maxLocations: draftMaxLocations,
        maxUsers: draftMaxUsers,
      },
      `Plan ${draftPlan} · Límite ${draftMaxLocations} ${client.entityLabelPlural} / ${draftMaxUsers} usuarios · Módulos extra: ${
        draftExtraModules.length > 0 ? draftExtraModules.join(", ") : "ninguno"
      }`,
      "plan",
    )
  }

  const handleToggleStatus = () => {
    if (!isSuperAdmin) return
    const nextStatus = client.status === "Activo" ? "Suspendido" : "Activo"
    onUpdateClientConfig(
      { status: nextStatus },
      `Cambio de estado del cliente a ${nextStatus}`,
      "cliente",
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Volver a clientes
          </button>
          <span
            className="grid size-10 place-items-center rounded-xl text-xs font-black text-white"
            style={{ backgroundColor: client.color }}
          >
            {client.initials}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {client.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  client.status === "Activo"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {client.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {client.type === "operator" ? "Centro comercial" : "Marca"} ·{" "}
              {client.appearance.subdomain}.retailintelligence.co ·{" "}
              {client.city}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                client.status === "Activo"
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {client.status === "Activo"
                ? "Suspender cliente"
                : "Reactivar cliente"}
            </button>
          )}
          <button
            type="button"
            onClick={onViewAsClient}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Eye className="size-4 text-sky-400" />
            Ver como cliente
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Plan, Extra Modules & Limits */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Plan contratado y módulos individuales
                </h2>
                <p className="text-xs text-slate-500">
                  Edite el plan base o habilite módulos adicionales por encima
                  del plan para este cliente.
                </p>
              </div>
              {!isSuperAdmin && (
                <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  Modo solo lectura (Soporte)
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(["Esencial", "Profesional", "Avanzado"] as Plan[]).map((p) => {
                const active = draftPlan === p
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => setDraftPlan(p)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-300"
                    } ${!isSuperAdmin ? "cursor-not-allowed opacity-75" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {p}
                      </span>
                      {active && (
                        <CheckCircle2 className="size-4 text-slate-900" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {planSummaryMeta[p].tagline}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Individual Module Overrides */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Módulos analíticos (Habilitación por encima del plan {draftPlan}
                )
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ALL_OVERRIDABLE_MODULES.map((mod) => {
                  const includedByPlan =
                    planRank[draftPlan] >= planRank[mod.minPlan]
                  const enabledExtra = draftExtraModules.includes(mod.id)
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs ${
                        includedByPlan
                          ? "border-slate-200 bg-slate-50"
                          : enabledExtra
                            ? "border-sky-500 bg-sky-50/40"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {mod.label}
                          </span>
                          {includedByPlan ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              Incluido en {draftPlan}
                            </span>
                          ) : enabledExtra ? (
                            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                              Módulo extra activo
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              Plan {mod.minPlan}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {mod.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!isSuperAdmin || includedByPlan}
                        checked={includedByPlan || enabledExtra}
                        onChange={() => toggleExtraModule(mod.id)}
                        className="mt-1 size-4 shrink-0 accent-slate-900"
                      />
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Store & User Limits */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Límites de tiendas / locales y usuarios
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="block text-xs font-bold text-slate-700">
                    Límite de {client.entityLabelPlural} (Actual:{" "}
                    {client.locations} en uso)
                  </span>
                  <input
                    type="number"
                    disabled={!isSuperAdmin}
                    min={client.locations}
                    value={draftMaxLocations}
                    onChange={(e) =>
                      setDraftMaxLocations(
                        Number(e.target.value) || client.locations,
                      )
                    }
                    className="field mt-2 bg-white text-xs"
                  />
                </label>

                <label className="block rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="block text-xs font-bold text-slate-700">
                    Límite de usuarios (Actual: {users.length} activos)
                  </span>
                  <input
                    type="number"
                    disabled={!isSuperAdmin}
                    min={users.length}
                    value={draftMaxUsers}
                    onChange={(e) =>
                      setDraftMaxUsers(Number(e.target.value) || users.length)
                    }
                    className="field mt-2 bg-white text-xs"
                  />
                </label>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleSavePlanAndLimits}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Check className="size-4" />
                  Guardar plan, módulos y límites
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Client Users & Connectors */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Administradores y usuarios ({users.length} / {client.maxUsers})
            </h3>
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              {users.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Fuentes de datos del cliente ({integrations.length})
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              {integrations.map((intItem) => (
                <div
                  key={intItem.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {intItem.connectorName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        intItem.status === "Error"
                          ? "bg-rose-100 text-rose-800"
                          : intItem.status === "Atención"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {intItem.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {intItem.diagnostic}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
