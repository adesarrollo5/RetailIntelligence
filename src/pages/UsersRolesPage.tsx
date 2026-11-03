import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Search,
  ShieldCheck,
  Sliders,
  UserPlus,
  Users,
} from "lucide-react"
import { InviteUserModal } from "../components/InviteUserModal"
import { RoleMatrixEditor } from "../components/RoleMatrixEditor"
import type {
  Client,
  DataScopeLevel,
  RoleDefinition,
  TenantUser,
  UserStatus,
} from "../types"

type Props = {
  client: Client
  users: TenantUser[]
  roles: RoleDefinition[]
  onInviteUser: (newUser: TenantUser) => void
  onUpdateUser: (updatedUser: TenantUser) => void
  onUpdateRole: (updatedRole: RoleDefinition) => void
  onCloneRole: (
    sourceRoleId: string,
    newName: string,
    scope: DataScopeLevel,
  ) => void
  onPreviewNavigationAsRole: (roleName: string) => void
}

export function UsersRolesPage({
  client,
  users,
  roles,
  onInviteUser,
  onUpdateUser,
  onUpdateRole,
  onCloneRole,
  onPreviewNavigationAsRole,
}: Props) {
  const [view, setView] = useState<"usuarios" | "roles">("usuarios")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    roles[0]?.id ?? "Administrador",
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  const notify = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3400)
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.scope.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  const activeCount = users.filter((u) => u.status === "Activo").length
  const twoFactorCount = users.filter((u) => u.twoFactor).length

  const cycleStatus = (status: UserStatus): UserStatus => {
    if (status === "Activo") return "Suspendido"
    return "Activo"
  }

  return (
    <div className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
            <ShieldCheck className="size-3.5" /> Acceso exclusivo ·
            Administrador del cliente
          </p>
          <h1 className="page-title">Usuarios y roles</h1>
          <p className="page-subtitle">
            Administre colaboradores, estado de doble factor (2FA), alcance de
            datos y matriz de permisos de {client.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {feedback && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="primary-button"
          >
            <UserPlus className="size-4" /> Invitar usuario
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <article className="card flex items-center gap-4 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900">
              {activeCount} / {users.length}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Usuarios activos en {client.shortName}
            </p>
          </div>
        </article>

        <article className="card flex items-center gap-4 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <KeyRound className="size-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900">
              {Math.round((twoFactorCount / Math.max(1, users.length)) * 100)}%
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Cobertura de doble factor (2FA)
            </p>
          </div>
        </article>

        <article className="card flex items-center gap-4 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Sliders className="size-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900">{roles.length}</p>
            <p className="text-xs font-semibold text-slate-500">
              Roles activos (plantillas y clonados)
            </p>
          </div>
        </article>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("usuarios")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              view === "usuarios"
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <Users className="size-4" />
            Lista de usuarios ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setView("roles")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              view === "roles"
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            <Sliders className="size-4" />
            Editor de roles y matriz de permisos ({roles.length})
          </button>
        </div>
      </div>

      {view === "usuarios" ? (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, correo o alcance DANE / CC..."
                className="field h-10 pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="field h-10 w-auto text-xs font-semibold"
              >
                <option value="all">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setView("roles")}
                className="secondary-button h-10 text-xs"
              >
                <Sliders className="size-3.5" /> Configurar roles
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Alcance de datos</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Doble factor (2FA)</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const initials = u.name
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[11px] font-bold text-[var(--brand)]">
                            {initials}
                          </span>
                          <div>
                            <strong>{u.name}</strong>
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          aria-label={`Rol de ${u.name}`}
                          value={u.role}
                          onChange={(e) => {
                            onUpdateUser({ ...u, role: e.target.value })
                            notify(
                              `Rol de ${u.name} actualizado a ${e.target.value}.`,
                            )
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[var(--brand)]"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="font-medium text-slate-700">{u.scope}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            u.status === "Activo"
                              ? "status-green"
                              : u.status === "Invitación pendiente"
                                ? "status-amber"
                                : "status-gray"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {u.lastAccess}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateUser({ ...u, twoFactor: !u.twoFactor })
                            notify(
                              `Doble factor ${
                                !u.twoFactor ? "activado" : "desactivado"
                              } para ${u.name}.`,
                            )
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                            u.twoFactor
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {u.twoFactor ? (
                            <>
                              <ShieldCheck className="size-3" /> Sí · Activo
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="size-3" /> No
                            </>
                          )}
                        </button>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const nextStatus = cycleStatus(u.status)
                            onUpdateUser({
                              ...u,
                              status: nextStatus,
                              lastAccess:
                                nextStatus === "Activo" &&
                                u.lastAccess === "Sin ingresar"
                                  ? "31/03/2025 09:00"
                                  : u.lastAccess,
                            })
                            notify(
                              `Estado de ${u.name} cambiado a ${nextStatus}.`,
                            )
                          }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          {u.status === "Activo" ? "Suspender" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <RoleMatrixEditor
          client={client}
          roles={roles}
          selectedRoleId={selectedRoleId}
          onSelectRole={setSelectedRoleId}
          onUpdateRole={(updated) => {
            onUpdateRole(updated)
            notify(
              `Matriz de "${updated.name}" actualizada. La navegación refleja los cambios de inmediato.`,
            )
          }}
          onCloneRole={(sourceId, newName, scope) => {
            onCloneRole(sourceId, newName, scope)
            setSelectedRoleId(newName)
            notify(
              `Rol "${newName}" clonado con éxito. Puede ajustar sus permisos en la matriz.`,
            )
          }}
          onPreviewNavigationAsRole={(roleName) => {
            onPreviewNavigationAsRole(roleName)
          }}
        />
      )}

      {inviteOpen && (
        <InviteUserModal
          client={client}
          roles={roles}
          onInvite={(newUser) => {
            onInviteUser(newUser)
            notify(
              `Invitación enviada a ${newUser.email} con rol ${newUser.role}.`,
            )
          }}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  )
}
