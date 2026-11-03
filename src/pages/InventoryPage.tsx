import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  PlugZap,
  Percent,
  RefreshCcw,
  Wallet,
  Warehouse,
} from "lucide-react"
import { AlertListsSection } from "../components/inventory/AlertListsSection"
import { SectionTabs } from "../components/inventory/shared"
import { StockSection } from "../components/inventory/StockSection"
import { TransfersSection } from "../components/inventory/TransfersSection"
import { KpiCard } from "../components/KpiCard"
import {
  ModuleStateFeedback,
  ModuleStateSwitcher,
} from "../components/ModuleStateControls"
import { NoInventoryBadge } from "../components/inventory/shared"
import { getComparisonPeriodText, getPeriodMeta } from "../data/analyticsData"
import {
  buildInitialHomologation,
  buildTransfers,
  buildUniverse,
  computeInventoryKpis,
  evaluate,
  hasInventoryData,
  noInventoryReason,
  type Homologation,
} from "../data/inventoryData"
import { getCategoryOptions, matchesGlobalScope, type StoreRecord } from "../data/storesData"
import type { Client, GlobalFilters, ModuleDataState, PageId } from "../types"
import {
  calcVariationPercent,
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
  formatVariationCO,
} from "../utils/formatters"
import { Layers } from "lucide-react"

type Props = {
  client: Client
  filters: GlobalFilters
  stores: StoreRecord[]
  homologation: Homologation | undefined
  onNavigate: (page: PageId) => void
}

type Section = "stock" | "alertas" | "traslados"

