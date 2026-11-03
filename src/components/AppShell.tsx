import { useEffect, useState } from "react"
import { ArrowLeft, Eye, ShieldAlert } from "lucide-react"
import type {
  AppearanceConfig,
  Client,
  ClientId,
  DataScopeLevel,
  GlobalFilters,
  PageId,
  ParametersConfig,
  Plan,
  Role,
  RoleDefinition,
  TenantUser,
  TerminologyConfig,
} from "../types"
import { applyFaviconToDocument, getFontStack } from "../utils/contrast"
import { DemoSwitcher } from "./DemoSwitcher"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { DashboardPage } from "../pages/DashboardPage"
import { IntegrationsPage } from "../pages/IntegrationsPage"
import { PlaceholderPage } from "../pages/PlaceholderPage"
import { SalesPage } from "../pages/SalesPage"
import { SettingsPage } from "../pages/SettingsPage"
import { StoresPage } from "../pages/StoresPage"
import type { StoreRecord } from "../data/storesData"
import { TrafficConversionPage } from "../pages/TrafficConversionPage"
import { UsersRolesPage } from "../pages/UsersRolesPage"

type Props = {
  client: Client
  clientsMap: Record<ClientId, Client>
  role: Role
  roles: RoleDefinition[]
  rolesByClient: Record<ClientId, RoleDefinition[]>
  users: TenantUser[]
  stores: StoreRecord[]
  onStoresChange: (next: StoreRecord[]) => void
  supportMode?: {
    platformRole: "Super Admin" | "Soporte"
    onExit: () => void
  }
  onContextChange: (client: ClientId, role: Role) => void
  onUpdateAppearance: (next: AppearanceConfig) => void
  onUpdateTerminology: (next: TerminologyConfig) => void
  onUpdateParameters: (next: ParametersConfig) => void
  onUpdatePlan: (nextPlan: Plan) => void
  onInviteUser: (newUser: TenantUser) => void
  onUpdateUser: (updatedUser: TenantUser) => void
  onUpdateRole: (updatedRole: RoleDefinition) => void
  onCloneRole: (
    sourceRoleId: string,
    newName: string,
    scope: DataScopeLevel,
  ) => void
  onLogout: () => void
}

