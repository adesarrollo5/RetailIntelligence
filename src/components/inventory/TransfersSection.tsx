import { useMemo, useState } from "react"
import { ArrowRight, FileSpreadsheet, Info } from "lucide-react"
import {
  InventoryStatusBadge,
  Pager,
  Segmented,
  SearchInput,
  stockDays,
  usePager,
} from "./shared"
import { getMunicipality } from "../../data/colombiaGeo"
import {
  buildTransfers,
  KEEP_COVERAGE_DAYS,
  OVERSTOCK_COVERAGE_DAYS,
  TARGET_COVERAGE_DAYS,
  type EvalRow,
  type Transfer,
} from "../../data/inventoryData"
import type { Client } from "../../types"
import { downloadXlsx } from "../../utils/xlsx"
import { formatCOP, formatDecimalCO, formatNumberCO } from "../../utils/formatters"

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function TransfersSection({
  client,
  rows,
  scopeLabel,
}: {
  client: Client
  rows: EvalRow[]
  scopeLabel: string
}) {
  const terms = client.terminology
  const storeLower = terms.storeSingular.toLowerCase()
  const [dest, setDest] = useState<"quiebre" | "all">("quiebre")
  const [q, setQ] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const all = useMemo(() => buildTransfers(rows), [rows])
  const list = useMemo(() => {
    const nq = normalize(q.trim())
    return all
      .filter((t) => dest === "all" || t.toStatus === "Quiebre")
      .filter(
        (t) =>
          !nq ||
          normalize(
            `${t.sku.code} ${t.sku.description} ${t.from.name} ${t.to.name}`,
          ).includes(nq),
      )
  }, [all, dest, q])
  const pager = usePager(list.length, `${dest}|${q}`, 10)

  const stats = {
    count: list.length,
    units: list.reduce((a, t) => a + t.qty, 0),
    risk: list.reduce((a, t) => a + t.dailyAtRisk, 0),
    origins: new Set(list.map((t) => t.from.id)).size,
    dests: new Set(list.map((t) => t.to.id)).size,
  }
  const cityOf = (s: Transfer["from"]) => getMunicipality(s.muniCode)?.name ?? "—"

  const exportXlsx = () => {
    const d = new Date()
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
    downloadXlsx(`traslados-sugeridos-${client.id}-${stamp}.xlsx`, [
      {
        name: "Traslados sugeridos",
        columns: [
          { header: "Prioridad", width: 10 },
          { header: "SKU", width: 16 },
          { header: "Descripción", width: 40 },
          { header: client.type === "operator" ? "Marca" : "Línea", width: 22 },
          { header: `Origen (${storeLower})`, width: 32 },
          { header: "Ciudad origen", width: 16 },
          { header: "Stock origen (u.)", width: 16 },
          { header: "Cobertura origen (días)", width: 22 },
          { header: `Destino (${storeLower})`, width: 32 },
          { header: "Ciudad destino", width: 16 },
          { header: "Stock destino (u.)", width: 18 },
          { header: "Estado destino", width: 14 },
          { header: "Venta diaria destino (u.)", width: 22 },
          { header: "Cantidad sugerida (u.)", width: 20 },
          { header: "Distancia (km)", width: 14 },
          { header: "Venta diaria en riesgo (COP)", width: 26 },
        ],
        rows: list.map((t, i) => [
          i + 1,
          t.sku.code,
          t.sku.description,
          client.type === "operator" ? t.sku.owner : t.sku.line,
          t.from.name,
          cityOf(t.from),
          t.fromStock,
          Number.isFinite(t.fromCoverage) ? Math.round(t.fromCoverage) : "",
          t.to.name,
          cityOf(t.to),
          t.toStock,
          t.toStatus,
          Number(t.toRate.toFixed(2)),
          t.qty,
          t.distance,
          t.dailyAtRisk,
        ]),
      },
      {
        name: "Criterios",
        columns: [
          { header: "Concepto", width: 34 },
          { header: "Detalle", width: 90 },
        ],
        rows: [
          ["Naturaleza del archivo", "Recomendación. Retail Intelligence no ejecuta traslados; la gestión se realiza en su ERP o sistema de bodega."],
          ["Alcance de datos", scopeLabel],
          ["Corte de inventario", "31/03/2025"],
          ["Origen", `SKU con cobertura mayor a ${OVERSTOCK_COVERAGE_DAYS} días; se cede lo que exceda ${KEEP_COVERAGE_DAYS} días de venta.`],
          ["Destino", dest === "quiebre" ? "SKU en quiebre (stock en 0 con demanda activa)." : "SKU en quiebre o con cobertura menor a 7 días."],
          ["Cantidad sugerida", `Unidades necesarias para que el destino alcance ${TARGET_COVERAGE_DAYS} días de cobertura, limitadas al excedente disponible del origen.`],
          ["Restricción", client.type === "operator" ? "Solo entre ubicaciones de la misma marca (mismo catálogo de SKU)." : "Solo entre ubicaciones con el mismo catálogo de SKU."],
          ["Priorización", "Primero quiebres; luego mayor venta diaria en riesgo. Se prefiere el origen más cercano."],
        ],
      },
    ])
    setNotice(
      `Se exportaron ${formatNumberCO(list.length)} sugerencias a Excel. Recuerde: son recomendaciones y no se ejecutan desde la aplicación.`,
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-950">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
        <p>
          Estas sugerencias <strong>no se ejecutan desde la aplicación</strong>.
          Son una recomendación para mover unidades de {terms.storePlural.toLowerCase()} con
          sobrestock hacia {terms.storePlural.toLowerCase()} en quiebre
          {client.type === "operator"
            ? ", siempre dentro de la misma marca"
            : " con el mismo catálogo"}
          . Expórtelas a Excel para gestionarlas en su ERP o bodega.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Traslados sugeridos", formatNumberCO(stats.count)],
          ["Unidades a mover", formatNumberCO(stats.units)],
          [
            `Origen → destino`,
            `${formatNumberCO(stats.origins)} → ${formatNumberCO(stats.dests)} ${terms.storePlural.toLowerCase()}`,
          ],
          ["Venta diaria recuperable", formatCOP(stats.risk)],
        ].map(([k, v]) => (
          <div key={k} className="card p-5">
            <p className="text-xs font-semibold text-slate-500">{k}</p>
            <p className="mt-2 text-[22px] font-bold tracking-tight text-slate-950">
              {v}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <SearchInput
            value={q}
            onChange={setQ}
            label="Buscar traslados"
            placeholder={`Buscar por SKU, descripción u ${storeLower} de origen o destino`}
          />
          <Segmented
            label="Estado del destino"
            value={dest}
            onChange={setDest}
            options={[
              { id: "quiebre", label: "Destino en quiebre" },
              { id: "all", label: "Quiebre y stock bajo" },
            ]}
          />
          <button
            type="button"
            className="primary-button"
            onClick={exportXlsx}
            disabled={list.length === 0}
          >
            <FileSpreadsheet className="size-4" />
            Exportar a Excel
          </button>
        </div>
        {notice && (
          <p
            role="status"
            className="mx-5 mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
          >
            {notice}
          </p>
        )}

        {list.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-14 text-center">
            <h3 className="text-sm font-bold text-slate-800">
              {all.length === 0
                ? "No hay traslados para sugerir"
                : "Sin sugerencias con este filtro"}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
              {all.length === 0
                ? `Se necesita un SKU en sobrestock en una ${storeLower} y en quiebre o bajo en otra del mismo catálogo dentro del alcance seleccionado.`
                : "Pruebe con «Quiebre y stock bajo» o limpie la búsqueda."}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto border-t border-slate-100">
              <table className="data-table !min-w-[1100px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Origen (sobrestock)</th>
                    <th aria-hidden="true" />
                    <th>Destino</th>
                    <th className="text-right">Cantidad sugerida</th>
                    <th className="text-right">Distancia</th>
                    <th className="text-right">Venta diaria en riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.slice(list).map((t) => (
                    <tr key={t.id}>
                      <td className="min-w-[220px]">
                        <strong>{t.sku.description}</strong>
                        <span className="font-mono">
                          {t.sku.code}
                          {client.type === "operator" ? ` · ${t.sku.owner}` : ""}
                        </span>
                      </td>
                      <td className="min-w-[190px]">
                        <strong>{t.from.name}</strong>
                        <span>
                          {cityOf(t.from)} · {formatNumberCO(t.fromStock)} u. ·{" "}
                          {stockDays(t.fromCoverage)} días
                        </span>
                      </td>
                      <td className="!px-0 text-slate-300">
                        <ArrowRight className="size-4" />
                      </td>
                      <td className="min-w-[190px]">
                        <strong className="flex items-center gap-2">
                          {t.to.name}
                        </strong>
                        <span className="!flex items-center gap-1.5">
                          <InventoryStatusBadge status={t.toStatus} />
                          {cityOf(t.to)} · {formatNumberCO(t.toStock)} u.
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        <strong className="!inline text-base text-slate-900">
                          {formatNumberCO(t.qty)}
                        </strong>{" "}
                        <span className="!inline text-slate-400">u.</span>
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {t.distance === 0 ? "Misma ciudad" : `${formatNumberCO(t.distance)} km`}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCOP(t.dailyAtRisk)}
                        <span className="!mt-0 !block text-[10px] text-slate-400">
                          {formatDecimalCO(t.toRate, 1)} u./día
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager pager={pager} total={list.length} />
          </>
        )}
      </div>
    </section>
  )
}
