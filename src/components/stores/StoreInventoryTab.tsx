import {
  AlertTriangle,
  Boxes,
  PackageX,
  RefreshCcw,
  Wallet,
} from "lucide-react"
import { KpiCard } from "../KpiCard"
import { EmptyPanel } from "./StoreBadges"
import {
  buildStoreInventory,
  getStoreMetrics,
  type InventoryLineStatus,
} from "../../data/storeAnalytics"
import type { StoreRecord } from "../../data/storesData"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
} from "../../utils/formatters"

const statusStyle: Record<InventoryLineStatus, string> = {
  Quiebre: "bg-rose-50 text-rose-700 ring-rose-200",
  Bajo: "bg-amber-50 text-amber-800 ring-amber-200",
  Óptimo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Sobrestock: "bg-violet-50 text-violet-700 ring-violet-200",
}

export function StoreInventoryTab({
  store,
  onOpenIntegration,
}: {
  store: StoreRecord
  onOpenIntegration?: () => void
}) {
  const source = store.sources.find((s) => s.kind === "Inventario")
  const m = getStoreMetrics(store, "mar_2025", "prev_period")

  if (!source || !m.hasData) {
    return (
      <EmptyPanel
        title="Sin datos de inventario"
        description={
          !source
            ? "Esta ubicación no tiene una fuente de inventario conectada. Conecte un ERP o cargue un CSV automático para ver existencias, cobertura y quiebres."
            : "La ubicación no registra rotación en el periodo, por lo que no es posible calcular cobertura."
        }
        action={
          onOpenIntegration && (
            <button
              type="button"
              className="secondary-button"
              onClick={onOpenIntegration}
            >
              Ver fuentes de integración
            </button>
          )
        }
      />
    )
  }

  const inv = buildStoreInventory(store)

  return (
    <div className="space-y-5">
      {source.status !== "Conectado" && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-xs ${
            source.status === "Error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-bold">
              Inventario con datos desactualizados · última sincronización{" "}
              {source.lastSync}
            </p>
            <p className="mt-0.5">{source.detail}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Referencias (SKU) activas"
          value={formatNumberCO(inv.skus)}
          change={`${inv.stockouts} en quiebre`}
          positive={inv.stockouts < inv.skus * 0.04}
          detail="al 31/03/2025"
          icon={Boxes}
        />
        <KpiCard
          label="Unidades en existencia"
          value={formatNumberCO(inv.units)}
          change={`${formatNumberCO(inv.coverageDays)} días`}
          positive={inv.coverageDays >= 20 && inv.coverageDays <= 75}
          detail="de cobertura"
          icon={PackageX}
        />
        <KpiCard
          label="Inventario a costo"
          value={formatCOP(inv.valueAtCost)}
          change={`${inv.overstock} línea(s)`}
          positive={inv.overstock === 0}
          detail="con sobrestock"
          icon={Wallet}
        />
        <KpiCard
          label="Rotación anualizada"
          value={`${formatDecimalCO(inv.rotation, 1)}x`}
          change="Base marzo 2025"
          positive
          detail="ventas ÷ inventario"
          icon={RefreshCcw}
        />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="section-title">Existencias y cobertura por línea</h2>
          <p className="section-subtitle">
            Cobertura = unidades en existencia ÷ venta diaria promedio. Óptimo:
            20 a 75 días.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Línea</th>
                <th className="px-3 py-2.5 text-right">SKU</th>
                <th className="px-3 py-2.5 text-right">Unidades</th>
                <th className="px-3 py-2.5 text-right">Valor a costo</th>
                <th className="px-3 py-2.5 text-right">Cobertura</th>
                <th className="px-5 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inv.lines.map((l) => (
                <tr key={l.name}>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {l.name}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {formatNumberCO(l.skus)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {formatNumberCO(l.units)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-800">
                    {formatCOP(l.value)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {formatNumberCO(l.coverageDays)} días
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyle[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="section-title">Referencias que requieren reposición</h2>
        <p className="section-subtitle mb-3">
          Priorizadas por días restantes de venta
        </p>
        <ul className="divide-y divide-slate-100">
          {inv.alerts.map((a) => (
            <li
              key={a.sku}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
            >
              <div>
                <p className="font-semibold text-slate-800">{a.name}</p>
                <p className="font-mono text-[11px] text-slate-400">{a.sku}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-500">
                  {a.units} und · {a.daysLeft} día(s)
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                    a.kind === "Quiebre"
                      ? statusStyle.Quiebre
                      : statusStyle.Bajo
                  }`}
                >
                  {a.kind === "Quiebre" ? "Quiebre" : "Stock bajo"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
