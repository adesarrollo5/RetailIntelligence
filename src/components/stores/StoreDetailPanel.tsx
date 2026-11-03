import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Boxes,
  FileText,
  Footprints,
  LayoutGrid,
  MapPin,
  PencilLine,
  PlugZap,
  Receipt,
  ShoppingCart,
  Layers,
  Ruler,
  Percent,
} from "lucide-react"
import { KpiCard } from "../KpiCard"
import { IntegrationBadge, OccupancyBadge, StatusBadge } from "./StoreBadges"
import { StoreContractTab } from "./StoreContractTab"
import { StoreIntegrationTab } from "./StoreIntegrationTab"
import { StoreInventoryTab } from "./StoreInventoryTab"
import { StoreSalesTab } from "./StoreSalesTab"
import { StoreTrafficTab, isTrafficLocked } from "./StoreTrafficTab"
import { StoreTrendChart } from "./StoreTrendChart"
import { getDepartment, getMunicipality } from "../../data/colombiaGeo"
import {
  getComparisonPeriodText,
  getPeriodMeta,
} from "../../data/analyticsData"
import {
  buildThirteenMonthTrend,
  getContractMetrics,
  getStoreMetrics,
} from "../../data/storeAnalytics"
import {
  integrationStateOf,
  isoToDisplay,
  parentLabelOf,
  scheduleText,
  type StoreRecord,
} from "../../data/storesData"
import type { Client, GlobalFilters } from "../../types"
import {
  formatCOP,
  formatDecimalCO,
  formatNumberCO,
  formatVariationCO,
} from "../../utils/formatters"

export type DetailTabId = "resumen" | "ventas" | "inventario" | "trafico" | "integracion" | "contrato"

type Props = {
  client: Client
  store: StoreRecord
  filters: GlobalFilters
  canEdit: boolean
  canManageIntegration: boolean
  /** Oculta el botón de volver (gerente de una sola tienda). */
  hideBack?: boolean
  onBack: () => void
  onEdit: () => void
  onOpenIntegrationsPage?: () => void
  onOpenPlanSettings?: () => void
}

