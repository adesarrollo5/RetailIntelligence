import { useState } from "react"
import { Check, CopyPlus, Eye, Lock, Shield, Sparkles } from "lucide-react"
import { moduleCatalog, planRank } from "../data/demo"
import type {
  Client,
  DataScopeLevel,
  PageId,
  PermissionAction,
  RoleDefinition,
} from "../types"

type Props = {
  client: Client
  roles: RoleDefinition[]
  selectedRoleId: string
  onSelectRole: (roleId: string) => void
  onUpdateRole: (updated: RoleDefinition) => void
  onCloneRole: (
    sourceRoleId: string,
    newName: string,
    scope: DataScopeLevel,
  ) => void
  onPreviewNavigationAsRole: (roleName: string) => void
}

type ActionItem = {
  key: PermissionAction
  label: string
}

const actionsList: ActionItem[] = [
  { key: "ver", label: "Ver" },
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
  { key: "exportar", label: "Exportar" },
]

const scopeLevels: DataScopeLevel[] = [
  "Todo el cliente",
  "Por centro comercial / región",
  "Por ciudad (DANE)",
  "Solo ubicaciones asignadas",
]

export function RoleMatrixEditor({
  client,
  roles,
  selectedRoleId,
  onSelectRole,
  onUpdateRole,
  onCloneRole,
  onPreviewNavigationAsRole,
}: Props) {
  const [cloneModalOpen, setCloneModalOpen] = useState(false)
  const [cloneSourceId, setCloneSourceId] = useState(
    selectedRoleId || "Gerente",
  )
  const [cloneName, setCloneName] = useState("")
  const [cloneScope, setCloneScope] = useState<DataScopeLevel>(
    "Por centro comercial / región",
  )

  const currentRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0]

  const togglePermission = (moduleId: PageId, action: PermissionAction) => {
    if (!currentRole) return
    if (
      (moduleId === "usuarios" || moduleId === "configuracion") &&
      !currentRole.isAdminRole
    ) {
      return
    }
    if (
      currentRole.isAdminRole &&
      (moduleId === "usuarios" || moduleId === "configuracion") &&
      action === "ver"
    ) {
      return
    }

    const prevMod = currentRole.permissions[moduleId]
    const nextValue = !prevMod[action]
    const updatedMod = { ...prevMod, [action]: nextValue }

    if (action === "ver" && !nextValue) {
      updatedMod.crear = false
      updatedMod.editar = false
      updatedMod.eliminar = false
      updatedMod.exportar = false
    } else if (action !== "ver" && nextValue) {
      updatedMod.ver = true
    }

    onUpdateRole({
      ...currentRole,
      permissions: {
        ...currentRole.permissions,
        [moduleId]: updatedMod,
      },
    })
  }

  const setRowPreset = (moduleId: PageId, mode: "all" | "read" | "none") => {
    if (!currentRole) return
    if (
      (moduleId === "usuarios" || moduleId === "configuracion") &&
      !currentRole.isAdminRole
    ) {
      return
    }
    if (
      currentRole.isAdminRole &&
      (moduleId === "usuarios" || moduleId === "configuracion") &&
      mode === "none"
    ) {
      return
    }

    const nextMod =
      mode === "all"
        ? {
            ver: true,
            crear: true,
            editar: true,
            eliminar: true,
            exportar: true,
          }
        : mode === "read"
          ? {
              ver: true,
              crear: false,
              editar: false,
              eliminar: false,
              exportar: true,
            }
          : {
              ver: false,
              crear: false,
              editar: false,
              eliminar: false,
              exportar: false,
            }

    onUpdateRole({
      ...currentRole,
      permissions: {
        ...currentRole.permissions,
        [moduleId]: nextMod,
      },
    })
  }

  const handleCreateClone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cloneName.trim()) return
    onCloneRole(cloneSourceId, cloneName.trim(), cloneScope)
    setCloneName("")
    setCloneModalOpen(false)
  }

  if (!currentRole) return null

  return (
    <div className="grid gap-5 xl:grid-cols-[290px_1fr]">
      <aside className="space-y-3">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Roles de {client.shortName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Plantillas y roles clonados
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCloneSourceId(currentRole.id)
                setCloneName(`${currentRole.name} Regional`)
                setCloneModalOpen(true)
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-soft)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--brand)] hover:opacity-90"
            >
              <CopyPlus className="size-3.5" /> Clonar rol
            </button>
          </div>

          <div className="space-y-1.5">
            {roles.map((r) => {
              const active = r.id === currentRole.id
              const visibleCount = moduleCatalog.filter(
                (m) => r.permissions[m.id]?.ver,
              ).length
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRole(r.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {r.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        r.isSystem
                          ? "bg-slate-100 text-slate-600"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {r.isSystem ? "Plantilla" : "Clonado"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    {r.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>{visibleCount} módulos visibles</span>
                    <span className="truncate max-w-[130px]">
                      {r.defaultScope}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-xs text-blue-900">
          <p className="flex items-center gap-1.5 font-bold">
            <Sparkles className="size-4 text-blue-600" />
            Impacto inmediato en navegación
          </p>
          <p className="mt-1 leading-5 text-blue-800">
            Al activar o desactivar la columna <strong>Ver</strong>, la barra
            lateral izquierda se actualiza al instante para el rol activo.
          </p>
        </div>
      </aside>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Matriz de permisos: {currentRole.name}
              </h2>
              {currentRole.isAdminRole && (
                <span className="status-pill status-green">
                  Administrador del cliente
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {currentRole.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCloneSourceId(currentRole.id)
                setCloneName(`${currentRole.name} Personalizado`)
                setCloneModalOpen(true)
              }}
              className="secondary-button h-9 px-3 text-xs"
            >
              <CopyPlus className="size-3.5" /> Clonar este rol
            </button>
            {!currentRole.isAdminRole && (
              <button
                type="button"
                onClick={() => onPreviewNavigationAsRole(currentRole.name)}
                className="primary-button h-9 px-3 text-xs"
              >
                <Eye className="size-3.5" /> Probar navegación con este rol
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Alcance de datos predeterminado del rol
              </p>
              <p className="text-[11px] text-slate-500">
                Define qué nivel de la jerarquía (
                {client.terminology.mallPlural} / DANE /{" "}
                {client.terminology.storePlural}) puede consultar.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {scopeLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() =>
                    onUpdateRole({ ...currentRole, defaultScope: lvl })
                  }
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                    currentRole.defaultScope === lvl
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Módulo</th>
                {actionsList.map((act) => (
                  <th key={act.key} className="text-center">
                    {act.label}
                  </th>
                ))}
                <th className="text-right">Ajuste rápido</th>
              </tr>
            </thead>
            <tbody>
              {moduleCatalog.map((mod) => {
                const perm = currentRole.permissions[mod.id]
                const planLocked = planRank[mod.minPlan] > planRank[client.plan]
                const adminLocked =
                  Boolean(mod.adminOnly) && !currentRole.isAdminRole
                const isSelfAdminModule =
                  Boolean(mod.adminOnly) && Boolean(currentRole.isAdminRole)

                const dynamicLabel =
                  mod.id === "tiendas"
                    ? client.terminology.storePlural
                    : mod.id === "trafico"
                      ? `${client.terminology.visitorsLabel} y conversión`
                      : mod.name

                return (
                  <tr
                    key={mod.id}
                    className={
                      planLocked || adminLocked ? "bg-slate-50/70" : ""
                    }
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <strong>{dynamicLabel}</strong>
                        {planLocked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                            <Lock className="size-2.5" /> Plan {mod.minPlan}
                          </span>
                        )}
                        {mod.adminOnly && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                            <Shield className="size-2.5" /> Solo Administrador
                          </span>
                        )}
                      </div>
                      <span>{mod.description}</span>
                    </td>

                    {actionsList.map((act) => {
                      const checked = perm?.[act.key] ?? false
                      const disabled =
                        adminLocked || (isSelfAdminModule && act.key === "ver")
                      return (
                        <td key={act.key} className="text-center">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => togglePermission(mod.id, act.key)}
                            aria-label={`${dynamicLabel} - ${act.label}`}
                            className={`mx-auto grid size-6 place-items-center rounded-md border transition ${
                              checked
                                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                            } ${
                              disabled ? "cursor-not-allowed opacity-45" : ""
                            }`}
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </button>
                        </td>
                      )
                    })}

                    <td className="text-right">
                      {adminLocked ? (
                        <span className="text-[10px] font-semibold text-slate-400">
                          Restringido
                        </span>
                      ) : (
                        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setRowPreset(mod.id, "all")}
                            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            Todo
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowPreset(mod.id, "read")}
                            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            Lectura
                          </button>
                          {!isSelfAdminModule && (
                            <button
                              type="button"
                              onClick={() => setRowPreset(mod.id, "none")}
                              className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50"
                            >
                              Ocultar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {cloneModalOpen && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() => setCloneModalOpen(false)}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              Clonar rol plantilla
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Cree un rol personalizado copiando los permisos de una plantilla
              existente.
            </p>

            <form onSubmit={handleCreateClone} className="mt-4 space-y-4">
              <label className="block">
                <span className="field-label">Rol plantilla de origen</span>
                <select
                  value={cloneSourceId}
                  onChange={(e) => setCloneSourceId(e.target.value)}
                  className="field h-10 text-xs font-semibold"
                >
                  {roles
                    .filter((r) => !r.isAdminRole)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="field-label">Nombre del nuevo rol</span>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Ej. Gerente Antioquia, Auditor POS..."
                  className="field h-10 text-xs"
                />
              </label>

              <label className="block">
                <span className="field-label">Alcance de datos inicial</span>
                <select
                  value={cloneScope}
                  onChange={(e) =>
                    setCloneScope(e.target.value as DataScopeLevel)
                  }
                  className="field h-10 text-xs font-semibold"
                >
                  {scopeLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloneModalOpen(false)}
                  className="secondary-button"
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  <CopyPlus className="size-4" /> Crear y editar matriz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
