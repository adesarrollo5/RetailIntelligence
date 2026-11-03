import { useEffect, useRef, useState } from "react"
import { FlaskConical, X } from "lucide-react"
import type { Client, ClientId, Role, RoleDefinition } from "../../types"

export const PLATFORM_ROLES: Role[] = ["Super Admin", "Soporte"]

type Props = {
  clients: Client[]
  rolesByClient: Record<ClientId, RoleDefinition[]>
  clientId: ClientId
  role: Role
  onClientChange: (id: ClientId) => void
  onRoleChange: (role: Role) => void
  onEnter: () => void
}

const selectClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--brand)_18%,transparent)] disabled:bg-slate-50 disabled:text-slate-500"

export function DemoModePanel({
  clients,
  rolesByClient,
  clientId,
  role,
  onClientChange,
  onRoleChange,
  onEnter,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isPlatform = PLATFORM_ROLES.includes(role)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
    >
      {open && (
        <div
          role="dialog"
          aria-label="Modo demo"
          className="w-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Modo demo</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar modo demo"
              className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="demo-client"
                className="mb-1 block text-[13px] font-medium text-slate-700"
              >
                Cliente
              </label>
              <select
                id="demo-client"
                className={selectClass}
                value={clientId}
                disabled={isPlatform}
                onChange={(e) => onClientChange(e.target.value as ClientId)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.plan}
                  </option>
                ))}
              </select>
              {isPlatform && (
                <p className="mt-1 text-xs text-slate-500">
                  La Consola de Plataforma es neutral y no depende del cliente.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="demo-role"
                className="mb-1 block text-[13px] font-medium text-slate-700"
              >
                Rol
              </label>
              <select
                id="demo-role"
                className={selectClass}
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
              >
                <optgroup label="Roles del cliente">
                  {(rolesByClient[clientId] ?? []).map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Equipo de plataforma">
                  {PLATFORM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <button
              type="button"
              onClick={onEnter}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              Entrar
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 shadow-sm hover:text-slate-900 hover:shadow"
      >
        <FlaskConical className="size-3.5" />
        Modo demo
      </button>
    </div>
  )
}
