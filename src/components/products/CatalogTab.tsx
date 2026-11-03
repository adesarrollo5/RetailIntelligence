import { useMemo, useState } from "react"
import {
  Pager,
  SearchInput,
  UnmappedBadge,
  selectCls,
  usePager,
} from "../inventory/shared"
import {
  UNMAPPED_LABEL,
  type Homologation,
  type OriginCategory,
  type ProductAgg,
} from "../../data/inventoryData"
import type { Client } from "../../types"
import { formatCOP, formatNumberCO } from "../../utils/formatters"

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function CatalogTab({
  client,
  products,
  origins,
  categories,
  homologation,
}: {
  client: Client
  products: ProductAgg[]
  origins: Map<string, OriginCategory>
  categories: string[]
  homologation: Homologation
}) {
  const terms = client.terminology
  const [q, setQ] = useState("")
  const [category, setCategory] = useState("")
  const [origin, setOrigin] = useState("")

  const originOptions = useMemo(() => {
    const codes = new Set(products.map((p) => p.sku.originCode))
    return [...codes].sort().map((c) => ({ code: c, name: origins.get(c)?.name ?? c }))
  }, [products, origins])

  const list = useMemo(() => {
    const nq = normalize(q.trim())
    return products
      .filter((p) => {
        const std = homologation[p.sku.originCode] ?? null
        if (category === UNMAPPED_LABEL ? std !== null : category && std !== category) return false
        if (origin && p.sku.originCode !== origin) return false
        if (nq) {
          const o = origins.get(p.sku.originCode)
          const hay = normalize(
            `${p.sku.code} ${p.sku.description} ${p.sku.owner} ${p.sku.originCode} ${o?.name ?? ""}`,
          )
          if (!hay.includes(nq)) return false
        }
        return true
      })
      .sort((a, b) => a.sku.code.localeCompare(b.sku.code))
  }, [products, q, category, origin, homologation, origins])

  const pager = usePager(list.length, `${q}|${category}|${origin}`, 10)

  return (
    <section className="card overflow-hidden">
      <div className="px-5 pt-5">
        <h2 className="section-title">Catálogo recibido de las integraciones</h2>
        <p className="section-subtitle">
          {formatNumberCO(products.length)} SKU presentes en las{" "}
          {terms.storePlural.toLowerCase()} del alcance. La categoría estándar
          proviene de la homologación.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <SearchInput
          value={q}
          onChange={setQ}
          label="Buscar en el catálogo"
          placeholder="Buscar por SKU, descripción, marca o categoría de origen"
        />
        <select
          aria-label="Categoría estándar"
          className={`${selectCls} !w-auto min-w-[200px]`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas las categorías estándar</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value={UNMAPPED_LABEL}>{UNMAPPED_LABEL}</option>
        </select>
        <select
          aria-label="Categoría de origen"
          className={`${selectCls} !w-auto min-w-[200px]`}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          <option value="">Todas las categorías de origen</option>
          {originOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.code} · {o.name}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <div className="border-t border-slate-100 px-6 py-14 text-center">
          <h3 className="text-sm font-bold text-slate-800">
            {products.length === 0 ? "Catálogo vacío" : "Sin resultados"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {products.length === 0
              ? "Ninguna integración ha enviado productos para este alcance."
              : "Ningún SKU coincide con la búsqueda y los filtros aplicados."}
          </p>
          {products.length > 0 && (
            <button
              type="button"
              className="secondary-button mt-4"
              onClick={() => {
                setQ("")
                setCategory("")
                setOrigin("")
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto border-t border-slate-100">
            <table className="data-table !min-w-[1080px] [&_td]:!px-3 [&_th]:!px-3 [&_td:first-child]:!pl-5 [&_th:first-child]:!pl-5">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Descripción</th>
                  <th>Categoría de origen</th>
                  <th>Categoría estándar</th>
                  <th>Fuente</th>
                  <th className="text-right">Precio lista</th>
                  <th className="text-right">{terms.storePlural}</th>
                </tr>
              </thead>
              <tbody>
                {pager.slice(list).map((p) => {
                  const o = origins.get(p.sku.originCode)
                  const std = homologation[p.sku.originCode] ?? null
                  return (
                    <tr key={p.sku.id}>
                      <td className="whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                        {p.sku.code}
                      </td>
                      <td className="min-w-[250px]">
                        <strong>{p.sku.description}</strong>
                        <span>
                          {client.type === "operator"
                            ? `${p.sku.owner} · ${p.sku.line}`
                            : p.sku.line}
                        </span>
                      </td>
                      <td className="min-w-[160px]">
                        <strong className="font-mono !text-[11px]">
                          {p.sku.originCode}
                        </strong>
                        <span>{o?.name}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        {std ? (
                          <span className="font-semibold text-slate-700">{std}</span>
                        ) : (
                          <UnmappedBadge />
                        )}
                      </td>
                      <td className="whitespace-nowrap">{p.sku.source}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCOP(p.sku.price)}
                      </td>
                      <td className="text-right tabular-nums">{p.stores}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pager pager={pager} total={list.length} />
        </>
      )}
    </section>
  )
}
