import { useState } from "react"
import { AppShell } from "./components/AppShell"
import { LoginPage } from "./components/LoginPage"
import {
  buildRoleDefinitions,
  clients as initialClients,
  initialUsersByClient,
} from "./data/demo"
import {
  initialAuditLogs,
  initialPlatformIntegrations,
} from "./data/platformData"
import { initialStoresByClient, type StoreRecord } from "./data/storesData"
import { PlatformConsolePage } from "./pages/PlatformConsolePage"
import type {
  AppearanceConfig,
  Client,
  ClientId,
  DataScopeLevel,
  ParametersConfig,
  Plan,
  PlatformAuditEntry,
  PlatformIntegrationSource,
  Role,
  RoleDefinition,
  TenantUser,
  TerminologyConfig,
} from "./types"
import { darkenHex, softTintHex } from "./utils/contrast"

export default function App() {
  const [session, setSession] = useState<{
    client: ClientId
    role: Role
  } | null>(null)
  const [supportViewClient, setSupportViewClient] = useState<ClientId | null>(
    null,
  )

  const [clientsState, setClientsState] =
    useState<Record<ClientId, Client>>(initialClients)

  const [rolesByClient, setRolesByClient] =
    useState<Record<ClientId, RoleDefinition[]>>(() => ({
      plaza: buildRoleDefinitions("plaza", "operator"),
      montana: buildRoleDefinitions("montana", "brand"),
    }))

  const [usersByClient, setUsersByClient] =
    useState<Record<ClientId, TenantUser[]>>(initialUsersByClient)
  const [storesByClient, setStoresByClient] =
    useState<Record<ClientId, StoreRecord[]>>(initialStoresByClient)
  const [integrationsState, setIntegrationsState] =
    useState<PlatformIntegrationSource[]>(initialPlatformIntegrations)
  const [auditLogsState, setAuditLogsState] =
    useState<PlatformAuditEntry[]>(initialAuditLogs)

  const nowFormatted = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `31/03/2025 ${pad(now.getHours())}:${pad(now.getMinutes())}`
  }

  if (!session) {
    return (
      <LoginPage
        clientsMap={clientsState}
        rolesByClient={rolesByClient}
        storesByClient={storesByClient}
        onLogin={(client, role) => {
          setSupportViewClient(null)
          setSession({ client, role })
        }}
      />
    )
  }

  const isPlatformRole =
    session.role === "Super Admin" || session.role === "Soporte"

  if (isPlatformRole && !supportViewClient) {
    const platformRole = session.role as "Super Admin" | "Soporte"
    const actorEmail =
      platformRole === "Super Admin"
        ? "superadmin@retailintelligence.co"
        : "soporte@retailintelligence.co"

    return (
      <PlatformConsolePage
        platformRole={platformRole}
        onChangePlatformRole={(nextRole) =>
          setSession((prev) => (prev ? { ...prev, role: nextRole } : null))
        }
        clientsMap={clientsState}
        usersByClient={usersByClient}
        integrations={integrationsState}
        auditLogs={auditLogsState}
        onCreateClient={(newClient, initialAdmin) => {
          setClientsState((prev) => ({
            ...prev,
            [newClient.id]: newClient,
          }))
          setRolesByClient((prev) => ({
            ...prev,
            [newClient.id]: buildRoleDefinitions(newClient.id, newClient.type),
          }))
          const adminUser: TenantUser = {
            id: `usr-${newClient.id}-1`,
            name: initialAdmin.name,
            email: initialAdmin.email,
            role: "Administrador",
            scope: "Todo el cliente",
            status: "Invitación pendiente",
            lastAccess: "Invitación enviada (31/03/2025)",
            twoFactor: true,
          }
          setUsersByClient((prev) => ({
            ...prev,
            [newClient.id]: [adminUser],
          }))
          const newConnector: PlatformIntegrationSource = {
            id: `int-${newClient.id}-1`,
            clientId: newClient.id,
            clientName: newClient.name,
            clientColor: newClient.color,
            clientInitials: newClient.initials,
            connectorName:
              newClient.type === "operator"
                ? "Siesa Enterprise POS Cloud"
                : "Vendty Retail POS",
            kind: "POS · Ventas",
            scope: `${newClient.locations} ${newClient.entityLabelPlural}`,
            status: "Conectado",
            lastSync: nowFormatted(),
            quality: 99,
            latencyMs: 310,
            records24h: newClient.locations * 315,
            diagnostic: "Conector inicial aprovisionado y verificado en SLA",
          }
          setIntegrationsState((prev) => [newConnector, ...prev])
          setAuditLogsState((prev) => [
            {
              id: `aud-${Date.now()}-2`,
              timestamp: nowFormatted(),
              actorEmail,
              actorRole: platformRole,
              clientName: newClient.name,
              clientId: newClient.id,
              action: "Invitación de primer Administrador",
              targetObject: `${initialAdmin.name} (${initialAdmin.email})`,
              category: "seguridad",
            },
            {
              id: `aud-${Date.now()}-1`,
              timestamp: nowFormatted(),
              actorEmail,
              actorRole: platformRole,
              clientName: newClient.name,
              clientId: newClient.id,
              action: "Creación de nuevo cliente (Wizard)",
              targetObject: `Plan ${newClient.plan} · Subdominio ${newClient.appearance.subdomain}.retailintelligence.co`,
              category: "cliente",
            },
            ...prev,
          ])
        }}
        onUpdateClientConfig={(clientId, updates, auditDesc, auditCat) => {
          const target = clientsState[clientId]
          if (!target) return
          setClientsState((prev) => ({
            ...prev,
            [clientId]: {
              ...prev[clientId],
              ...(updates.plan !== undefined ? { plan: updates.plan } : {}),
              ...(updates.extraModules !== undefined
                ? { extraModules: updates.extraModules }
                : {}),
              ...(updates.maxLocations !== undefined
                ? { maxLocations: updates.maxLocations }
                : {}),
              ...(updates.maxUsers !== undefined
                ? { maxUsers: updates.maxUsers }
                : {}),
              ...(updates.status !== undefined
                ? { status: updates.status }
                : {}),
            },
          }))
          setAuditLogsState((prev) => [
            {
              id: `aud-${Date.now()}`,
              timestamp: nowFormatted(),
              actorEmail,
              actorRole: platformRole,
              clientName: target.name,
              clientId,
              action:
                updates.status !== undefined
                  ? `Cliente marcado como ${updates.status}`
                  : "Actualización de plan, módulos o límites",
              targetObject: auditDesc,
              category: auditCat,
            },
            ...prev,
          ])
        }}
        onViewAsClient={(clientId, reason) => {
          const target = clientsState[clientId]
          if (!target) return
          setAuditLogsState((prev) => [
            {
              id: `aud-${Date.now()}`,
              timestamp: nowFormatted(),
              actorEmail,
              actorRole: platformRole,
              clientName: target.name,
              clientId,
              action: "Inicio de sesión asistida (Ver como cliente)",
              targetObject:
                reason ??
                `Acceso en modo soporte a ${target.name} (${target.appearance.subdomain}.retailintelligence.co)`,
              category: "soporte",
            },
            ...prev,
          ])
          setSupportViewClient(clientId)
        }}
        onLogout={() => {
          setSupportViewClient(null)
          setSession(null)
        }}
      />
    )
  }

  const activeClientId =
    isPlatformRole && supportViewClient ? supportViewClient : session.client
  const currentClient =
    clientsState[activeClientId] ?? Object.values(clientsState)[0]
  const effectiveRoleInClient: Role = isPlatformRole
    ? "Administrador"
    : session.role

  const updateAppearance = (next: AppearanceConfig) => {
    setClientsState((prev) => ({
      ...prev,
      [currentClient.id]: {
        ...prev[currentClient.id],
        color: next.primaryColor,
        colorDark: darkenHex(next.primaryColor, 0.24),
        accent: softTintHex(next.primaryColor, 0.89),
        secondaryColor: next.secondaryColor,
        accentColor: next.accentColor,
        appearance: next,
      },
    }))
  }

  const updateTerminology = (next: TerminologyConfig) => {
    setClientsState((prev) => ({
      ...prev,
      [currentClient.id]: {
        ...prev[currentClient.id],
        entityLabel: next.storeSingular.toLowerCase(),
        entityLabelPlural: next.storePlural.toLowerCase(),
        terminology: next,
      },
    }))
  }

  const updateParameters = (next: ParametersConfig) => {
    setClientsState((prev) => ({
      ...prev,
      [currentClient.id]: {
        ...prev[currentClient.id],
        parameters: next,
      },
    }))
  }

  const updatePlan = (nextPlan: Plan) => {
    setClientsState((prev) => ({
      ...prev,
      [currentClient.id]: {
        ...prev[currentClient.id],
        plan: nextPlan,
      },
    }))
  }

  const inviteUser = (newUser: TenantUser) => {
    setUsersByClient((prev) => ({
      ...prev,
      [currentClient.id]: [newUser, ...(prev[currentClient.id] ?? [])],
    }))
  }

  const updateUser = (updatedUser: TenantUser) => {
    setUsersByClient((prev) => ({
      ...prev,
      [currentClient.id]: (prev[currentClient.id] ?? []).map((u) =>
        u.id === updatedUser.id ? updatedUser : u,
      ),
    }))
  }

  const updateRole = (updatedRole: RoleDefinition) => {
    setRolesByClient((prev) => ({
      ...prev,
      [currentClient.id]: (prev[currentClient.id] ?? []).map((r) =>
        r.id === updatedRole.id ? updatedRole : r,
      ),
    }))
  }

  const cloneRole = (
    sourceRoleId: string,
    newName: string,
    scope: DataScopeLevel,
  ) => {
    setRolesByClient((prev) => {
      const list = prev[currentClient.id] ?? []
      const source =
        list.find((r) => r.id === sourceRoleId) ?? list[1] ?? list[0]
      const clonedPermissions = JSON.parse(
        JSON.stringify(source.permissions),
      ) as RoleDefinition["permissions"]
      // Garantizar que roles clonados no accedan a Configuración ni Usuarios
      clonedPermissions.usuarios = {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        exportar: false,
      }
      clonedPermissions.configuracion = {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        exportar: false,
      }
      const newRole: RoleDefinition = {
        id: newName,
        name: newName,
        description: `Clonado de ${source.name} · Alcance: ${scope}`,
        isSystem: false,
        isAdminRole: false,
        defaultScope: scope,
        permissions: clonedPermissions,
      }
      return {
        ...prev,
        [currentClient.id]: [...list, newRole],
      }
    })
  }

  return (
    <AppShell
      client={currentClient}
      clientsMap={clientsState}
      role={effectiveRoleInClient}
      roles={rolesByClient[currentClient.id] ?? []}
      rolesByClient={rolesByClient}
      users={usersByClient[currentClient.id] ?? []}
      stores={storesByClient[currentClient.id] ?? []}
      onStoresChange={(next) =>
        setStoresByClient((prev) => ({ ...prev, [currentClient.id]: next }))
      }
      supportMode={
        isPlatformRole && supportViewClient
          ? {
              platformRole: session.role as "Super Admin" | "Soporte",
              onExit: () => setSupportViewClient(null),
            }
          : undefined
      }
      onContextChange={(client, role) => {
        if (role === "Super Admin" || role === "Soporte") {
          setSupportViewClient(null)
        }
        setSession({ client, role })
      }}
      onUpdateAppearance={updateAppearance}
      onUpdateTerminology={updateTerminology}
      onUpdateParameters={updateParameters}
      onUpdatePlan={updatePlan}
      onInviteUser={inviteUser}
      onUpdateUser={updateUser}
      onUpdateRole={updateRole}
      onCloneRole={cloneRole}
      onLogout={() => {
        setSupportViewClient(null)
        setSession(null)
      }}
    />
  )
}
