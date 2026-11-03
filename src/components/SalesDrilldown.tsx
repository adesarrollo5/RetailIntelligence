import { useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  FolderTree,
  Package,
  Search,
  Store,
  Tag,
} from "lucide-react"
import type { DrilldownStore } from "../data/analyticsData"
import type { Client } from "../types"
import {
  formatCOP,
  formatNumberCO,
  formatVariationCO,
} from "../utils/formatters"

type Props = {
  client: Client
  stores: DrilldownStore[]
  comparisonPeriodText: string
}

export function SalesDrilldown({
  client,
  stores,
  comparisonPeriodText,
}: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const [search, setSearch] = useState("")

  const terms = client.terminology
  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? null
  const selectedCategory =
    selectedStore?.categories.find((c) => c.id === selectedCategoryId) ?? null

  const resetToStores = () => {
    setSelectedStoreId(null)
    setSelectedCategoryId(null)
    setSearch("")
  }

  const resetToCategories = () => {
    setSelectedCategoryId(null)
    setSearch("")
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <FolderTree className="size-4 text-[var(--brand)]" />
            Navegación en profundidad: {terms.storeSingular} → Categoría →
            Producto
          </h2>
          <p className="section-subtitle">
            Haga clic en cualquier fila para profundizar o use las migas de pan
            para regresar · Comparado con {comparisonPeriodText}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              !selectedStore
                ? `Filtrar ${terms.storePlural.toLowerCase()}...`
                : !selectedCategory
                  ? "Filtrar categoría..."
                  : "Filtrar producto o SKU..."
            }
            className="field h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <nav
        aria-label="Migas de pan de profundización"
        className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-xs sm:px-6"
      >
        <button
          type="button"
          onClick={resetToStores}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition ${
            !selectedStore
              ? "bg-[var(--brand)] text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Store className="size-3.5" />
          Todas las {terms.storePlural.toLowerCase()} ({stores.length})
        </button>

        {selectedStore && (
          <>
            <ChevronRight className="size-3.5 text-slate-400" />
            <button
              type="button"
              onClick={resetToCategories}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition ${
                !selectedCategory
                  ? "bg-[var(--brand)] text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Tag className="size-3.5" />
              {selectedStore.name}
            </button>
          </>
        )}

        {selectedStore && selectedCategory && (
          <>
            <ChevronRight className="size-3.5 text-slate-400" />
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-2.5 py-1 font-bold text-white">
              <Package className="size-3.5" />
              {selectedCategory.name}
            </span>
          </>
        )}
      </nav>

      {!selectedStore && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{terms.storeSingular}</th>
                <th>Base comparable</th>
                <th>Ventas netas</th>
                <th>Comparación</th>
                <th>Variación %</th>
                <th>{terms.transactionPlural}</th>
                <th>{terms.transactionSingular} promedio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stores
                .filter(
                  (st) =>
                    st.name.toLowerCase().includes(search.toLowerCase()) ||
                    st.city.toLowerCase().includes(search.toLowerCase()),
                )
                .map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => setSelectedStoreId(st.id)}
                    className="cursor-pointer"
                  >
                    <td>
                      <strong>{st.name}</strong>
                      <span>
                        {st.zoneOrFormat} · Apertura {st.openedDate}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          st.comparable ? "status-green" : "status-amber"
                        }`}
                      >
                        {st.comparable ? "Comparable" : "Nueva apertura"}
                      </span>
                    </td>
                    <td className="font-bold text-slate-900">
                      {formatCOP(st.netSales)}
                    </td>
                    <td className="text-slate-500">
                      {formatCOP(st.comparisonSales)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          st.variation >= 0
                            ? "text-[#047857]"
                            : "text-[#be123c]"
                        }`}
                      >
                        {st.variation >= 0 ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {formatVariationCO(st.variation)}
                      </span>
                    </td>
                    <td>{formatNumberCO(st.transactions)}</td>
                    <td>{formatCOP(st.avgTicket)}</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand)]">
                        Categorías <ChevronRight className="size-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStore && !selectedCategory && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría en {selectedStore.name}</th>
                <th>Ventas netas</th>
                <th>Comparación</th>
                <th>Variación %</th>
                <th>{terms.transactionPlural}</th>
                <th>Unidades vendidas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedStore.categories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((cat) => (
                  <tr
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="cursor-pointer"
                  >
                    <td>
                      <strong>{cat.name}</strong>
                      <span>{cat.products.length} referencias activas</span>
                    </td>
                    <td className="font-bold text-slate-900">
                      {formatCOP(cat.netSales)}
                    </td>
                    <td className="text-slate-500">
                      {formatCOP(cat.comparisonSales)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          cat.variation >= 0
                            ? "text-[#047857]"
                            : "text-[#be123c]"
                        }`}
                      >
                        {cat.variation >= 0 ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {formatVariationCO(cat.variation)}
                      </span>
                    </td>
                    <td>{formatNumberCO(cat.transactions)}</td>
                    <td>{formatNumberCO(cat.units)} u.</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand)]">
                        Ver productos <ChevronRight className="size-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStore && selectedCategory && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU / Producto</th>
                <th>Unidades</th>
                <th>Precio promedio</th>
                <th>Ventas netas</th>
                <th>Comparación</th>
                <th>Variación %</th>
              </tr>
            </thead>
            <tbody>
              {selectedCategory.products
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.sku.toLowerCase().includes(search.toLowerCase()),
                )
                .map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <strong>{prod.name}</strong>
                      <span className="font-mono">
                        SKU: {prod.sku} · {selectedCategory.name}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-700">
                      {formatNumberCO(prod.units)} u.
                    </td>
                    <td>{formatCOP(prod.avgPrice)}</td>
                    <td className="font-bold text-slate-900">
                      {formatCOP(prod.netSales)}
                    </td>
                    <td className="text-slate-500">
                      {formatCOP(prod.comparisonSales)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          prod.variation >= 0
                            ? "text-[#047857]"
                            : "text-[#be123c]"
                        }`}
                      >
                        {prod.variation >= 0 ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {formatVariationCO(prod.variation)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
