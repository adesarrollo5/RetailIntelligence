import { useState } from "react"
import {
  BookOpenText,
  CheckCircle2,
  Crown,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import { AppearanceTab } from "../components/AppearanceTab"
import { ParametersTab } from "../components/ParametersTab"
import { PlanModulesTab } from "../components/PlanModulesTab"
import { TerminologyTab } from "../components/TerminologyTab"
import type {
  AppearanceConfig,
  Client,
  ParametersConfig,
  Plan,
  TerminologyConfig,
} from "../types"

type SettingsTabId = "apariencia" | "terminologia" | "parametros" | "plan"

type Props = {
  client: Client
  onUpdateAppearance: (next: AppearanceConfig) => void
  onUpdateTerminology: (next: TerminologyConfig) => void
  onUpdateParameters: (next: ParametersConfig) => void
  onUpdatePlan: (nextPlan: Plan) => void
}

export function SettingsPage({
  client,
  onUpdateAppearance,
  onUpdateTerminology,
  onUpdateParameters,
  onUpdatePlan,
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("apariencia")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3600)
  }

  const tabs: Array<{
    id: SettingsTabId
    label: string
    icon: typeof Palette
    badge?: string
  }> = [
    {
      id: "apariencia",
      label: "Apariencia",
      icon: Palette,
      badge: "Marca blanca",
    },
    {
      id: "terminologia",
      label: "Terminología",
      icon: BookOpenText,
    },
    {
      id: "parametros",
      label: "Parámetros",
      icon: SlidersHorizontal,
      badge: "es-CO",
    },
    {
      id: "plan",
      label: "Plan y módulos",
      icon: Crown,
      badge: client.plan,
    },
  ]

  return (
    <div className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
            <ShieldCheck className="size-3.5" /> Acceso exclusivo ·
            Administrador del cliente
          </p>
          <h1 className="page-title">Configuración de marca blanca</h1>
          <p className="page-subtitle">
            Personalice identidad visual, diccionario comercial, calendario de
            Colombia y plan de {client.name}.
          </p>
        </div>

        {toastMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Navegación de pestañas */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                active
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === "apariencia" && (
        <AppearanceTab
          key={`ap-${client.id}`}
          client={client}
          onSaveAppearance={(next) => {
            onUpdateAppearance(next)
            triggerToast(
              `Tema "${next.productName}" y fuente ${next.fontFamily} aplicados en toda la aplicación.`,
            )
          }}
        />
      )}

      {activeTab === "terminologia" && (
        <TerminologyTab
          key={`term-${client.id}`}
          client={client}
          onSaveTerminology={(next) => {
            onUpdateTerminology(next)
            triggerToast(
              `Diccionario actualizado: ${next.storePlural}, ${next.mallPlural}, ${next.visitorsLabel} y ${next.transactionPlural}.`,
            )
          }}
        />
      )}

      {activeTab === "parametros" && (
        <ParametersTab
          key={`param-${client.id}`}
          client={client}
          onSaveParameters={(next) => {
            onUpdateParameters(next)
            triggerToast(
              `Parámetros guardados: ${next.timezone}, semana inicia ${next.weekStartsOn}, ventas ${
                next.salesTaxMode === "sin_iva" ? "sin IVA" : "con IVA"
              }.`,
            )
          }}
        />
      )}

      {activeTab === "plan" && (
        <PlanModulesTab
          client={client}
          onChangePlan={(nextPlan) => {
            onUpdatePlan(nextPlan)
            triggerToast(
              `Plan actualizado a ${nextPlan}. La barra lateral se filtró automáticamente.`,
            )
          }}
        />
      )}
    </div>
  )
}