export function StoreDetailPanel({
  client,
  store,
  filters,
  canEdit,
  canManageIntegration,
  hideBack = false,
  onBack,
  onEdit,
  onOpenIntegrationsPage,
  onOpenPlanSettings,
}: Props) {
  const terms = client.terminology
  const [tab, setTab] = useState<DetailTabId>("resumen")
  const hasContractTab = client.type === "operator"

  useEffect(() => {
    setTab("resumen")
  }, [store.id])

  const tabs: Array<{ id: DetailTabId; label: string; icon: typeof LayoutGrid }> =
    [
      { id: "resumen", label: "Resumen", icon: LayoutGrid },
      { id: "ventas", label: "Ventas", icon: ShoppingCart },
      { id: "inventario", label: "Inventario", icon: Boxes },
      { id: "trafico", label: "Tráfico", icon: Footprints },
      { id: "integracion", label: "Integración", icon: PlugZap },
      ...(hasContractTab
        ? [{ id: "contrato" as const, label: "Contrato", icon: FileText }]
        : []),
    ]

  const muni = getMunicipality(store.muniCode)
  const dept = getDepartment(store.deptCode)
  const integration = integrationStateOf(store)
  const contract = hasContractTab
    ? getContractMetrics(store, filters.periodId, filters.compareMode)
    : null

  return (
    <div className="page-wrap">
      {!hideBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" />
          Volver a {terms.storePlural.toLowerCase()}
        </button>
      )}

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="page-title">{store.name}</h1>
            <StatusBadge status={store.status} />
          </div>
          <p className="page-subtitle flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[12px] font-semibold text-slate-600">
              {store.code}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {muni?.name ?? "—"}, {dept?.name ?? "—"}
            </span>
            <span>
              {store.parent} · {store.zone}
            </span>
          </p>
        </div>
        {canEdit && (
          <button type="button" className="secondary-button" onClick={onEdit}>
            <PencilLine className="size-4" />
            Editar {terms.storeSingular.toLowerCase()}
          </button>
        )}
      </header>

      <div
        role="tablist"
        aria-label={`Secciones de ${store.name}`}
        className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold ${
                active
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        {tab === "resumen" && (
          <SummaryTab
            client={client}
            store={store}
            filters={filters}
            muniName={muni?.name ?? "—"}
            deptName={dept?.name ?? "—"}
            integration={integration}
            contract={contract}
            onGoTab={setTab}
          />
        )}
        {tab === "ventas" && (
          <StoreSalesTab client={client} store={store} filters={filters} />
        )}
        {tab === "inventario" && (
          <StoreInventoryTab
            store={store}
            onOpenIntegration={() => setTab("integracion")}
          />
        )}
        {tab === "trafico" && (
          <StoreTrafficTab
            client={client}
            store={store}
            filters={filters}
            onOpenPlan={onOpenPlanSettings}
          />
        )}
        {tab === "integracion" && (
          <StoreIntegrationTab
            store={store}
            canManage={canManageIntegration}
            onOpenIntegrations={onOpenIntegrationsPage}
          />
        )}
        {tab === "contrato" && hasContractTab && (
          <StoreContractTab client={client} store={store} filters={filters} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------- Resumen ------------------------------- */

function SummaryTab({
  client,
  store,
  filters,
  muniName,
  deptName,
  integration,
  contract,
  onGoTab,
}: {
  client: Client
  store: StoreRecord
  filters: GlobalFilters
  muniName: string
  deptName: string
  integration: ReturnType<typeof integrationStateOf>
  contract: ReturnType<typeof getContractMetrics>
  onGoTab: (t: DetailTabId) => void
}) {
  const terms = client.terminology
  const m = getStoreMetrics(store, filters.periodId, filters.compareMode)
  const period = getPeriodMeta(filters.periodId)
  const compText = getComparisonPeriodText(
    filters.periodId,
    filters.compareMode,
  )
  const trend = buildThirteenMonthTrend(store)
  const trafficLocked = isTrafficLocked(client)
  const showConversion = store.hasCounter && !trafficLocked && m.hasData

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        KPIs de <strong className="text-slate-700">{period.label}</strong>{" "}
        frente a {compText}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Ventas netas"
          value={m.hasData ? formatCOP(m.netSales) : "—"}
          change={m.hasData ? formatVariationCO(m.variation) : "Sin ventas"}
          positive={m.variation >= 0}
          detail={
            m.hasData ? `vs ${formatCOP(m.comparisonSales)}` : store.status
          }
          icon={ShoppingCart}
        />
        <KpiCard
          label={terms.transactionPlural}
          value={m.hasData ? formatNumberCO(m.transactions) : "—"}
          change={m.hasData ? formatVariationCO(m.transactionsVar) : "N/D"}
          positive={m.transactionsVar >= 0}
          detail={m.hasData ? `vs ${formatNumberCO(m.compTransactions)}` : ""}
          icon={Receipt}
        />
        <KpiCard
          label="Ticket promedio"
          value={m.hasData ? formatCOP(m.avgTicket) : "—"}
          change={m.hasData ? formatVariationCO(m.avgTicketVar) : "N/D"}
          positive={m.avgTicketVar >= 0}
          detail={m.hasData ? `vs ${formatCOP(m.compAvgTicket)}` : ""}
          icon={Layers}
        />
        <KpiCard
          label="Ventas por m²"
          value={m.hasData ? formatCOP(m.salesPerSqm) : "—"}
          change={m.hasData ? formatVariationCO(m.salesPerSqmVar) : "N/D"}
          positive={m.salesPerSqmVar >= 0}
          detail={m.hasData ? `vs ${formatCOP(m.compSalesPerSqm)}` : ""}
          icon={Ruler}
        />
        <KpiCard
          label="Conversión"
          value={showConversion ? `${formatDecimalCO(m.conversion, 1)} %` : "—"}
          change={
            showConversion
              ? `${
                  m.conversionDeltaPp > 0 ? "+" : ""
                }${formatDecimalCO(m.conversionDeltaPp, 1)} pp`
              : trafficLocked
                ? "Plan Avanzado"
                : "Sin contador"
          }
          positive={m.conversionDeltaPp >= 0}
          detail={
            showConversion
              ? `${formatNumberCO(m.visitors)} ${terms.visitorsLabel.toLowerCase()}`
              : ""
          }
          icon={Percent}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card p-5 sm:p-6 xl:col-span-2">
          <h2 className="section-title">Ventas netas · últimos 13 meses</h2>
          <p className="section-subtitle mb-3">
            Serie mensual de {store.name} frente al mismo mes del año anterior
          </p>
          <StoreTrendChart
            data={trend}
            color={client.color}
            gradientId={`storeSummaryFill-${store.id}`}
            height={400}
            comparisonText="Periodo comp.: mismo mes del año anterior"
          />
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="section-title">
            Ficha de la {terms.storeSingular.toLowerCase()}
          </h2>
          <dl className="mt-4 space-y-3 text-xs">
            {([
              [parentLabelOf(client), store.parent],
              ["Zona / piso", store.zone],
              ["Formato", store.format],
              ["Categoría", store.category],
              ["Área", `${formatDecimalCO(store.sqm, 1)} m²`],
              ["Horario", scheduleText(store.schedule)],
              ["Dirección", store.address],
              [
                "Ubicación DANE",
                `${muniName} (${store.muniCode}) · ${deptName} (${store.deptCode})`,
              ],
              [
                "Coordenadas",
                `${formatDecimalCO(store.lat, 4)}, ${formatDecimalCO(store.lng, 4)}`,
              ],
              ["Apertura", isoToDisplay(store.openedDate)],
              [
                "Comparabilidad",
                store.comparable
                  ? "Comparable (más de 13 meses)"
                  : "No comparable (apertura reciente)",
              ],
            ] as Array<[string, string]>).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-slate-50 pb-2.5 last:border-0"
              >
                <dt className="shrink-0 text-slate-400">{k}</dt>
                <dd className="text-right font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Fuentes de datos</h2>
            <IntegrationBadge state={integration} />
          </div>
          {store.sources.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No hay fuentes conectadas para esta{" "}
              {terms.storeSingular.toLowerCase()}.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {store.sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{s.kind}</p>
                    <p className="text-[11px] text-slate-400">
                      Última sincronización · {s.lastSync}
                    </p>
                  </div>
                  <IntegrationBadge state={s.status} />
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-3 text-xs font-bold text-[var(--brand)] hover:underline"
            onClick={() => onGoTab("integracion")}
          >
            Ver detalle de integración
          </button>
        </section>

        {contract && (
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Contrato y ocupación</h2>
              <OccupancyBadge
                level={contract.level}
                pct={contract.occupancyPct}
                showLabel
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-400">Canon mensual</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {formatCOP(store.contract!.monthlyRent)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Vigencia hasta</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {isoToDisplay(store.contract!.end)} · {contract.termStatus}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-3 text-xs font-bold text-[var(--brand)] hover:underline"
              onClick={() => onGoTab("contrato")}
            >
              Ver contrato
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
