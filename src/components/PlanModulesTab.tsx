import { CheckCircle2, Crown, Lock, Sparkles, Unlock } from "lucide-react"
import { moduleCatalog, planRank } from "../data/demo"
import type { Client, Plan } from "../types"

type Props = {
  client: Client
  onChangePlan: (nextPlan: Plan) => void
}

const plansMeta: Array<{
  id: Plan
  priceNote: string
  retention: string
  summary: string
}> = [
  {
    id: "Esencial",
    priceNote: "Hasta 15 ubicaciones",
    retention: "13 meses de historia",
    summary: "Ventas POS, tiendas/locales, integraciones básicas y reportes.",
  },
  {
    id: "Profesional",
    priceNote: "Hasta 60 ubicaciones",
    retention: "24 meses de historia",
    summary: "Suma inventario, productos, tráfico/aforo, comparativos y metas.",
  },
  {
    id: "Avanzado",
    priceNote: "Ubicaciones ilimitadas · Multi-CC",
    retention: "36 meses de historia + API",
    summary:
      "Suma alertas inteligentes, dominio propio CNAME y marca blanca total.",
  },
]

export function PlanModulesTab({ client, onChangePlan }: Props) {
  const currentRank = planRank[client.plan]
  const activeModules = moduleCatalog.filter(
    (m) => planRank[m.minPlan] <= currentRank,
  )
  const lockedModules = moduleCatalog.filter(
    (m) => planRank[m.minPlan] > currentRank,
  )

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold text-[var(--brand)]">
              <Crown className="size-3.5" /> Suscripción activa de {client.name}
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Plan {client.plan}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeModules.length} de {moduleCatalog.length} módulos
              habilitados ·{" "}
              {lockedModules.length === 0
                ? "Cobertura funcional completa"
                : `${lockedModules.length} módulos disponibles en planes superiores`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Simulador comercial de plan
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Cambie de plan para ver candados y menú en vivo
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {plansMeta.map((p) => {
            const isCurrent = client.plan === p.id
            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                  isCurrent
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]/60 ring-2 ring-[var(--brand)]/15"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Plan {p.id}
                    </h3>
                    {isCurrent ? (
                      <span className="status-pill status-green">
                        Plan actual
                      </span>
                    ) : (
                      <span className="status-pill status-gray">
                        Nivel {planRank[p.id]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {p.priceNote} · {p.retention}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {p.summary}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onChangePlan(p.id)}
                  className={`mt-4 w-full rounded-lg py-2 text-xs font-bold transition ${
                    isCurrent
                      ? "bg-[var(--brand)] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {isCurrent
                    ? `Plan ${p.id} activo`
                    : `Probar con plan ${p.id}`}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-title">
              Módulos de la plataforma según su plan
            </h2>
            <p className="section-subtitle">
              Los módulos bloqueados se ocultan automáticamente en la barra
              lateral y muestran el plan requerido.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="status-pill status-green">
              {activeModules.length} activos
            </span>
            <span className="status-pill status-amber">
              {lockedModules.length} bloqueados
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {moduleCatalog.map((mod) => {
            const unlocked = planRank[mod.minPlan] <= currentRank
            const dynamicName =
              mod.id === "tiendas"
                ? `${client.terminology.storePlural} (${mod.name})`
                : mod.id === "trafico"
                  ? `${client.terminology.visitorsLabel} y conversión`
                  : mod.name
            return (
              <article
                key={mod.id}
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition ${
                  unlocked
                    ? "border-slate-200 bg-white"
                    : "border-amber-200/80 bg-slate-50/90"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                      unlocked
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-100/80 text-amber-700"
                    }`}
                  >
                    {unlocked ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-xs font-bold ${
                          unlocked ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {dynamicName}
                      </h3>
                      {mod.adminOnly && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          Solo Administrador
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <Unlock className="size-3" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      <Lock className="size-3" /> Disponible en plan{" "}
                      {mod.minPlan}
                    </span>
                  )}
                </div>
              </article>
            )
          })}

          <article
            className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
              client.plan === "Avanzado"
                ? "border-slate-200 bg-white"
                : "border-amber-200/80 bg-slate-50/90"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                  client.plan === "Avanzado"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-100/80 text-amber-700"
                }`}
              >
                {client.plan === "Avanzado" ? (
                  <Sparkles className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Dominio propio CNAME + SSL dedicado
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Permite publicar la plataforma bajo el dominio corporativo de
                  su empresa con validación DNS.
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              {client.plan === "Avanzado" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <Unlock className="size-3" /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                  <Lock className="size-3" /> Disponible en plan Avanzado
                </span>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