export function InventoryPage({
  client,
  filters,
  stores,
  homologation,
  onNavigate,
}: Props) {
  const terms = client.terminology
  const storeLower = terms.storeSingular.toLowerCase()
  const storesLower = terms.storePlural.toLowerCase()
  const period = getPeriodMeta(filters.periodId)
  const compText = getComparisonPeriodText(filters.periodId, filters.compareMode)

  const [dataState, setDataState] = useState<ModuleDataState>("ready")
  const [section, setSection] = useState<Section>("stock")
  const [stockView, setStockView] = useState<"sku" | "store">("sku")
  const [stockKey, setStockKey] = useState(0)

  const universe = useMemo(() => buildUniverse(client, stores), [client, stores])
  const baseHomologation = useMemo(
    () => buildInitialHomologation(universe),
    [universe],
  )
  const h = homologation ?? baseHomologation

  const scoped = useMemo(
    () => stores.filter((s) => matchesGlobalScope(s, filters.scope)),
    [stores, filters.scope],
  )
  const rows = useMemo(
    () => evaluate(universe, scoped, filters.periodId, filters.compareMode),
    [universe, scoped, filters.periodId, filters.compareMode],
  )
  const invRows = useMemo(() => rows.filter((r) => r.stock !== null), [rows])
  const kpis = useMemo(
    () => computeInventoryKpis(invRows, filters.periodId),
    [invRows, filters.periodId],
  )
  const transferCount = useMemo(
    () => buildTransfers(invRows).filter((t) => t.toStatus === "Quiebre").length,
    [invRows],
  )

  const invStores = scoped.filter(hasInventoryData)
  const noDataStores = scoped.filter((s) => !hasInventoryData(s))
  // Servicios y entretenimiento no manejan mercancía: no cuentan en la cobertura.
  const goodsStores = scoped.filter((s) => noInventoryReason(s) !== "Categoría sin inventario físico")
  const staleStores = invStores.filter((s) =>
    s.sources.some((x) => x.kind === "Inventario" && x.status !== "Conectado"),
  )
  const errorStores = invStores.filter((s) =>
    s.sources.some((x) => x.kind === "Inventario" && x.status === "Error"),
  )

  const standardCategories = useMemo(() => getCategoryOptions(client), [client])
  const counts = {
    quiebre: invRows.filter((r) => r.status === "Quiebre").length,
    sobrestock: invRows.filter((r) => r.status === "Sobrestock").length,
    inmovilizado: invRows.filter((r) => r.status === "Inmovilizado").length,
  }

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
          <Layers className="size-3.5" />
          Alcance: <strong>{filters.scope}</strong> · Periodo:{" "}
          <strong>{period.label}</strong>
        </p>
        <h1 className="page-title">Inventario</h1>
        <p className="page-subtitle">
          Existencias, cobertura y rotación por {storeLower} y SKU. Comparando
          frente a <strong>{compText}</strong>
        </p>
      </div>
      <ModuleStateSwitcher state={dataState} onChange={setDataState} />
    </div>
  )

  if (dataState !== "ready") {
    return (
      <div className="page-wrap space-y-5">
        {header}
        <ModuleStateFeedback
          state={dataState}
          moduleLabel="Inventario"
          scopeLabel={filters.scope}
          periodLabel={period.label}
          onReset={() => setDataState("ready")}
        />
      </div>
    )
  }

  // Sin ninguna ubicación con inventario integrado en el alcance.
  if (invStores.length === 0) {
    return (
      <div className="page-wrap space-y-5">
        {header}
        <section className="card px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Warehouse className="size-6" />
          </span>
          <div className="mt-4">
            <NoInventoryBadge />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            Ninguna {storeLower} del alcance integra inventario
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500">
            {scoped.length === 0
              ? `No hay ${storesLower} dentro del alcance «${filters.scope}». Cambie el filtro global de alcance.`
              : `Las ${formatNumberCO(scoped.length)} ${storesLower} de «${filters.scope}» no reportan existencias. Conecte un ERP o cargue un CSV automático de inventario para ver stock, cobertura y quiebres.`}
          </p>
          <button
            type="button"
            className="primary-button mt-5"
            onClick={() => onNavigate("integraciones")}
          >
            <PlugZap className="size-4" />
            Ir a Integraciones
          </button>
        </section>
      </div>
    )
  }

  const coveragePct = goodsStores.length
    ? Math.round((invStores.length / goodsStores.length) * 100)
    : 0

  const kpiCards = [
    {
      label: "Unidades en stock",
      value: formatNumberCO(kpis.units),
      change: formatVariationCO(calcVariationPercent(kpis.units, kpis.compUnits)),
      positive: kpis.units <= kpis.compUnits,
      detail: `vs ${formatNumberCO(kpis.compUnits)}`,
      icon: Boxes,
    },
    {
      label: "Valor del inventario (costo)",
      value: formatCOP(kpis.value),
      change: formatVariationCO(calcVariationPercent(kpis.value, kpis.compValue)),
      positive: kpis.value <= kpis.compValue,
      detail: `vs ${formatCOP(kpis.compValue)}`,
      icon: Wallet,
    },
    {
      label: "Días de inventario",
      value: kpis.sold > 0 ? formatDecimalCO(kpis.days, 0) : "—",
      change: formatVariationCO(calcVariationPercent(kpis.days, kpis.compDays)),
      positive: kpis.days <= kpis.compDays,
      detail: `vs ${formatDecimalCO(kpis.compDays, 0)} días`,
      icon: CalendarClock,
    },
    {
      label: "Rotación del periodo",
      value: `${formatDecimalCO(kpis.rotation, 2)}x`,
      change: formatVariationCO(
        calcVariationPercent(kpis.rotation, kpis.compRotation),
      ),
      positive: kpis.rotation >= kpis.compRotation,
      detail: `${formatDecimalCO(kpis.annualRotation, 1)}x anualizada`,
      icon: RefreshCcw,
    },
    {
      label: "Sell-through del periodo",
      value: `${formatDecimalCO(kpis.sellThrough, 1)} %`,
      change: `${kpis.sellThrough - kpis.compSellThrough > 0 ? "+" : ""}${formatDecimalCO(kpis.sellThrough - kpis.compSellThrough, 1)} pp`,
      positive: kpis.sellThrough >= kpis.compSellThrough,
      detail: `vs ${formatDecimalCO(kpis.compSellThrough, 1)} %`,
      icon: Percent,
    },
  ]

  return (
    <div className="page-wrap space-y-5">
      {header}

      {/* Cobertura de datos */}
      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-[260px] flex-1">
          <p className="text-xs font-bold text-slate-900">
            Inventario integrado en {formatNumberCO(invStores.length)} de{" "}
            {formatNumberCO(goodsStores.length)} {storesLower} con mercancía
            <span className="ml-2 font-medium text-slate-400">
              ({coveragePct} %)
            </span>
          </p>
          <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--brand)]"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Los KPIs y las listas consideran solo las {storesLower} que integran
            inventario.
            {noDataStores.length > 0 && (
              <>
                {" "}
                El resto aparece como <strong>«Sin datos de inventario»</strong>.
              </>
            )}
          </p>
        </div>
        {noDataStores.length > 0 && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSection("stock")
              setStockView("store")
              setStockKey((k) => k + 1)
            }}
          >
            Ver {formatNumberCO(noDataStores.length)} {storesLower} sin datos de
            inventario
          </button>
        )}
      </div>

      {errorStores.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <p>
            La integración de inventario falló en{" "}
            <strong>{formatNumberCO(errorStores.length)}</strong> {storesLower}:
            sus existencias corresponden a la última sincronización exitosa y
            pueden estar desactualizadas.{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => onNavigate("integraciones")}
            >
              Revisar integraciones
            </button>
          </p>
        </div>
      )}
      {errorStores.length === 0 && staleStores.length > 0 && (
        <p className="text-[11px] text-amber-700">
          {formatNumberCO(staleStores.length)} {storesLower} reportan
          sincronización con atención en inventario; revise la calidad del dato.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div>
        <SectionTabs
          label="Secciones de inventario"
          value={section}
          onChange={setSection}
          tabs={[
            { id: "stock", label: `Stock por ${storeLower} y SKU` },
            {
              id: "alertas",
              label: "Quiebres, sobrestock e inmovilizado",
              badge: formatNumberCO(
                counts.quiebre + counts.sobrestock + counts.inmovilizado,
              ),
              warn: true,
            },
            {
              id: "traslados",
              label: "Traslados sugeridos",
              badge: formatNumberCO(transferCount),
            },
          ]}
        />
        <div className="pt-5">
          {section === "stock" && (
            <StockSection
              key={stockKey}
              client={client}
              rows={invRows}
              noDataStores={noDataStores}
              homologation={h}
              categories={standardCategories}
              periodId={filters.periodId}
              presetView={stockView}
              onOpenIntegrations={() => onNavigate("integraciones")}
            />
          )}
          {section === "alertas" && (
            <AlertListsSection client={client} rows={invRows} />
          )}
          {section === "traslados" && (
            <TransfersSection
              client={client}
              rows={invRows}
              scopeLabel={filters.scope}
            />
          )}
        </div>
      </div>
    </div>
  )
}
