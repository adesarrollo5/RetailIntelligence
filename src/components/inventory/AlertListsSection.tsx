import { useMemo, useState } from "react"
import { AlertOctagon, Hourglass, PackageX, Warehouse } from "lucide-react"
import { Pager, SearchInput, stockDays, usePager } from "./shared"
import { getMunicipality } from "../../data/colombiaGeo"
import {
  IMMOBILIZED_DAYS,
  isoMinusDays,
  LOW_COVERAGE_DAYS,
  OVERSTOCK_COVERAGE_DAYS,
  KEEP_COVERAGE_DAYS,
  type EvalRow,
} from "../../data/inventoryData"
import type { Client } from "../../types"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../../utils/formatters"

type ListId = "quiebre" | "sobrestock" | "inmovilizado"

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function AlertListsSection({
  client,
  rows,
}: {
  client: Client
  rows: EvalRow[]
}) {
  const terms = client.terminology
  const [list, setList] = useState<ListId>("quiebre")
  const [q, setQ] = useState("")

  const lists = useMemo(() => {
    const quiebre = rows
      .filter((r) => r.status === "Quiebre")
      .sort((a, b) => b.refRate * b.sku.price - a.refRate * a.sku.price)
    const sobrestock = rows
      .filter((r) => r.status === "Sobrestock")
      .sort(
        (a, b) =>
          excessValue(b) - excessValue(a),
      )
    const inmovilizado = rows
      .filter((r) => r.status === "Inmovilizado")
      .sort((a, b) => b.stockCost - a.stockCost)
    return { quiebre, sobrestock, inmovilizado }
  }, [rows])

  const totals = {
    quiebre: lists.quiebre.reduce((a, r) => a + r.refRate * r.sku.price, 0),
    sobrestock: lists.sobrestock.reduce((a, r) => a + excessValue(r), 0),
    inmovilizado: lists.inmovilizado.reduce((a, r) => a + r.stockCost, 0),
  }

  const nq = normalize(q.trim())
  const current = lists[list].filter(
    (r) =>
      !nq ||
      normalize(`${r.sku.code} ${r.sku.description} ${r.store.name}`).includes(nq),
  )
  const pager = usePager(current.length, `${list}|${q}`, 10)

  const cards: Array<{
    id: ListId
    title: string
    rule: string
    metric: string
    icon: typeof PackageX
    tone: string
  }> = [
    {
      id: "quiebre",
      title: "Quiebres de stock",
      rule: "Stock en 0 con demanda activa",
      metric: `${formatCOP(totals.quiebre)} de venta diaria en riesgo`,
      icon: PackageX,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      id: "sobrestock",
      title: "Sobrestock",
      rule: `Cobertura mayor a ${OVERSTOCK_COVERAGE_DAYS} días`,
      metric: `${formatCOP(totals.sobrestock)} en exceso a costo`,
      icon: Warehouse,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      id: "inmovilizado",
      title: "Inventario inmovilizado",
      rule: `Sin ventas hace más de ${IMMOBILIZED_DAYS} días`,
      metric: `${formatCOP(totals.inmovilizado)} detenidos a costo`,
      icon: Hourglass,
      tone: "text-slate-700 bg-slate-100",
    },
  ]

  const cityOf = (r: EvalRow) => getMunicipality(r.store.muniCode)?.name ?? "—"

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const active = list === c.id
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setList(c.id)}
              className={`card p-5 text-left transition ${
                active
                  ? "!border-[var(--brand)] ring-2 ring-[var(--brand-soft)]"
                  : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`grid size-9 place-items-center rounded-xl ${c.tone}`}>
                  <c.icon className="size-[18px]" />
                </span>
                <span className="text-[26px] font-bold tracking-tight text-slate-950">
                  {formatNumberCO(lists[c.id].length)}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{c.title}</h3>
              <p className="text-[11px] text-slate-400">{c.rule}</p>
              <p className="mt-2 text-xs font-semibold text-slate-600">{c.metric}</p>
            </button>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <h2 className="section-title mr-auto">
            {cards.find((c) => c.id === list)!.title}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {formatNumberCO(current.length)} SKU por {terms.storeSingular.toLowerCase()}
            </span>
          </h2>
          <SearchInput
            value={q}
            onChange={setQ}
            label="Buscar en la lista"
            placeholder={`Buscar por SKU, descripción o ${terms.storeSingular.toLowerCase()}`}
          />
        </div>

        {current.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-14 text-center">
            <AlertOctagon className="mx-auto size-7 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              {lists[list].length === 0
                ? "Sin casos en el alcance seleccionado"
                : "Sin resultados"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {lists[list].length === 0
                ? "No hay SKUs que cumplan esta condición para las ubicaciones con inventario integrado."
                : "Ningún caso coincide con la búsqueda."}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto border-t border-slate-100">
              <table className="data-table !min-w-[960px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
                <thead>
                  <tr>
                    <th>{terms.storeSingular}</th>
                    <th>SKU</th>
                    {list === "quiebre" && (
                      <>
                        <th className="text-right">Venta diaria (u.)</th>
                        <th className="text-right">Venta diaria en riesgo</th>
                        <th className="text-right">Días en quiebre</th>
                      </>
                    )}
                    {list === "sobrestock" && (
                      <>
                        <th className="text-right">Stock (u.)</th>
                        <th className="text-right">Cobertura (días)</th>
                        <th className="text-right">Exceso (u.)</th>
                        <th className="text-right">Exceso a costo</th>
                      </>
                    )}
                    {list === "inmovilizado" && (
                      <>
                        <th className="text-right">Stock (u.)</th>
                        <th className="text-right">Valor a costo</th>
                        <th className="text-right">Días sin ventas</th>
                        <th>Última venta</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pager.slice(current).map((r) => (
                    <tr key={r.id}>
                      <td className="min-w-[190px]">
                        <strong>{r.store.name}</strong>
                        <span>
                          {cityOf(r)} · {r.store.parent}
                        </span>
                      </td>
                      <td className="min-w-[230px]">
                        <strong>{r.sku.description}</strong>
                        <span className="font-mono">
                          {r.sku.code}
                          {client.type === "operator" ? ` · ${r.sku.owner}` : ""}
                        </span>
                      </td>
                      {list === "quiebre" && (
                        <>
                          <td className="text-right tabular-nums">
                            {formatDecimalCO(r.refRate, 1)}
                          </td>
                          <td className="whitespace-nowrap text-right tabular-nums">
                            <strong className="!inline text-rose-600">
                              {formatCOP(r.refRate * r.sku.price)}
                            </strong>
                          </td>
                          <td className="text-right tabular-nums">{r.daysOut}</td>
                        </>
                      )}
                      {list === "sobrestock" && (
                        <>
                          <td className="text-right tabular-nums">
                            {formatNumberCO(r.stock ?? 0)}
                          </td>
                          <td className="text-right tabular-nums">
                            {stockDays(r.coverage)}
                          </td>
                          <td className="text-right tabular-nums">
                            {formatNumberCO(excessUnits(r))}
                          </td>
                          <td className="whitespace-nowrap text-right tabular-nums">
                            <strong className="!inline text-violet-700">
                              {formatCOP(excessValue(r))}
                            </strong>
                          </td>
                        </>
                      )}
                      {list === "inmovilizado" && (
                        <>
                          <td className="text-right tabular-nums">
                            {formatNumberCO(r.stock ?? 0)}
                          </td>
                          <td className="whitespace-nowrap text-right tabular-nums">
                            {formatCOP(r.stockCost)}
                          </td>
                          <td className="text-right tabular-nums">
                            <strong className="!inline text-slate-800">
                              {r.lastSaleDays}
                            </strong>
                          </td>
                          <td className="whitespace-nowrap">
                            {isoMinusDays(r.lastSaleDays)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager pager={pager} total={current.length} />
          </>
        )}
      </div>
      <p className="text-[11px] leading-5 text-slate-400">
        Los quiebres y el sobrestock se evalúan con la venta de los últimos 30
        días, sin importar el periodo seleccionado. Un SKU está en nivel bajo
        cuando su cobertura es menor a {LOW_COVERAGE_DAYS} días. El exceso se
        mide sobre {KEEP_COVERAGE_DAYS} días de cobertura.
      </p>
    </section>
  )
}

function excessUnits(r: EvalRow): number {
  return Math.max(0, Math.round((r.stock ?? 0) - r.refRate * KEEP_COVERAGE_DAYS))
}
function excessValue(r: EvalRow): number {
  return excessUnits(r) * r.sku.cost
}
