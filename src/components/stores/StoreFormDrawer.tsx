import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Crosshair, Lock, Save, X } from "lucide-react"
import type { Client } from "../../types"
import {
  departments,
  getDepartment,
  getMunicipality,
  municipalitiesOf,
} from "../../data/colombiaGeo"
import {
  draftFromStore,
  emptyDraft,
  getCategoryOptions,
  getParentOptions,
  parentLabelOf,
  scheduleDayOptions,
  storeFormats,
  storeFromDraft,
  storeStatuses,
  validateDraft,
  type StoreDraft,
  type StoreRecord,
} from "../../data/storesData"

type Props = {
  client: Client
  stores: StoreRecord[]
  /** null = creación */
  editing: StoreRecord | null
  /** Opciones de CC/región que el usuario puede usar */
  allowedParents: string[]
  /** Gerente de tienda: solo puede editar horario y dirección */
  limitedEdit?: boolean
  onSave: (store: StoreRecord, isNew: boolean) => void
  onClose: () => void
}

const LIMITED_FIELDS: Array<keyof StoreDraft> = [
  "scheduleDays",
  "open",
  "close",
  "address",
]

export function StoreFormDrawer({
  client,
  stores,
  editing,
  allowedParents,
  limitedEdit = false,
  onSave,
  onClose,
}: Props) {
  const terms = client.terminology
  const isNew = editing === null
  const [draft, setDraft] = useState<StoreDraft>(() =>
    editing
      ? draftFromStore(editing)
      : {
          ...emptyDraft(),
          parent: allowedParents.length === 1 ? allowedParents[0] : "",
        },
  )
  const [touched, setTouched] =
    useState<Partial<Record<keyof StoreDraft, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const { errors, warnings } = useMemo(
    () =>
      validateDraft(draft, {
        existing: stores,
        editingId: editing?.id,
        parentOptions: getParentOptions(client),
        categoryOptions: getCategoryOptions(client),
      }),
    [draft, stores, editing, client],
  )

  const set = <K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))
  const blur = (key: keyof StoreDraft) =>
    setTouched((prev) => ({ ...prev, [key]: true }))

  const visibleError = (key: keyof StoreDraft) =>
    (touched[key] || submitted) && errors[key] ? errors[key] : undefined

  const disabledField = (key: keyof StoreDraft) =>
    limitedEdit && !LIMITED_FIELDS.includes(key)

  const munis = draft.deptCode ? municipalitiesOf(draft.deptCode) : []
  const dept = getDepartment(draft.deptCode)
  const muni = getMunicipality(draft.muniCode)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const relevant = limitedEdit
      ? LIMITED_FIELDS.filter((k) => errors[k])
      : Object.keys(errors)
    if (relevant.length > 0) {
      const first = relevant[0]
      document.getElementById(`sf-${first}`)?.focus()
      return
    }
    onSave(storeFromDraft(draft, client, editing ?? undefined), isNew)
  }

  const field = (
    key: keyof StoreDraft,
    label: string,
    control: (props: {
      id: string
      className: string
      "aria-invalid": boolean
      "aria-describedby"?: string
      disabled: boolean
    }) => React.ReactNode,
    hint?: React.ReactNode,
  ) => {
    const err = visibleError(key)
    const id = `sf-${key}`
    return (
      <div>
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        {control({
          id,
          className: `field ${
            err ? "!border-rose-400 !shadow-[0_0_0_3px_#ffe4e6]" : ""
          } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500`,
          "aria-invalid": Boolean(err),
          "aria-describedby": err ? `${id}-err` : undefined,
          disabled: disabledField(key),
        })}
        {err ? (
          <p
            id={`${id}-err`}
            className="mt-1.5 text-[11px] font-semibold text-rose-600"
          >
            {err}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>
        ) : null}
      </div>
    )
  }

  const sectionTitle = (text: string) => (
    <h3 className="mb-3 mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
      {text}
    </h3>
  )

  return (
    <div
      className="fixed inset-0 z-[65] flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={
          isNew
            ? `Nueva ${terms.storeSingular.toLowerCase()}`
            : `Editar ${editing?.name}`
        }
        noValidate
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {isNew
                ? `Nueva ${terms.storeSingular.toLowerCase()}`
                : `Editar ${terms.storeSingular.toLowerCase()}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isNew
                ? `Registre una nueva ubicación en ${client.name}.`
                : `${editing?.name} · ${editing?.code}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {limitedEdit && (
            <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              Como gerente de {terms.storeSingular.toLowerCase()} puede
              actualizar el horario y la dirección. Los demás campos los
              administra el equipo corporativo.
            </div>
          )}

          <section>
            {sectionTitle("Identificación")}
            <div className="space-y-4">
              {field("name", "Nombre", (p) => (
                <input
                  {...p}
                  value={draft.name}
                  maxLength={80}
                  placeholder={`Ej. Arturo Calle · Local 104`}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => blur("name")}
                />
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "code",
                  "Código interno",
                  (p) => (
                    <input
                      {...p}
                      value={draft.code}
                      maxLength={20}
                      placeholder="BOG-104"
                      onChange={(e) =>
                        set("code", e.target.value.toUpperCase())
                      }
                      onBlur={() => blur("code")}
                    />
                  ),
                  "Único dentro del cliente.",
                )}
                {field("parent", parentLabelOf(client), (p) => (
                  <select
                    {...p}
                    value={draft.parent}
                    onChange={(e) => set("parent", e.target.value)}
                    onBlur={() => blur("parent")}
                  >
                    <option value="">Seleccione…</option>
                    {allowedParents.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              {field("zone", "Zona / piso", (p) => (
                <input
                  {...p}
                  value={draft.zone}
                  maxLength={60}
                  placeholder="Zona Moda · Piso 1"
                  onChange={(e) => set("zone", e.target.value)}
                  onBlur={() => blur("zone")}
                />
              ))}
            </div>
          </section>

          <section>
            {sectionTitle("Clasificación")}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("format", "Formato", (p) => (
                <select
                  {...p}
                  value={draft.format}
                  onChange={(e) => set("format", e.target.value)}
                  onBlur={() => blur("format")}
                >
                  <option value="">Seleccione…</option>
                  {storeFormats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              ))}
              {field("category", "Categoría", (p) => (
                <select
                  {...p}
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                  onBlur={() => blur("category")}
                >
                  <option value="">Seleccione…</option>
                  {getCategoryOptions(client).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ))}
              {field("sqm", "Área (m²)", (p) => (
                <input
                  {...p}
                  inputMode="decimal"
                  value={draft.sqm}
                  placeholder="85,5"
                  onChange={(e) => set("sqm", e.target.value)}
                  onBlur={() => blur("sqm")}
                />
              ))}
              {field("status", "Estado", (p) => (
                <select
                  {...p}
                  value={draft.status}
                  onChange={(e) => set("status", e.target.value)}
                  onBlur={() => blur("status")}
                >
                  {storeStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </section>

          <section>
            {sectionTitle("Horario de atención")}
            <div className="grid gap-4 sm:grid-cols-3">
              {field("scheduleDays", "Días", (p) => (
                <select
                  {...p}
                  value={draft.scheduleDays}
                  onChange={(e) => set("scheduleDays", e.target.value)}
                  onBlur={() => blur("scheduleDays")}
                >
                  {scheduleDayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ))}
              {field("open", "Apertura", (p) => (
                <input
                  {...p}
                  type="time"
                  value={draft.open}
                  onChange={(e) => set("open", e.target.value)}
                  onBlur={() => blur("open")}
                />
              ))}
              {field("close", "Cierre", (p) => (
                <input
                  {...p}
                  type="time"
                  value={draft.close}
                  onChange={(e) => set("close", e.target.value)}
                  onBlur={() => blur("close")}
                />
              ))}
            </div>
          </section>

          <section>
            {sectionTitle("Ubicación (DANE)")}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "deptCode",
                  "Departamento",
                  (p) => (
                    <select
                      {...p}
                      value={draft.deptCode}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          deptCode: e.target.value,
                          muniCode: "",
                        }))
                      }}
                      onBlur={() => blur("deptCode")}
                    >
                      <option value="">Seleccione…</option>
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ),
                  dept ? `Código DANE departamento: ${dept.code}` : undefined,
                )}
                {field(
                  "muniCode",
                  "Municipio",
                  (p) => (
                    <select
                      {...p}
                      disabled={p.disabled || !draft.deptCode}
                      value={draft.muniCode}
                      onChange={(e) => {
                        const next = getMunicipality(e.target.value)
                        setDraft((prev) => ({
                          ...prev,
                          muniCode: e.target.value,
                          lat:
                            prev.lat.trim() === "" && next
                              ? next.lat.toFixed(6)
                              : prev.lat,
                          lng:
                            prev.lng.trim() === "" && next
                              ? next.lng.toFixed(6)
                              : prev.lng,
                        }))
                      }}
                      onBlur={() => blur("muniCode")}
                    >
                      <option value="">
                        {draft.deptCode
                          ? "Seleccione…"
                          : "Elija primero un departamento"}
                      </option>
                      {munis.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ),
                  muni ? `Código DANE municipio: ${muni.code}` : undefined,
                )}
              </div>
              {field("address", "Dirección", (p) => (
                <input
                  {...p}
                  value={draft.address}
                  placeholder="Av. Calle 80 #68-45, Local 104"
                  onChange={(e) => set("address", e.target.value)}
                  onBlur={() => blur("address")}
                />
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                {field("lat", "Latitud", (p) => (
                  <input
                    {...p}
                    inputMode="decimal"
                    value={draft.lat}
                    placeholder="4,711000"
                    onChange={(e) => set("lat", e.target.value)}
                    onBlur={() => blur("lat")}
                  />
                ))}
                {field("lng", "Longitud", (p) => (
                  <input
                    {...p}
                    inputMode="decimal"
                    value={draft.lng}
                    placeholder="-74,072000"
                    onChange={(e) => set("lng", e.target.value)}
                    onBlur={() => blur("lng")}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={!muni || limitedEdit}
                onClick={() =>
                  muni &&
                  setDraft((prev) => ({
                    ...prev,
                    lat: muni.lat.toFixed(6),
                    lng: muni.lng.toFixed(6),
                  }))
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Crosshair className="size-3.5" />
                Usar el centro del municipio seleccionado
              </button>
              {warnings.map((w) => (
                <div
                  key={w}
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            {submitted && Object.keys(errors).length > 0 && !limitedEdit
              ? `Corrija ${Object.keys(errors).length} campo(s) para continuar.`
              : "Todos los campos son obligatorios."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button"
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              <Save className="size-4" />
              {isNew ? "Crear" : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
