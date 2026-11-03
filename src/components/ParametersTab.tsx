import { useState } from "react"
import { CalendarCheck2, Clock, Receipt, Save, Sparkles } from "lucide-react"
import type { Client, ParametersConfig } from "../types"

type Props = {
  client: Client
  onSaveParameters: (next: ParametersConfig) => void
}

export function ParametersTab({ client, onSaveParameters }: Props) {
  const [draft, setDraft] = useState<ParametersConfig>(client.parameters)

  const toggleHoliday = (date: string) => {
    setDraft((prev) => ({
      ...prev,
      holidays: prev.holidays.map((h) =>
        h.date === date ? { ...h, enabled: !h.enabled } : h,
      ),
    }))
  }

  const activeHolidaysCount = draft.holidays.filter((h) => h.enabled).length

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* 1. Zona horaria America/Bogota */}
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Clock className="size-4" />
            </span>
            <div>
              <h2 className="section-title">Zona horaria y corte</h2>
              <p className="section-subtitle">Sincronización POS y conteo</p>
            </div>
          </div>
          <label className="block">
            <span className="field-label">Zona horaria oficial</span>
            <select
              className="field h-10 text-xs font-semibold"
              value={draft.timezone}
              onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
            >
              <option value="America/Bogota">
                America/Bogota (UTC-05:00 · Colombia)
              </option>
            </select>
          </label>
          <label className="mt-3 block">
            <span className="field-label">Hora de cierre diario de ventas</span>
            <select
              className="field h-10 text-xs font-semibold"
              value={draft.cutoffHour}
              onChange={(e) =>
                setDraft({ ...draft, cutoffHour: e.target.value })
              }
            >
              <option value="23:59">23:59 (Día calendario completo)</option>
              <option value="22:30">22:30 (Cierre operativo tiendas)</option>
              <option value="02:00">
                02:00 día siguiente (Gastronomía / entretenimiento)
              </option>
            </select>
          </label>
          <p className="mt-3 text-[11px] text-slate-400">
            Todas las marcas de tiempo se normalizan a{" "}
            <strong className="text-slate-600">America/Bogota</strong> sin
            cambio de horario de verano.
          </p>
        </section>

        {/* 2. Inicio de semana Lunes */}
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <CalendarCheck2 className="size-4" />
            </span>
            <div>
              <h2 className="section-title">Calendario comercial</h2>
              <p className="section-subtitle">Agrupación semanal y quincenal</p>
            </div>
          </div>
          <label className="block">
            <span className="field-label">Día de inicio de semana</span>
            <div className="grid grid-cols-2 gap-2">
              {(["Lunes", "Domingo"] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDraft({ ...draft, weekStartsOn: day })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    draft.weekStartsOn === day
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {day}
                  {day === "Lunes" && (
                    <span className="block text-[10px] font-medium opacity-80">
                      Estándar Colombia
                    </span>
                  )}
                </button>
              ))}
            </div>
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <input
              type="checkbox"
              checked={draft.markQuincenasAndPrimas}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  markQuincenasAndPrimas: e.target.checked,
                })
              }
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span className="text-xs text-slate-700">
              <strong className="block font-bold">
                Destacar quincenas (15 y 30) y primas
              </strong>
              Ajusta metas y comparativos frente a los picos de nómina de junio
              y diciembre.
            </span>
          </label>
        </section>

        {/* 3. Ventas con o sin IVA */}
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Receipt className="size-4" />
            </span>
            <div>
              <h2 className="section-title">Criterio contable de ventas</h2>
              <p className="section-subtitle">
                Tratamiento del IVA ({draft.ivaRate}% general CO)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, salesTaxMode: "sin_iva" })}
              className={`w-full rounded-xl border p-3 text-left transition ${
                draft.salesTaxMode === "sin_iva"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Ventas sin IVA (Ventas netas)
                </span>
                <span className="status-pill status-green">Recomendado</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Excluye impuestos para cálculo de canon variable, productividad
                por m² y comisiones.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDraft({ ...draft, salesTaxMode: "con_iva" })}
              className={`w-full rounded-xl border p-3 text-left transition ${
                draft.salesTaxMode === "con_iva"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Ventas con IVA (Ventas brutas)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  +19% IVA
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Muestra el recaudo total en caja incluyendo el impuesto al valor
                agregado.
              </p>
            </button>
          </div>
        </section>
      </div>

      {/* 4. Calendario oficial de festivos de Colombia */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--brand)]" />
              Calendario de festivos de Colombia 2025 (Ley Emiliani · DANE)
            </h2>
            <p className="section-subtitle">
              {activeHolidaysCount} de {draft.holidays.length} festivos activos
              para normalizar comparativos lunes-lunes y puentes festivos.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={draft.useColombianHolidays}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  useColombianHolidays: e.target.checked,
                })
              }
              className="size-4 accent-[var(--brand)]"
            />
            Aplicar festivos de Colombia en analítica
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Fecha (DD/MM/AAAA)</th>
                <th>Festivo nacional</th>
                <th>Régimen legal</th>
                <th>Comportamiento esperado retail</th>
              </tr>
            </thead>
            <tbody>
              {draft.holidays.map((holiday) => (
                <tr
                  key={holiday.date}
                  className={
                    !draft.useColombianHolidays || !holiday.enabled
                      ? "opacity-50"
                      : ""
                  }
                >
                  <td className="w-16">
                    <input
                      type="checkbox"
                      disabled={!draft.useColombianHolidays}
                      checked={holiday.enabled}
                      onChange={() => toggleHoliday(holiday.date)}
                      className="size-4 accent-[var(--brand)]"
                    />
                  </td>
                  <td className="font-mono font-bold text-slate-800">
                    {holiday.date}
                  </td>
                  <td>
                    <strong>{holiday.name}</strong>
                  </td>
                  <td>
                    <span className="status-pill status-gray">
                      {holiday.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        holiday.impact === "Pico comercial"
                          ? "status-green"
                          : holiday.impact === "Alto tráfico"
                            ? "status-blue"
                            : "status-amber"
                      }`}
                    >
                      {holiday.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
          <p className="text-xs text-slate-500">
            Formato regional activo: <strong>es-CO</strong> · Moneda:{" "}
            <strong>$ 1.234.567 (COP)</strong> · Fecha:{" "}
            <strong>DD/MM/AAAA</strong>
          </p>
          <button
            type="button"
            onClick={() => onSaveParameters(draft)}
            className="primary-button"
          >
            <Save className="size-4" /> Guardar parámetros operativos
          </button>
        </div>
      </section>
    </div>
  )
}
