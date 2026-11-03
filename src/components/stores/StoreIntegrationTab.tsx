import { useEffect, useRef, useState } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  PlugZap,
  RefreshCw,
  ScanLine,
  ShoppingBag,
  Warehouse,
} from "lucide-react"
import { EmptyPanel, IntegrationBadge } from "./StoreBadges"
import {
  integrationStateOf,
  type SourceKind,
  type StoreRecord,
  type StoreSource,
} from "../../data/storesData"
import { formatNumberCO } from "../../utils/formatters"

const kindIcon = {
  "POS · Ventas": ShoppingBag,
  "Contador de personas": ScanLine,
  Inventario: Warehouse,
  "Catálogo ERP": Database,
} as const

const allKinds: SourceKind[] = [
  "POS · Ventas",
  "Contador de personas",
  "Inventario",
  "Catálogo ERP",
]

const kindPurpose: Record<SourceKind, string> = {
  "POS · Ventas": "Alimenta ventas, tickets y unidades.",
  "Contador de personas": "Alimenta afluencia y conversión.",
  Inventario: "Alimenta existencias, cobertura y quiebres.",
  "Catálogo ERP": "Alimenta categorías, precios y referencias.",
}

type Props = {
  store: StoreRecord
  /** Si se define, se muestra un acceso al módulo global de Integraciones. */
  onOpenIntegrations?: () => void
  canManage: boolean
}

function nowStamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `31/03/2025 ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function StoreIntegrationTab({
  store,
  onOpenIntegrations,
  canManage,
}: Props) {
  // Estado local de la demostración: sincronizaciones manuales.
  const [overrides, setOverrides] =
    useState<Record<string, Partial<StoreSource>>>({})
  const [syncing, setSyncing] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    tone: "ok" | "error"
    text: string
  } | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setOverrides({})
    setSyncing(null)
    setNotice(null)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [store.id])

  const sources = store.sources.map((s) => ({ ...s, ...overrides[s.id] }))
  const state = integrationStateOf({ ...store, sources })
  const missing = allKinds.filter((k) => !sources.some((s) => s.kind === k))

  const sync = (src: StoreSource) => {
    setSyncing(src.id)
    setNotice(null)
    timer.current = window.setTimeout(() => {
      setSyncing(null)
      if (src.status === "Error") {
        setNotice({
          tone: "error",
          text: `${src.connector} no respondió. Se registró el intento y el equipo de soporte fue notificado.`,
        })
        return
      }
      setOverrides((prev) => ({
        ...prev,
        [src.id]: {
          status: "Conectado",
          lastSync: nowStamp(),
          latencyMs: 240,
          detail: "Sincronización manual completada sin diferencias",
        },
      }))
      setNotice({
        tone: "ok",
        text: `${src.connector} sincronizado correctamente.`,
      })
    }, 1300)
  }

  if (sources.length === 0) {
    return (
      <EmptyPanel
        title="Sin fuentes conectadas"
        description={`${store.name} aún no tiene fuentes de datos. Conecte el POS para recibir ventas y, opcionalmente, contador de personas, inventario y catálogo.`}
        action={
          onOpenIntegrations && (
            <button
              type="button"
              className="primary-button"
              onClick={onOpenIntegrations}
            >
              <PlugZap className="size-4" />
              Ir a Integraciones
            </button>
          )
        }
      />
    )
  }

  const lastOk = sources
    .filter((s) => s.status === "Conectado")
    .map((s) => s.lastSync)
    .sort()
    .pop()

  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              Estado general
            </p>
            <div className="mt-1">
              <IntegrationBadge state={state} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              Fuentes conectadas
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {sources.filter((s) => s.status === "Conectado").length} de{" "}
              {sources.length}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">
              Última sincronización exitosa
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Clock className="size-3.5 text-slate-400" />
              {lastOk ?? "Sin sincronizaciones recientes"}
            </p>
          </div>
        </div>
        {onOpenIntegrations && (
          <button
            type="button"
            className="secondary-button"
            onClick={onOpenIntegrations}
          >
            <PlugZap className="size-4" />
            Administrar conectores
          </button>
        )}
      </section>

      {notice && (
        <div
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
            notice.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {notice.tone === "ok" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          )}
          {notice.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sources.map((s) => {
          const Icon = kindIcon[s.kind]
          const busy = syncing === s.id
          const barColor =
            s.quality >= 95
              ? "bg-emerald-500"
              : s.quality >= 80
                ? "bg-amber-500"
                : "bg-rose-500"
          return (
            <article key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {s.kind}
                    </h3>
                    <p className="text-xs text-slate-500">{s.connector}</p>
                  </div>
                </div>
                <IntegrationBadge state={s.status} />
              </div>

              <p
                className={`mt-4 rounded-lg px-3 py-2 text-xs leading-5 ${
                  s.status === "Error"
                    ? "bg-rose-50 text-rose-800"
                    : s.status === "Atención"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-slate-50 text-slate-600"
                }`}
              >
                {s.detail}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-[11px] text-slate-400">
                    Última sincronización
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {s.lastSync}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">
                    Registros últimas 24 h
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {formatNumberCO(s.records24h)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">Latencia</dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {s.latencyMs > 0
                      ? `${formatNumberCO(s.latencyMs)} ms`
                      : "Sin respuesta"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-400">
                    Calidad del dato
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-full max-w-[84px] overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${barColor}`}
                        style={{ width: `${s.quality}%` }}
                      />
                    </span>
                    <span className="font-semibold text-slate-800">
                      {s.quality}%
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-400">
                  {kindPurpose[s.kind]}
                </span>
                {canManage && (
                  <button
                    type="button"
                    className="secondary-button !min-h-8 !px-3"
                    disabled={busy || syncing !== null}
                    onClick={() => sync(s)}
                  >
                    {busy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    {busy ? "Sincronizando…" : "Sincronizar"}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {missing.length > 0 && (
        <section className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Activity className="size-4 text-slate-400" />
            Fuentes sin conectar
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {missing.map((k) => (
              <li
                key={k}
                className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2.5"
              >
                <span className="size-2 rounded-full bg-slate-300" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">{k}</p>
                  <p className="text-[11px] text-slate-400">{kindPurpose[k]}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
