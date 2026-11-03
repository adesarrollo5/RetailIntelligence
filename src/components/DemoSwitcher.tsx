import { Check, LogOut, X } from "lucide-react"
import type { Client, ClientId, Role, RoleDefinition } from "../types"

type Props = {
  clientsMap: Record<ClientId, Client>
  rolesByClient: Record<ClientId, RoleDefinition[]>
  currentClient: ClientId
  currentRole: Role
  onChange: (client: ClientId, role: Role) => void
  onClose: () => void
  onLogout: () => void
}

export function DemoSwitcher({
  clientsMap,
  rolesByClient,
  currentClient,
  currentRole,
  onChange,
  onClose,
  onLogout,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-950/30 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <aside
        className="h-full w-full max-w-[390px] overflow-y-auto bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">Acceso demo</p>
            <p className="mt-1 text-sm text-slate-500">
              Cambie de cliente y rol al instante.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-6">
          {Object.values(clientsMap).map((client) => (
            <section key={client.id}>
              <div
                className={`rounded-xl border p-4 ${
                  currentClient === client.id
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-lg text-xs font-black text-white"
                    style={{ background: client.color }}
                  >
                    {client.initials}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {client.type === "operator"
                        ? "Operador de centros comerciales"
                        : "Marca o cadena"}{" "}
                      · {client.plan}
                    </p>
                  </div>
                  {currentClient === client.id && (
                    <Check className="size-4 text-[var(--brand)]" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rolesByClient[client.id].map((roleDef) => (
                    <button
                      key={roleDef.id}
                      onClick={() => onChange(client.id, roleDef.name)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        currentClient === client.id &&
                        currentRole === roleDef.name
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {roleDef.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ))}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Equipo de plataforma
            </p>
            <div className="flex gap-2 rounded-xl border border-slate-200 p-3">
              {(["Super Admin", "Soporte"] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => onChange("plaza", role)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    currentRole === role
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="mt-8 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          Los datos de cada cliente están completamente aislados. El cambio de
          contexto solo está disponible en este prototipo.
        </div>
        <button
          onClick={onLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </aside>
    </div>
  )
}
