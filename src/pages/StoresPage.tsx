import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Download,
  FileUp,
  Filter,
  Lock,
  MapPin,
  PencilLine,
  Search,
  ShieldCheck,
  Store as StoreIcon,
  X,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react"
import { ColombiaMap, type MapPoint } from "../components/stores/ColombiaMap"
import {
  EmptyPanel,
  IntegrationBadge,
  StatusBadge,
  VariationText,
} from "../components/stores/StoreBadges"
import { StoreDetailPanel } from "../components/stores/StoreDetailPanel"
import { StoreFormDrawer } from "../components/stores/StoreFormDrawer"
import { StoreImportModal } from "../components/stores/StoreImportModal"
import { getPeriodMeta } from "../data/analyticsData"
import {
  departments,
  getDepartment,
  getMunicipality,
} from "../data/colombiaGeo"
import { getStoreMetrics } from "../data/storeAnalytics"
import {
  getCategoryOptions,
  getManagerAssignment,
  getParentOptions,
  integrationStateOf,
  integrationStates,
  matchesGlobalScope,
  parentLabelOf,
  storeFormats,
  storeStatuses,
  type ManagerProfile,
  type StoreRecord,
} from "../data/storesData"
import type {
  Client,
  GlobalFilters,
  ModulePermissions,
  PageId,
  Role,
  RoleDefinition,
} from "../types"
import { buildCsv, downloadTextFile } from "../utils/csv"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../utils/formatters"

type Props = {
  client: Client
  role: Role
  roles: RoleDefinition[]
  filters: GlobalFilters
  stores: StoreRecord[]
  onStoresChange: (next: StoreRecord[]) => void
  onNavigate: (page: PageId) => void
  canOpenSettings: boolean
}

type Fil = {
  q: string
  dept: string
  muni: string
  parent: string
  format: string
  category: string
  integration: string
  status: string
}
const emptyFilters: Fil = {
  q: "",
  dept: "",
  muni: "",
  parent: "",
  format: "",
  category: "",
  integration: "",
  status: "",
}

type SortKey = "name" | "sales" | "sqm" | "variation"

const selectCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"

const normalize = (s: string) =>
  s.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const fullPerms: ModulePermissions = {
  ver: true,
  crear: true,
  editar: true,
  eliminar: true,
  exportar: true,
}

