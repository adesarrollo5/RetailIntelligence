import { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CirclePlus,
  CloudUpload,
  Database,
  FileSpreadsheet,
  PlugZap,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react"
import { integrationItems, montanaIntegrations } from "../data/demo"
import type { Client, IntegrationStatus } from "../types"

const connectors = [
  { name: "Siesa", desc: "ERP y punto de venta", color: "#1e40af", abbr: "SI" },
  {
    name: "SAP Business One",
    desc: "ERP e inventario",
    color: "#075985",
    abbr: "SAP",
  },
  { name: "Vendty", desc: "POS para retail", color: "#0f766e", abbr: "VE" },
  {
    name: "Archivo CSV / Excel",
    desc: "Carga manual o SFTP",
    color: "#15803d",
    abbr: "CSV",
  },
]

export function IntegrationsPage({ client }: { client: Client }) {
  const [wizard, setWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const baseIntegrations =
    client.type === "operator" ? integrationItems : montanaIntegrations
  const integrations = baseIntegrations.map((item) => ({
    ...item,
    scope: item.scope
      .replace(
        /locales|tiendas/gi,
        client.terminology.storePlural.toLowerCase(),
      )
      .replace(
        /centros comerciales/gi,
        client.terminology.mallPlural.toLowerCase(),
      ),
  }))

  return (
    <div className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Integraciones</h1>
          <p className="page-subtitle">
            Conecte y supervise las fuentes de datos de su organización.
          </p>
        </div>
        <button
          onClick={() => {
            setWizard(true)
            setWizardStep(1)
          }}
          className="primary-button"
        >
          <CirclePlus className="size-4" /> Nueva integración
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Summary
          label="Fuentes activas"
          value={String(integrations.length)}
          detail="Sincronizando automáticamente"
          icon={PlugZap}
          color="blue"
        />
        <Summary
          label="Calidad promedio"
          value={`${Math.round(integrations.reduce((a, b) => a + b.quality, 0) / integrations.length)}%`}
          detail="2,4 pp este mes"
          icon={CheckCircle2}
          color="green"
        />
        <Summary
          label="Registros procesados"
          value="1,8 M"
          detail="Últimos 30 días"
          icon={Database}
          color="purple"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
          <div>
            <h2 className="section-title">Fuentes conectadas</h2>
            <p className="section-subtitle">
              Estado de sincronización y calidad de sus datos
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-52 rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[var(--brand)]"
              placeholder="Buscar integración"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {integrations.map((item) => (
            <IntegrationRow
              key={item.name}
              item={{ ...item, status: item.status as IntegrationStatus }}
            />
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <section className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="section-title">Actividad reciente</h2>
              <p className="section-subtitle">
                Eventos de importación y validación
              </p>
            </div>
            <button className="text-xs font-bold text-[var(--brand)]">
              Ver historial
            </button>
          </div>
          <div className="space-y-4">
            <Activity
              icon={Check}
              title="Sincronización completada"
              text="Siesa Enterprise · 48.293 registros procesados"
              time="Hace 8 min"
            />
            <Activity
              icon={RefreshCw}
              title="Inventario actualizado"
              text="SAP Business One · 12.842 referencias"
              time="Hace 9 h"
            />
            <Activity
              icon={AlertTriangle}
              title="Campos con valores vacíos"
              text="SAP Business One · 214 registros requieren revisión"
              time="Ayer, 23:12"
              alert
            />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="section-title">Calidad de datos</h2>
          <p className="section-subtitle">Completitud de campos críticos</p>
          <div className="mt-6 space-y-5">
            <Quality label="Ventas" value={99} />
            <Quality label="Productos" value={96} />
            <Quality label="Inventario" value={83} alert />
          </div>
          <button className="mt-6 flex items-center gap-1 text-xs font-bold text-[var(--brand)]">
            Abrir centro de calidad <ArrowRight className="size-3.5" />
          </button>
        </section>
      </div>

      {wizard && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[690px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Nueva integración
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Configure una fuente de datos en pocos pasos.
                </p>
              </div>
              <button
                onClick={() => setWizard(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center">
                {["Fuente", "Conexión", "Mapeo", "Validación"].map(
                  (name, index) => (
                    <div
                      key={name}
                      className="flex flex-1 items-center last:flex-none"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid size-6 place-items-center rounded-full text-[10px] font-bold ${
                            wizardStep > index + 1
                              ? "bg-emerald-500 text-white"
                              : wizardStep === index + 1
                                ? "bg-[var(--brand)] text-white"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {wizardStep > index + 1 ? (
                            <Check className="size-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={`hidden text-xs font-semibold sm:block ${
                            wizardStep === index + 1
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {name}
                        </span>
                      </div>
                      {index < 3 && (
                        <span className="mx-3 h-px flex-1 bg-slate-200" />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="p-6">
              {wizardStep === 1 && (
                <>
                  <p className="mb-4 text-sm font-bold text-slate-800">
                    Seleccione el sistema que desea conectar
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {connectors.map((connector, index) => (
                      <button
                        key={connector.name}
                        onClick={() => index === 0 && setWizardStep(2)}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition hover:border-[var(--brand)] hover:shadow-sm ${
                          index === 0
                            ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                            : "border-slate-200"
                        }`}
                      >
                        <span
                          className="grid size-10 place-items-center rounded-lg text-[10px] font-black text-white"
                          style={{ background: connector.color }}
                        >
                          {connector.abbr}
                        </span>
                        <span>
                          <strong className="block text-sm text-slate-800">
                            {connector.name}
                          </strong>
                          <span className="text-xs text-slate-400">
                            {connector.desc}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {wizardStep === 2 && (
                <>
                  <p className="mb-1 text-sm font-bold text-slate-800">
                    Credenciales de conexión
                  </p>
                  <p className="mb-5 text-xs text-slate-500">
                    La información se almacena de forma cifrada.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="field-label">URL del servidor</span>
                      <input
                        className="field"
                        defaultValue="https://api.empresa.co"
                      />
                    </label>
                    <label>
                      <span className="field-label">Usuario API</span>
                      <input
                        className="field"
                        defaultValue="retail_intelligence"
                      />
                    </label>
                    <label>
                      <span className="field-label">Clave API</span>
                      <input
                        className="field"
                        type="password"
                        defaultValue="1234567890"
                      />
                    </label>
                  </div>
                  <button className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--brand)]">
                    <PlugZap className="size-4" /> Probar conexión
                  </button>
                </>
              )}
              {wizardStep === 3 && (
                <>
                  <p className="mb-1 text-sm font-bold text-slate-800">
                    Mapeo de campos
                  </p>
                  <p className="mb-5 text-xs text-slate-500">
                    Relacione las columnas de origen con Retail Intelligence.
                  </p>
                  <div className="space-y-2">
                    {[
                      ["fecha_doc", "Fecha de venta"],
                      ["total_neto", "Venta neta"],
                      ["cod_tienda", "Código de tienda"],
                      ["sku", "SKU de producto"],
                    ].map((map) => (
                      <div
                        key={map[0]}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg bg-slate-50 p-3 text-xs"
                      >
                        <span className="font-mono text-slate-600">
                          {map[0]}
                        </span>
                        <ArrowRight className="size-3.5 text-slate-300" />
                        <span className="font-semibold text-slate-700">
                          {map[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {wizardStep === 4 && (
                <div className="py-6 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    Todo listo para validar
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    La conexión es exitosa y 1.000 registros de muestra cumplen
                    las reglas de calidad.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-slate-100 p-5">
              <button
                onClick={() =>
                  wizardStep > 1
                    ? setWizardStep(wizardStep - 1)
                    : setWizard(false)
                }
                className="secondary-button"
              >
                {wizardStep > 1 ? "Anterior" : "Cancelar"}
              </button>
              <button
                onClick={() =>
                  wizardStep < 4
                    ? setWizardStep(wizardStep + 1)
                    : setWizard(false)
                }
                className="primary-button"
              >
                {wizardStep < 4 ? "Continuar" : "Activar integración"}{" "}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Summary({
  label,
  value,
  detail,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  detail: string
  icon: typeof PlugZap
  color: string
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
  }
  return (
    <article className="card flex items-center gap-4 p-5">
      <span
        className={`grid size-11 place-items-center rounded-xl ${styles[color]}`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p>
      </div>
    </article>
  )
}

function IntegrationRow({
  item,
}: {
  item: {
    name: string
    kind: string
    scope: string
    status: IntegrationStatus
    sync: string
    quality: number
  }
}) {
  return (
    <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1.3fr_.7fr_.8fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
          <FileSpreadsheet className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800">{item.name}</p>
          <p className="text-[11px] text-slate-400">
            {item.kind} · {item.scope}
          </p>
        </div>
      </div>
      <div>
        <span
          className={`status-pill ${
            item.status === "Conectado"
              ? "status-green"
              : item.status === "Atención"
                ? "status-amber"
                : "status-gray"
          }`}
        >
          {item.status}
        </span>
      </div>
      <div>
        <p className="text-[10px] text-slate-400">Última sincronización</p>
        <p className="text-xs font-semibold text-slate-600">{item.sync}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-bold ${
            item.quality < 90 ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          {item.quality}% calidad
        </span>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-700">
          <Settings2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

function Activity({
  icon: Icon,
  title,
  text,
  time,
  alert = false,
}: {
  icon: typeof Check
  title: string
  text: string
  time: string
  alert?: boolean
}) {
  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
          alert
            ? "bg-amber-50 text-amber-600"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700">{title}</p>
        <p className="truncate text-[11px] text-slate-400">{text}</p>
      </div>
      <time className="whitespace-nowrap text-[10px] text-slate-400">
        {time}
      </time>
    </div>
  )
}

function Quality({
  label,
  value,
  alert = false,
}: {
  label: string
  value: number
  alert?: boolean
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span
          className={`font-bold ${alert ? "text-amber-600" : "text-slate-700"}`}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            alert ? "bg-amber-400" : "bg-[var(--brand)]"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
