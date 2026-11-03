import { useState } from "react"
import {
  ArrowRight,
  BookOpenText,
  Check,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react"
import type { Client, TerminologyConfig } from "../types"

type Props = {
  client: Client
  onSaveTerminology: (next: TerminologyConfig) => void
}

const storePresets = [
  { singular: "Local", plural: "Locales", note: "Estándar operadores de CC" },
  { singular: "Tienda", plural: "Tiendas", note: "Estándar marcas y cadenas" },
  {
    singular: "Punto de venta",
    plural: "Puntos de venta",
    note: "Multiformato / omnicanal",
  },
]

const mallPresets = [
  {
    singular: "Centro comercial",
    plural: "Centros comerciales",
    note: "Terminología tradicional CO",
  },
  { singular: "Mall", plural: "Malls", note: "Formato corporativo / regional" },
  {
    singular: "Complejo comercial",
    plural: "Complejos comerciales",
    note: "Portafolios de uso mixto",
  },
]

const visitorsPresets = [
  { label: "Visitantes", note: "Conteo peatonal general" },
  { label: "Aforo", note: "Control de capacidad y ocupación" },
  { label: "Tráfico peatonal", note: "Analítica de flujo exterior/interior" },
]

const transactionPresets = [
  {
    singular: "Transacción",
    plural: "Transacciones",
    note: "Operación registrada en POS",
  },
  {
    singular: "Ticket",
    plural: "Tickets",
    note: "Comprobante / tirilla de compra",
  },
  {
    singular: "Factura POS",
    plural: "Facturas POS",
    note: "Nomenclatura contable",
  },
]

export function TerminologyTab({ client, onSaveTerminology }: Props) {
  const [draft, setDraft] = useState<TerminologyConfig>(client.terminology)

  const resetDefaults = () => {
    if (client.id === "plaza") {
      setDraft({
        storeSingular: "Local",
        storePlural: "Locales",
        mallSingular: "Centro comercial",
        mallPlural: "Centros comerciales",
        visitorsLabel: "Visitantes",
        transactionSingular: "Transacción",
        transactionPlural: "Transacciones",
      })
    } else {
      setDraft({
        storeSingular: "Tienda",
        storePlural: "Tiendas",
        mallSingular: "Centro comercial",
        mallPlural: "Centros comerciales",
        visitorsLabel: "Visitantes",
        transactionSingular: "Ticket",
        transactionPlural: "Tickets",
      })
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.28fr_.92fr]">
      <div className="space-y-4">
        <section className="card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">
                1. Unidad comercial (Tienda / Local / Punto de venta)
              </h2>
              <p className="section-subtitle">
                Define cómo se nombra cada ubicación física en el menú lateral,
                tablas e integraciones.
              </p>
            </div>
            <span className="status-pill status-blue">
              {draft.storeSingular} / {draft.storePlural}
            </span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {storePresets.map((preset) => {
              const active = draft.storeSingular === preset.singular
              return (
                <button
                  key={preset.singular}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      storeSingular: preset.singular,
                      storePlural: preset.plural,
                    })
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.singular}
                    </span>
                    {active && (
                      <Check className="size-3.5 text-[var(--brand)]" />
                    )}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {preset.note}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Término en singular</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.storeSingular}
                onChange={(e) =>
                  setDraft({ ...draft, storeSingular: e.target.value })
                }
              />
            </label>
            <label>
              <span className="field-label">Término en plural</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.storePlural}
                onChange={(e) =>
                  setDraft({ ...draft, storePlural: e.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">
                2. Agrupación inmobiliaria (Centro comercial / Mall)
              </h2>
              <p className="section-subtitle">
                Usado en el selector de alcance superior, rankings de activos y
                comparativos.
              </p>
            </div>
            <span className="status-pill status-blue">
              {draft.mallSingular} / {draft.mallPlural}
            </span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {mallPresets.map((preset) => {
              const active = draft.mallSingular === preset.singular
              return (
                <button
                  key={preset.singular}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      mallSingular: preset.singular,
                      mallPlural: preset.plural,
                    })
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.singular}
                    </span>
                    {active && (
                      <Check className="size-3.5 text-[var(--brand)]" />
                    )}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {preset.note}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Término en singular</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.mallSingular}
                onChange={(e) =>
                  setDraft({ ...draft, mallSingular: e.target.value })
                }
              />
            </label>
            <label>
              <span className="field-label">Término en plural</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.mallPlural}
                onChange={(e) =>
                  setDraft({ ...draft, mallPlural: e.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">
                3. Flujo de personas (Visitantes / Aforo)
              </h2>
              <p className="section-subtitle">
                Etiqueta para las métricas provenientes de cámaras y sensores de
                conteo de personas.
              </p>
            </div>
            <span className="status-pill status-blue">
              {draft.visitorsLabel}
            </span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {visitorsPresets.map((preset) => {
              const active = draft.visitorsLabel === preset.label
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, visitorsLabel: preset.label })
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.label}
                    </span>
                    {active && (
                      <Check className="size-3.5 text-[var(--brand)]" />
                    )}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {preset.note}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="block">
            <span className="field-label">Etiqueta visible en tableros</span>
            <input
              type="text"
              className="field h-10 text-xs"
              value={draft.visitorsLabel}
              onChange={(e) =>
                setDraft({ ...draft, visitorsLabel: e.target.value })
              }
            />
          </label>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">
                4. Operación de punto de venta (Transacción / Ticket)
              </h2>
              <p className="section-subtitle">
                Define cómo se nombran las operaciones de caja y el valor
                promedio de compra.
              </p>
            </div>
            <span className="status-pill status-blue">
              {draft.transactionSingular} / {draft.transactionPlural}
            </span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {transactionPresets.map((preset) => {
              const active = draft.transactionSingular === preset.singular
              return (
                <button
                  key={preset.singular}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      transactionSingular: preset.singular,
                      transactionPlural: preset.plural,
                    })
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.singular}
                    </span>
                    {active && (
                      <Check className="size-3.5 text-[var(--brand)]" />
                    )}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {preset.note}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Término en singular</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.transactionSingular}
                onChange={(e) =>
                  setDraft({ ...draft, transactionSingular: e.target.value })
                }
              />
            </label>
            <label>
              <span className="field-label">Término en plural</span>
              <input
                type="text"
                className="field h-10 text-xs"
                value={draft.transactionPlural}
                onChange={(e) =>
                  setDraft({ ...draft, transactionPlural: e.target.value })
                }
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={resetDefaults}
              className="secondary-button"
            >
              <RotateCcw className="size-4" /> Restaurar diccionario
            </button>
            <button
              type="button"
              onClick={() => onSaveTerminology(draft)}
              className="primary-button"
            >
              <Save className="size-4" /> Guardar diccionario y aplicar en toda
              la app
            </button>
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-[92px]">
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
              <BookOpenText className="size-4" />
            </span>
            <div>
              <h3 className="section-title">
                Vista previa de etiquetas en la app
              </h3>
              <p className="section-subtitle">
                Así se verán los textos al guardar los cambios
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menú de navegación lateral
              </p>
              <div className="mt-2 flex items-center justify-between font-semibold text-slate-700">
                <span>Módulo de ubicaciones</span>
                <span className="inline-flex items-center gap-1 font-bold text-[var(--brand)]">
                  <ArrowRight className="size-3" /> {draft.storePlural}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between font-semibold text-slate-700">
                <span>Módulo de flujo y embudo</span>
                <span className="inline-flex items-center gap-1 font-bold text-[var(--brand)]">
                  <ArrowRight className="size-3" /> {draft.visitorsLabel} y
                  conversión
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Barra superior (Selector de alcance)
              </p>
              <p className="mt-2 font-bold text-slate-800">
                {client.type === "operator"
                  ? `Todos los ${draft.mallPlural.toLowerCase()}`
                  : `Todas las ${draft.storePlural.toLowerCase()}`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tarjetas KPI en Inicio
              </p>
              <ul className="mt-2 space-y-1.5 text-slate-700">
                <li className="flex justify-between">
                  <span>Conteo de caja:</span>
                  <strong>{draft.transactionPlural}</strong>
                </li>
                <li className="flex justify-between">
                  <span>Valor medio:</span>
                  <strong>{draft.transactionSingular} promedio</strong>
                </li>
                <li className="flex justify-between">
                  <span>Sensor de entrada:</span>
                  <strong>{draft.visitorsLabel} totales</strong>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tabla principal de Inicio
              </p>
              <p className="mt-2 font-bold text-slate-800">
                Desempeño por{" "}
                {client.type === "operator"
                  ? draft.mallSingular.toLowerCase()
                  : draft.storeSingular.toLowerCase()}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Columna 1:{" "}
                {client.type === "operator"
                  ? draft.mallSingular
                  : draft.storeSingular}{" "}
                · Integraciones: 142 {draft.storePlural.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-[11px] text-blue-900">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <span>
              Cada cliente mantiene su propio diccionario aislado. Cambiar estos
              términos en <strong>{client.shortName}</strong> no altera el
              vocabulario de otros clientes.
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}