export function StoresPage({
  client,
  role,
  roles,
  filters,
  stores,
  onStoresChange,
  onNavigate,
  canOpenSettings,
}: Props) {
  const terms = client.terminology
  const storeLower = terms.storeSingular.toLowerCase()
  const storesLower = terms.storePlural.toLowerCase()
  const period = getPeriodMeta(filters.periodId)

  /* ----------------------------- Permisos ----------------------------- */
  const perms: ModulePermissions =
    role === "Administrador"
      ? fullPerms
      : (roles.find((r) => r.name === role)?.permissions.tiendas ?? {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false,
          exportar: false,
        })

  const isManager = role === "Gerente"
  const [profile, setProfile] = useState<ManagerProfile>("regional")
  const assignment = isManager
    ? getManagerAssignment(client.id, profile)
    : undefined
  const isStoreManager = isManager && profile === "tienda"

  // Alcance de datos: el Gerente solo ve lo asignado a su perfil.
  const scoped = useMemo(() => {
    if (!isManager || !assignment) return stores
    if (assignment.storeIds) {
      return stores.filter((s) => assignment.storeIds!.includes(s.id))
    }
    if (assignment.parents) {
      return stores.filter((s) => assignment.parents!.includes(s.parent))
    }
    return stores
  }, [stores, isManager, assignment])

  const allowedParents = useMemo(
    () =>
      isManager && assignment?.parents
        ? assignment.parents
        : getParentOptions(client),
    [isManager, assignment, client],
  )

  const atCapacity = stores.length >= client.maxLocations
  const canCreate = perms.crear && !isStoreManager
  const canEditStore = perms.editar

  /* ------------------------------ Estado UI ------------------------------ */
  const [fil, setFil] = useState<Fil>(emptyFilters)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "sales",
    dir: -1,
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openId, setOpenId] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<{ mode: "new" } | {
    mode: "edit"
    store: StoreRecord
  } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  // Al cambiar de cliente o de perfil, se reinicia la navegación interna.
  useEffect(() => {
    setFil(emptyFilters)
    setPage(1)
    setOpenId(null)
    setDrawer(null)
  }, [client.id, profile, role])

  const setFilter = (patch: Partial<Fil>) => {
    setFil((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  /* ------------------------------ Derivados ------------------------------ */
  const rows = useMemo(
    () =>
      scoped
        .filter((s) => matchesGlobalScope(s, filters.scope))
        .map((s) => ({
          store: s,
          m: getStoreMetrics(s, filters.periodId, filters.compareMode),
          integration: integrationStateOf(s),
        })),
    [scoped, filters.scope, filters.periodId, filters.compareMode],
  )

  const matchesExceptMuni = (r: typeof rows[number]) => {
    const s = r.store
    if (fil.q) {
      const muni = getMunicipality(s.muniCode)
      const hay = normalize(
        `${s.name} ${s.code} ${s.address} ${s.zone} ${muni?.name ?? ""}`,
      )
      if (!hay.includes(normalize(fil.q.trim()))) return false
    }
    if (fil.dept && s.deptCode !== fil.dept) return false
    if (fil.parent && s.parent !== fil.parent) return false
    if (fil.format && s.format !== fil.format) return false
    if (fil.category && s.category !== fil.category) return false
    if (fil.integration && r.integration !== fil.integration) return false
    if (fil.status && s.status !== fil.status) return false
    return true
  }

  const filteredNoMuni = rows.filter(matchesExceptMuni)
  const filtered = filteredNoMuni.filter(
    (r) => !fil.muni || r.store.muniCode === fil.muni,
  )

  const sorted = [...filtered].sort((a, b) => {
    let d = 0
    if (sort.key === "name") d = a.store.name.localeCompare(b.store.name, "es")
    else if (sort.key === "sales") d = a.m.netSales - b.m.netSales
    else if (sort.key === "sqm") d = a.store.sqm - b.store.sqm
    else d = a.m.variation - b.m.variation
    return d * sort.dir || a.store.name.localeCompare(b.store.name, "es")
  })

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const mapPoints: MapPoint[] = useMemo(() => {
    const byMuni = new Map<string, MapPoint>()
    filteredNoMuni.forEach((r) => {
      const p = byMuni.get(r.store.muniCode) ?? {
        muniCode: r.store.muniCode,
        stores: 0,
        sales: 0,
      }
      p.stores += 1
      p.sales += r.m.netSales
      byMuni.set(r.store.muniCode, p)
    })
    return [...byMuni.values()]
  }, [filteredNoMuni])

  const ranking = [...mapPoints].sort((a, b) => b.sales - a.sales)
  const maxCitySales = Math.max(1, ...ranking.map((p) => p.sales))

  const deptOptions = departments.filter((d) =>
    scoped.some((s) => s.deptCode === d.code),
  )
  const muniOptions = useMemo(() => {
    const seen = new Map<string, string>()
    scoped.forEach((s) => {
      if (fil.dept && s.deptCode !== fil.dept) return
      const m = getMunicipality(s.muniCode)
      if (m) seen.set(m.code, m.name)
    })
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
  }, [scoped, fil.dept])
  const parentOptions = [...new Set(scoped.map((s) => s.parent))].sort((a, b) =>
    a.localeCompare(b, "es"),
  )

  const activeFilterCount = Object.entries(fil).filter(
    ([k, v]) => k !== "q" && v,
  ).length
  const hasAnyFilter = activeFilterCount > 0 || fil.q !== ""

  const totals = {
    total: scoped.length,
    active: scoped.filter((s) => s.status === "Activa").length,
    opening: scoped.filter((s) => s.status === "En apertura").length,
    issues: scoped.filter((s) => {
      const i = integrationStateOf(s)
      return i === "Error" || i === "Atención"
    }).length,
    sales: rows.reduce((a, r) => a + r.m.netSales, 0),
  }

  /* ----------------------------- Acciones ----------------------------- */
  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: (s.dir * -1) as 1 | -1 }
        : { key, dir: key === "name" ? 1 : -1 },
    )

  const exportCsv = () => {
    const header = [
      "codigo",
      "nombre",
      parentLabelOf(client).toLowerCase(),
      "zona_piso",
      "formato",
      "categoria",
      "m2",
      "departamento",
      "municipio",
      "dane_municipio",
      "estado",
      "integracion",
      `ventas_netas_${filters.periodId}`,
      "variacion_pct",
    ]
    const body = sorted.map((r) => [
      r.store.code,
      r.store.name,
      r.store.parent,
      r.store.zone,
      r.store.format,
      r.store.category,
      String(r.store.sqm).replace(".", ","),
      getDepartment(r.store.deptCode)?.name ?? "",
      getMunicipality(r.store.muniCode)?.name ?? "",
      r.store.muniCode,
      r.store.status,
      r.integration,
      String(r.m.netSales),
      formatDecimalCO(r.m.variation, 1),
    ])
    downloadTextFile(
      `${storesLower.replace(/\s+/g, "-")}-${client.id}.csv`,
      buildCsv([header, ...body], ";"),
    )
    setToast(
      `Se exportaron ${formatNumberCO(body.length)} ${storesLower} a CSV.`,
    )
  }

  const handleSave = (store: StoreRecord, isNew: boolean) => {
    onStoresChange(
      isNew
        ? [store, ...stores]
        : stores.map((s) => (s.id === store.id ? store : s)),
    )
    setDrawer(null)
    setToast(
      isNew
        ? `${terms.storeSingular} «${store.name}» creada correctamente.`
        : `Cambios guardados en «${store.name}».`,
    )
  }

  const handleImport = (imported: StoreRecord[]) => {
    onStoresChange([...imported, ...stores])
    setImportOpen(false)
    setToast(
      `Se importaron ${formatNumberCO(imported.length)} ${
        imported.length === 1 ? storeLower : storesLower
      } al ${client.type === "operator" ? "portafolio" : "directorio"}.`,
    )
  }

  /* ------------------------------ Detalle ------------------------------ */
  // El gerente de tienda abre directamente su ficha.
  const autoOpenId = isStoreManager && scoped.length === 1 ? scoped[0].id : null
  const detailStore = scoped.find((s) => s.id === (openId ?? autoOpenId))

  const overlays = (
    <>
      {drawer && (
        <StoreFormDrawer
          client={client}
          stores={stores}
          editing={drawer.mode === "edit" ? drawer.store : null}
          allowedParents={allowedParents}
          limitedEdit={isStoreManager}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
        />
      )}
      {importOpen && (
        <StoreImportModal
          client={client}
          stores={stores}
          allowedParents={allowedParents}
          onConfirm={handleImport}
          onClose={() => setImportOpen(false)}
        />
      )}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          {toast}
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </>
  )

  const managerBanner = isManager && assignment && (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
      <div className="flex items-start gap-2.5 text-xs text-indigo-950">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <p>
          <strong>{assignment.personName}</strong> ·{" "}
          {profile === "regional"
            ? client.type === "operator"
              ? "Gerente de centro comercial"
              : "Gerente regional"
            : "Gerente de tienda"}
          . Solo ve{" "}
          {profile === "regional" ? `las ${storesLower} de` : "la ficha de"}{" "}
          <strong>{assignment.label}</strong>.
        </p>
      </div>
      <div
        className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-indigo-200"
        role="group"
        aria-label="Perfil de gerente en la demostración"
      >
        {([
          [
            "regional",
            client.type === "operator" ? "Gerente de CC" : "Gerente regional",
          ],
          ["tienda", "Gerente de tienda"],
        ] as Array<[ManagerProfile, string]>).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={profile === id}
            onClick={() => setProfile(id)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
              profile === id
                ? "bg-indigo-600 text-white"
                : "text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  if (detailStore) {
    return (
      <>
        {isManager && <div className="page-wrap !pb-0">{managerBanner}</div>}
        <StoreDetailPanel
          client={client}
          store={detailStore}
          filters={filters}
          hideBack={autoOpenId !== null}
          canEdit={canEditStore}
          canManageIntegration={perms.editar}
          onBack={() => setOpenId(null)}
          onEdit={() => setDrawer({ mode: "edit", store: detailStore })}
          onOpenIntegrationsPage={
            roles.find((r) => r.name === role)?.permissions.integraciones
              ?.ver || role === "Administrador"
              ? () => onNavigate("integraciones")
              : undefined
          }
          onOpenPlanSettings={
            canOpenSettings ? () => onNavigate("configuracion") : undefined
          }
        />
        {overlays}
      </>
    )
  }

  /* ------------------------------- Listado ------------------------------- */
  const sortHeader = (key: SortKey, label: string, align = "text-left") => (
    <th
      aria-sort={
        sort.key === key
          ? sort.dir === 1
            ? "ascending"
            : "descending"
          : "none"
      }
      className={align}
    >
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-slate-700"
      >
        {label}
        <ArrowUpDown
          className={`size-3 ${sort.key === key ? "text-[var(--brand)]" : ""}`}
        />
      </button>
    </th>
  )

  return (
    <div className="page-wrap">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{terms.storePlural}</h1>
          <p className="page-subtitle">
            {client.type === "operator"
              ? `Portafolio de ${storesLower} de ${client.name}: estructura, desempeño y contratos por ubicación.`
              : `Red de ${storesLower} de ${client.name}: estructura y desempeño por ubicación.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {perms.exportar && (
            <button
              type="button"
              className="secondary-button"
              onClick={exportCsv}
              disabled={sorted.length === 0}
            >
              <Download className="size-4" />
              Exportar CSV
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setImportOpen(true)}
              disabled={atCapacity}
            >
              <FileUp className="size-4" />
              Importar CSV
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setDrawer({ mode: "new" })}
              disabled={atCapacity}
              title={
                atCapacity
                  ? `Límite del plan alcanzado (${client.maxLocations})`
                  : undefined
              }
            >
              <CirclePlus className="size-4" />
              Nueva {storeLower}
            </button>
          )}
        </div>
      </div>

      {managerBanner}

      {!perms.crear && !isManager && (
        <p className="mb-4 flex items-center gap-2 text-[11px] text-slate-500">
          <Lock className="size-3.5" />
          El rol {role} tiene acceso de consulta. La creación y edición de{" "}
          {storesLower} está reservada a roles con permiso de gestión.
        </p>
      )}
      {atCapacity && canCreate && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Se alcanzó el límite de {formatNumberCO(client.maxLocations)}{" "}
          {storesLower} del plan {client.plan}. Amplíe el plan para registrar
          más ubicaciones.
        </p>
      )}

      {scoped.length === 0 ? (
        <EmptyPanel
          title={`Aún no hay ${storesLower} registradas`}
          description={`Cree la primera ${storeLower} o impórtelas masivamente desde un archivo CSV.`}
          action={
            canCreate && (
              <button
                type="button"
                className="primary-button"
                onClick={() => setDrawer({ mode: "new" })}
              >
                <CirclePlus className="size-4" />
                Nueva {storeLower}
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Resumen + mapa */}
          {!isStoreManager && (
            <section className="card overflow-hidden">
              <div className="grid lg:grid-cols-[minmax(300px,380px)_1fr]">
                <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
                  <ColombiaMap
                    points={mapPoints}
                    selectedMuniCode={fil.muni}
                    onSelect={(code) => setFilter({ muni: code, dept: "" })}
                    storeLabelPlural={terms.storePlural}
                    periodLabel={period.shortLabel}
                  />
                </div>
                <div className="flex flex-col p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      [terms.storePlural, formatNumberCO(totals.total)],
                      ["Activas", formatNumberCO(totals.active)],
                      ["En apertura", formatNumberCO(totals.opening)],
                      [
                        "Con alerta de integración",
                        formatNumberCO(totals.issues),
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[11px] font-semibold text-slate-400">
                          {k}
                        </p>
                        <p className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-950">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-baseline justify-between border-t border-slate-100 pt-4">
                    <div>
                      <h2 className="section-title">Ventas por ciudad</h2>
                      <p className="section-subtitle">
                        {period.label} · {formatCOP(totals.sales)} en total
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Plan {client.plan}: {formatNumberCO(stores.length)} de{" "}
                      {formatNumberCO(client.maxLocations)}
                    </span>
                  </div>
                  <ul className="mt-3 max-h-[260px] space-y-1 overflow-y-auto pr-1">
                    {ranking.map((p) => {
                      const muni = getMunicipality(p.muniCode)
                      const selected = fil.muni === p.muniCode
                      return (
                        <li key={p.muniCode}>
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setFilter({
                                muni: selected ? "" : p.muniCode,
                                dept: "",
                              })
                            }
                            className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-4 rounded-lg px-3 py-2 text-left ${
                              selected
                                ? "bg-[var(--brand-soft)]"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                              <MapPin className="size-3.5 text-slate-400" />
                              {muni?.name}
                              <span className="font-normal text-slate-400">
                                {p.stores}{" "}
                                {p.stores === 1 ? storeLower : storesLower}
                              </span>
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {formatCOP(p.sales)}
                            </span>
                            <span className="col-span-2 mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                              <span
                                className="block h-full rounded-full bg-[var(--brand)]"
                                style={{
                                  width: `${(p.sales / maxCitySales) * 100}%`,
                                }}
                              />
                            </span>
                          </button>
                        </li>
                      )
                    })}
                    {ranking.length === 0 && (
                      <li className="py-6 text-center text-xs text-slate-400">
                        Ninguna ciudad coincide con los filtros.
                      </li>
                    )}
                  </ul>
                  <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <SegmentBar
                      title="Por formato"
                      segments={storeFormats.map((f, i) => ({
                        label: f,
                        count: scoped.filter((s) => s.format === f).length,
                        color: [client.color, client.secondaryColor, client.accentColor][i],
                        active: fil.format === f,
                        onClick: () => setFilter({ format: fil.format === f ? "" : f }),
                      }))}
                    />
                    <SegmentBar
                      title="Estado de integración"
                      segments={integrationStates.map((st) => ({
                        label: st,
                        count: scoped.filter((s) => integrationStateOf(s) === st).length,
                        color: {
                          Conectado: "#10b981",
                          Atención: "#f59e0b",
                          Error: "#f43f5e",
                          "Sin integración": "#cbd5e1",
                        }[st],
                        active: fil.integration === st,
                        onClick: () =>
                          setFilter({ integration: fil.integration === st ? "" : st }),
                      }))}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Filtros */}
          <section className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={fil.q}
                  onChange={(e) => setFilter({ q: e.target.value })}
                  placeholder={`Buscar por nombre, código, dirección o ciudad`}
                  aria-label={`Buscar ${storesLower}`}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                />
              </div>
              {hasAnyFilter && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] hover:underline"
                  onClick={() => {
                    setFil(emptyFilters)
                    setPage(1)
                  }}
                >
                  <X className="size-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>
            {!isStoreManager && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                <label className="block">
                  <span className="sr-only">Departamento</span>
                  <select
                    className={selectCls}
                    value={fil.dept}
                    onChange={(e) => {
                      const dept = e.target.value
                      const muniOk =
                        !fil.muni ||
                        !dept ||
                        getMunicipality(fil.muni)?.deptCode === dept
                      setFilter({ dept, muni: muniOk ? fil.muni : "" })
                    }}
                  >
                    <option value="">Todos los departamentos</option>
                    {deptOptions.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Ciudad</span>
                  <select
                    className={selectCls}
                    value={fil.muni}
                    onChange={(e) => setFilter({ muni: e.target.value })}
                  >
                    <option value="">Todas las ciudades</option>
                    {muniOptions.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">{parentLabelOf(client)}</span>
                  <select
                    className={selectCls}
                    value={fil.parent}
                    onChange={(e) => setFilter({ parent: e.target.value })}
                  >
                    <option value="">
                      {client.type === "operator"
                        ? `Todos los ${terms.mallPlural.toLowerCase()}`
                        : "Todas las regiones"}
                    </option>
                    {parentOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Formato</span>
                  <select
                    className={selectCls}
                    value={fil.format}
                    onChange={(e) => setFilter({ format: e.target.value })}
                  >
                    <option value="">Todos los formatos</option>
                    {storeFormats.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Categoría</span>
                  <select
                    className={selectCls}
                    value={fil.category}
                    onChange={(e) => setFilter({ category: e.target.value })}
                  >
                    <option value="">Todas las categorías</option>
                    {getCategoryOptions(client).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Estado de integración</span>
                  <select
                    className={selectCls}
                    value={fil.integration}
                    onChange={(e) => setFilter({ integration: e.target.value })}
                  >
                    <option value="">Toda integración</option>
                    {integrationStates.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="sr-only">Estado de la {storeLower}</span>
                  <select
                    className={selectCls}
                    value={fil.status}
                    onChange={(e) => setFilter({ status: e.target.value })}
                  >
                    <option value="">Todos los estados</option>
                    {storeStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {filters.scope &&
              !filters.scope.startsWith("Todos") &&
              !filters.scope.startsWith("Todas") && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Filter className="size-3" />
                  Filtro global de alcance activo:{" "}
                  <strong>{filters.scope}</strong>
                </p>
              )}
          </section>

          {/* Tabla */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
              <h2 className="section-title">
                {formatNumberCO(sorted.length)}{" "}
                {sorted.length === 1 ? storeLower : storesLower}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ventas de {period.label}
                </span>
              </h2>
            </div>
            {sorted.length === 0 ? (
              <div className="px-6 pb-12 pt-6 text-center">
                <StoreIcon className="mx-auto size-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  Sin resultados
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Ninguna {storeLower} coincide con la búsqueda y los filtros
                  aplicados.
                </p>
                <button
                  type="button"
                  className="secondary-button mt-4"
                  onClick={() => {
                    setFil(emptyFilters)
                    setPage(1)
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="data-table !min-w-[1040px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
                  <thead>
                    <tr>
                      {sortHeader("name", terms.storeSingular)}
                      <th>Ubicación</th>
                      <th>{parentLabelOf(client)}</th>
                      <th>Formato · categoría</th>
                      {sortHeader("sqm", "m²", "text-right")}
                      {sortHeader("sales", "Ventas netas", "text-right")}
                      {sortHeader("variation", "Var.", "text-right")}
                      <th>Estado</th>
                      <th>Integración</th>
                      <th className="w-10">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ store: s, m, integration }) => {
                      const muni = getMunicipality(s.muniCode)
                      const dept = getDepartment(s.deptCode)
                      return (
                        <tr key={s.id}>
                          <td className="min-w-[200px]">
                            <button
                              type="button"
                              onClick={() => setOpenId(s.id)}
                              className="text-left"
                            >
                              <strong className="hover:text-[var(--brand)] hover:underline">
                                {s.name}
                              </strong>
                              <span className="font-mono">
                                {s.code} · {s.zone}
                              </span>
                            </button>
                          </td>
                          <td className="whitespace-nowrap">
                            <strong className="font-semibold">
                              {muni?.name}
                            </strong>
                            <span>{dept?.name}</span>
                          </td>
                          <td className="whitespace-nowrap">{s.parent}</td>
                          <td className="whitespace-nowrap">
                            <strong className="font-semibold">
                              {s.format}
                            </strong>
                            <span>{s.category}</span>
                          </td>
                          <td className="text-right tabular-nums">
                            {s.sqm % 1 === 0
                              ? formatNumberCO(s.sqm)
                              : formatDecimalCO(s.sqm, 1)}
                          </td>
                          <td className="whitespace-nowrap text-right tabular-nums">
                            {m.hasData ? (
                              <strong className="!inline text-slate-800">
                                {formatCOP(m.netSales)}
                              </strong>
                            ) : (
                              <span className="!inline text-slate-300">—</span>
                            )}
                          </td>
                          <td className="text-right">
                            <VariationText
                              value={m.variation}
                              hidden={!m.hasData}
                            />
                          </td>
                          <td>
                            <StatusBadge status={s.status} />
                          </td>
                          <td>
                            <IntegrationBadge state={integration} />
                          </td>
                          <td>
                            {canEditStore && (
                              <button
                                type="button"
                                aria-label={`Editar ${s.name}`}
                                title="Editar"
                                onClick={() =>
                                  setDrawer({ mode: "edit", store: s })
                                }
                                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <PencilLine className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {sorted.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Filas por página</span>
                  <select
                    aria-label="Filas por página"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold"
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <span className="ml-2">
                    {formatNumberCO((safePage - 1) * pageSize + 1)}–
                    {formatNumberCO(
                      Math.min(safePage * pageSize, sorted.length),
                    )}{" "}
                    de {formatNumberCO(sorted.length)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Página anterior"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                    className="grid size-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    Página {safePage} de {pageCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Página siguiente"
                    disabled={safePage >= pageCount}
                    onClick={() => setPage(safePage + 1)}
                    className="grid size-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {overlays}
    </div>
  )
}

function SegmentBar({
  title,
  segments,
}: {
  title: string
  segments: Array<{
    label: string
    count: number
    color: string
    active: boolean
    onClick: () => void
  }>
}) {
  const total = Math.max(
    1,
    segments.reduce((a, s) => a + s.count, 0),
  )
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400">{title}</p>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) => (
          <span
            key={s.label}
            title={`${s.label}: ${s.count}`}
            style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
          />
        ))}
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        {segments.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              aria-pressed={s.active}
              onClick={s.onClick}
              className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] ${
                s.active ? "bg-[var(--brand-soft)] font-bold" : "hover:bg-slate-50"
              }`}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-slate-600">{s.label}</span>
              <span className="ml-auto font-bold text-slate-800">
                {formatNumberCO(s.count)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
