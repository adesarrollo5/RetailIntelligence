import {
  AlertOctagon,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
} from "lucide-react"
import type { ModuleDataState } from "../types"

type SwitcherProps = {
  state: ModuleDataState
  onChange: (next: ModuleDataState) => void
}

export function ModuleStateSwitcher({ state, onChange }: SwitcherProps) {
  const items: Array<{
    id: ModuleDataState
    label: string
  }> = [
    { id: "ready", label: "Datos" },
    { id: "loading", label: "Cargando" },
    { id: "empty", label: "Vacío" },
    { id: "error", label: "Error" },
  ]

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
      title="Simulador de estados de interfaz (datos, carga, vacío y error)"
    >
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Estado:
      </span>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
            state === it.id
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

type FeedbackProps = {
  state: Exclude<ModuleDataState, "ready">
  moduleLabel: string
  scopeLabel: string
  periodLabel: string
  onReset: () => void
}

export function ModuleStateFeedback({
  state,
  moduleLabel,
  scopeLabel,
  periodLabel,
  onReset,
}: FeedbackProps) {
  if (state === "loading") {
    return (
      <div className="space-y-4" aria-live="polite">
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs font-semibold text-blue-900">
          <Loader2 className="size-4 animate-spin text-[var(--brand)]" />
          <span>
            Consultando series de {moduleLabel.toLowerCase()} para{" "}
            <strong>{scopeLabel}</strong> ({periodLabel})...
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card animate-pulse p-5">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-7 w-36 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card animate-pulse p-6">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="mt-6 h-56 rounded-xl bg-slate-100" />
          </div>
          <div className="card animate-pulse p-6">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="mt-6 h-56 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  if (state === "empty") {
    return (
      <section className="card grid min-h-[380px] place-items-center p-8 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Inbox className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Sin registros de {moduleLabel.toLowerCase()} para este filtro
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            No se encontraron movimientos confirmados en{" "}
            <strong>{scopeLabel}</strong> durante el rango{" "}
            <strong>{periodLabel}</strong>. Verifique el corte de sincronización
            POS o restablezca los filtros activos.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="primary-button mt-5"
          >
            <CheckCircle2 className="size-4" /> Restablecer vista con datos
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card grid min-h-[380px] place-items-center border-rose-200 bg-rose-50/20 p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff1f2] text-[#be123c]">
          <AlertOctagon className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Error al consolidar {moduleLabel.toLowerCase()}
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Ocurrió un tiempo de espera agotado al cruzar el lote de{" "}
          <strong>{scopeLabel}</strong> ({periodLabel}). Los datos fuente en el
          conector están intactos.
        </p>
        <button type="button" onClick={onReset} className="primary-button mt-5">
          <RefreshCw className="size-4" /> Reintentar consulta ahora
        </button>
      </div>
    </section>
  )
}
