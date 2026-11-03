import { useMemo, useState } from "react"
import type { Client, ClientId, Role, RoleDefinition } from "../types"
import type { StoreRecord } from "../data/storesData"
import { DemoModePanel, PLATFORM_ROLES } from "./login/DemoModePanel"
import { LoginForm } from "./login/LoginForm"
import { getLoginTheme } from "./login/loginTheme"

type Props = {
  clientsMap: Record<ClientId, Client>
  rolesByClient: Record<ClientId, RoleDefinition[]>
  storesByClient?: Record<ClientId, StoreRecord[]>
  onLogin: (client: ClientId, role: Role) => void
}

export function LoginPage({
  clientsMap,
  rolesByClient,
  onLogin,
}: Props) {
  const clients = Object.values(clientsMap)
  const [clientId, setClientId] = useState<ClientId>("plaza")
  const [demoRole, setDemoRole] = useState<Role>("Administrador")
  const client = clientsMap[clientId]

  const theme = useMemo(() => getLoginTheme(client), [client])

  const changeClient = (id: ClientId) => {
    setClientId(id)
    const names = (rolesByClient[id] ?? []).map((r) => r.name)
    if (!PLATFORM_ROLES.includes(demoRole) && !names.includes(demoRole)) {
      setDemoRole(names[0] ?? "Administrador")
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col bg-white lg:grid lg:grid-cols-2"
      style={
        {
          "--brand": theme.primary,
          "--brand-dark": theme.primaryDark,
          "--brand-soft": theme.primarySoft,
          fontFamily: theme.fontStack,
        } as React.CSSProperties
      }
    >
      <section
        className="hidden min-h-screen items-center justify-center p-16 xl:p-24 lg:flex"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="w-full max-w-[480px] text-left">
          <h2 className="text-[38px] font-semibold leading-[1.18] tracking-[-0.025em] text-white xl:text-[44px]">
            Ventas, tráfico e inventario de todos sus locales en un solo lugar.
          </h2>
          <p
            className="mt-5 text-lg font-medium leading-7"
            style={{ color: theme.bannerAccent }}
          >
            Retail Intelligence para {client.name}
          </p>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-1 flex-col bg-white">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <LoginForm
            key={clientId}
            client={client}
            theme={theme}
            onSuccess={() => onLogin(clientId, "Administrador")}
          />
        </div>
        <p className="px-6 pb-5 text-xs text-slate-500 max-lg:text-left lg:text-center">
          © 2026 Retail Intelligence
        </p>
      </section>

      <DemoModePanel
        clients={clients}
        rolesByClient={rolesByClient}
        clientId={clientId}
        role={demoRole}
        onClientChange={changeClient}
        onRoleChange={setDemoRole}
        onEnter={() =>
          onLogin(
            PLATFORM_ROLES.includes(demoRole) ? "plaza" : clientId,
            demoRole,
          )
        }
      />
    </main>
  )
}