export function AppShell({
  client,
  clientsMap,
  role,
  roles,
  rolesByClient,
  users,
  stores,
  onStoresChange,
  supportMode,
  onContextChange,
  onUpdateAppearance,
  onUpdateTerminology,
  onUpdateParameters,
  onUpdatePlan,
  onInviteUser,
  onUpdateUser,
  onUpdateRole,
  onCloneRole,
  onLogout,
}: Props) {
  const [page, setPage] = useState<PageId>("inicio")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const defaultScopeForClient = (c: Client) =>
    c.type === "operator"
      ? `Todos los ${c.terminology.mallPlural.toLowerCase()}`
      : `Todas las ${c.terminology.storePlural.toLowerCase()}`

  const [filters, setFilters] = useState<GlobalFilters>(() => ({
    scope: defaultScopeForClient(client),
    periodId: "mar_2025",
    compareMode: "prev_period",
  }))

  useEffect(() => {
    document.title = `${client.appearance.productName} · ${client.shortName}`
    applyFaviconToDocument(
      client.initials,
      client.appearance.primaryColor,
      client.appearance.favicon,
      client.appearance.customFaviconUrl,
    )
  }, [client])

  const changeContext = (clientId: ClientId, nextRole: Role) => {
    const nextClient = clientsMap[clientId]
    onContextChange(clientId, nextRole)
    if (nextClient) {
      setFilters((prev) => ({
        ...prev,
        scope: defaultScopeForClient(nextClient),
      }))
    }
    if (
      nextRole !== "Administrador" &&
      (page === "configuracion" || page === "usuarios")
    ) {
      setPage("inicio")
    }
    setDemoOpen(false)
  }

  const isAdmin = role === "Administrador"
  const fontStack = getFontStack(client.appearance.fontFamily)

  return (
    <div
      className="min-h-screen bg-[#f5f6f8]"
      style={
        {
          "--brand": client.color,
          "--brand-dark": client.colorDark,
          "--brand-soft": client.accent,
          "--brand-secondary": client.secondaryColor,
          "--brand-accent": client.accentColor,
          fontFamily: fontStack,
        } as React.CSSProperties
      }
    >
      {supportMode && (
        <div className="sticky top-0 z-[60] border-b border-amber-400/40 bg-slate-950 px-4 py-2.5 text-white shadow-md sm:px-6">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950">
                <Eye className="size-3.5" />
                Modo soporte: viendo como {client.name}
              </span>
              <span className="hidden text-slate-300 sm:inline">
                Sesión auditada ({supportMode.platformRole}) · Subdominio:{" "}
                {client.appearance.subdomain}.retailintelligence.co
              </span>
            </div>
            <button
              type="button"
              onClick={supportMode.onExit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
            >
              <ArrowLeft className="size-3.5" />
              Salir de modo soporte
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-screen">
        <Sidebar
          client={client}
          role={role}
          roles={roles}
          page={page}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapse={() => setCollapsed(!collapsed)}
          onCloseMobile={() => setMobileOpen(false)}
          onNavigate={setPage}
          onOpenDemo={() => setDemoOpen(true)}
        />
        <div className="min-w-0 flex-1">
          <Topbar
            client={client}
            role={role}
            filters={filters}
            onChangeFilters={setFilters}
            onMenu={() => setMobileOpen(true)}
            onDemo={() => setDemoOpen(true)}
          />
          {!isAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-indigo-50/90 px-4 py-2 text-xs text-indigo-950 sm:px-6">
              <span className="flex items-center gap-2 font-medium">
                <Eye className="size-3.5 text-indigo-600" />
                Navegación filtrada según los permisos del rol:{" "}
                <strong>{role}</strong>
              </span>
              <button
                type="button"
                onClick={() => onContextChange(client.id, "Administrador")}
                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
              >
                Volver a Administrador
              </button>
            </div>
          )}
          <main>
            {page === "inicio" ? (
              <DashboardPage client={client} />
            ) : page === "tiendas" ? (
              <StoresPage
                client={client}
                role={role}
                roles={roles}
                filters={filters}
                stores={stores}
                onStoresChange={onStoresChange}
                onNavigate={setPage}
                canOpenSettings={isAdmin}
              />
            ) : page === "integraciones" ? (
              <IntegrationsPage client={client} />
            ) : page === "ventas" ? (
              <SalesPage client={client} filters={filters} />
            ) : page === "trafico" ? (
              <TrafficConversionPage
                client={client}
                filters={filters}
                onSwitchToPlaza={() => changeContext("plaza", "Administrador")}
                onOpenPlanSettings={
                  isAdmin ? () => setPage("configuracion") : undefined
                }
              />
            ) : page === "configuracion" ? (
              isAdmin ? (
                <SettingsPage
                  client={client}
                  onUpdateAppearance={onUpdateAppearance}
                  onUpdateTerminology={onUpdateTerminology}
                  onUpdateParameters={onUpdateParameters}
                  onUpdatePlan={onUpdatePlan}
                />
              ) : (
                <div className="page-wrap">
                  <div className="card p-8 text-center">
                    <ShieldAlert className="mx-auto size-10 text-amber-500" />
                    <h2 className="mt-3 text-lg font-bold text-slate-900">
                      Acceso exclusivo del Administrador del cliente
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      El rol actual ({role}) no tiene acceso al módulo de
                      Configuración.
                    </p>
                  </div>
                </div>
              )
            ) : page === "usuarios" ? (
              isAdmin ? (
                <UsersRolesPage
                  client={client}
                  users={users}
                  roles={roles}
                  onInviteUser={onInviteUser}
                  onUpdateUser={onUpdateUser}
                  onUpdateRole={onUpdateRole}
                  onCloneRole={onCloneRole}
                  onPreviewNavigationAsRole={(roleName) => {
                    onContextChange(client.id, roleName)
                    setPage("inicio")
                  }}
                />
              ) : (
                <div className="page-wrap">
                  <div className="card p-8 text-center">
                    <ShieldAlert className="mx-auto size-10 text-amber-500" />
                    <h2 className="mt-3 text-lg font-bold text-slate-900">
                      Acceso exclusivo del Administrador del cliente
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      El rol actual ({role}) no tiene acceso a Usuarios y roles.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <PlaceholderPage page={page} client={client} />
            )}
          </main>
        </div>
      </div>
      {demoOpen && (
        <DemoSwitcher
          clientsMap={clientsMap}
          rolesByClient={rolesByClient}
          currentClient={client.id}
          currentRole={role}
          onChange={changeContext}
          onClose={() => setDemoOpen(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  )
}
