import { useState } from "react"
import { MailPlus, ShieldCheck, X } from "lucide-react"
import type { Client, RoleDefinition, TenantUser } from "../types"

type Props = {
  client: Client
  roles: RoleDefinition[]
  onInvite: (user: TenantUser) => void
  onClose: () => void
}

export function InviteUserModal({ client, roles, onInvite, onClose }: Props) {
  const defaultRole =
    roles.find((r) => r.name === "Gerente")?.name ?? roles[0]?.name ?? "Lector"

  const scopeChoices =
    client.type === "operator"
      ? [
          `Todos los ${client.terminology.mallPlural.toLowerCase()}`,
          "Plaza Andina Bogotá (Bogotá D.C.)",
          "Plaza Andina Medellín (Medellín, Antioquia)",
          "Plaza Andina Cali (Cali, Valle del Cauca)",
          `Zona Moda · ${client.terminology.storePlural} ancla`,
        ]
      : [
          `Todas las ${client.terminology.storePlural.toLowerCase()} (25 ubicaciones)`,
          "Región Centro · Bogotá D.C. y Chía",
          "Región Antioquia · Medellín, Envigado y Rionegro",
          "Región Occidente · Cali y Pereira",
          "Formato Centro Comercial (16 ubicaciones)",
          "Formato Outlet (4 ubicaciones)",
        ]

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState(defaultRole)
  const [scope, setScope] = useState(scopeChoices[1] ?? scopeChoices[0])
  const [twoFactor, setTwoFactor] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const newUser: TenantUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      scope,
      status: "Invitación pendiente",
      lastAccess: "31/03/2025 · Invitado",
      twoFactor,
    }
    onInvite(newUser)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <MailPlus className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Invitar usuario a {client.shortName}
              </h2>
              <p className="text-xs text-slate-500">
                Asigne rol y alcance de datos aislado para este colaborador.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="field-label">Nombre y apellidos</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Andrés Felipe Quintero"
                className="field h-11 text-xs"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="field-label">Correo corporativo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  client.id === "plaza"
                    ? "nombre@plazaandina.com.co"
                    : "nombre@calzadomontana.co"
                }
                className="field h-11 text-xs"
              />
            </label>

            <label>
              <span className="field-label">Rol asignado</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="field h-11 text-xs font-semibold"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} {r.isSystem ? "" : "(Personalizado)"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Alcance de datos</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="field h-11 text-xs font-semibold"
              >
                {scopeChoices.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={(e) => setTwoFactor(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <div className="text-xs text-emerald-950">
              <p className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="size-4 text-emerald-600" />
                Exigir doble factor (2FA) desde el primer ingreso
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                El usuario deberá vincular una aplicación TOTP al activar su
                cuenta.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button"
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              <MailPlus className="size-4" /> Enviar invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
