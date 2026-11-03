import { useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  Lock,
  Moon,
  ShieldAlert,
  Sun,
} from "lucide-react"
import type { AppearanceConfig, Client } from "../types"
import {
  darkenHex,
  getContrastRatio,
  getFontStack,
  softTintHex,
} from "../utils/contrast"
import { BrandMark } from "./BrandMark"

type Props = {
  client: Client
  draft: AppearanceConfig
}

export function LiveThemePreview({ client, draft }: Props) {
  const [surfaceMode, setSurfaceMode] = useState<"light" | "dark">("light")
  const ratio = getContrastRatio(draft.primaryColor, "#ffffff")
  const passesAA = ratio >= 4.5
  const fontStack = getFontStack(draft.fontFamily)
  const primarySoft = softTintHex(draft.primaryColor, 0.88)
  const primaryDark = darkenHex(draft.primaryColor, 0.22)
  const domainPreview =
    client.plan === "Avanzado" && draft.customDomain.trim()
      ? draft.customDomain.trim()
      : `${draft.subdomain || client.id}.retailintelligence.co`

  const terms = client.terminology

  return (
    <aside className="xl:sticky xl:top-[92px]">
      <div className="card overflow-hidden border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Vista previa en vivo
            </span>
            <p className="text-[11px] text-slate-400">
              Simulación instantánea antes de guardar
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setSurfaceMode("light")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                surfaceMode === "light"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500"
              }`}
            >
              <Sun className="size-3" /> Claro
            </button>
            <button
              type="button"
              onClick={() => setSurfaceMode("dark")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${
                surfaceMode === "dark"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500"
              }`}
            >
              <Moon className="size-3" /> Oscuro
            </button>
          </div>
        </div>

        {/* Simulated browser frame */}
        <div
          className="p-4"
          style={{
            fontFamily: fontStack,
          }}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#f5f7fa] shadow-inner">
            {/* Browser tab & URL */}
            <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex max-w-[180px] items-center gap-1.5 rounded-t-md bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-xs">
                  {draft.favicon === "custom" && draft.customFaviconUrl ? (
                    <img
                      src={draft.customFaviconUrl}
                      alt="Favicon"
                      className="size-3.5 rounded-xs object-contain"
                    />
                  ) : (
                    <span
                      className={`grid size-3.5 shrink-0 place-items-center text-[7px] font-black ${
                        draft.favicon === "circle"
                          ? "rounded-full"
                          : draft.favicon === "shield"
                            ? "rounded-[3px]"
                            : "rounded-xs"
                      }`}
                      style={{
                        backgroundColor:
                          draft.favicon === "outline"
                            ? "#ffffff"
                            : draft.primaryColor,
                        color:
                          draft.favicon === "outline"
                            ? draft.primaryColor
                            : "#ffffff",
                        border:
                          draft.favicon === "outline"
                            ? `1.5px solid ${draft.primaryColor}`
                            : "none",
                      }}
                    >
                      {client.initials.slice(0, 2)}
                    </span>
                  )}
                  <span className="truncate">
                    {draft.productName || "Retail Intelligence"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500">
                  <Lock className="size-2.5 shrink-0 text-emerald-600" />
                  <span className="truncate font-mono">{domainPreview}</span>
                </div>
              </div>
            </div>

            {/* Sample dashboard shell */}
            <div className="grid grid-cols-[118px_1fr]">
              {/* Mini sidebar */}
              <div
                className={`border-r p-2.5 transition-colors ${
                  surfaceMode === "dark"
                    ? "border-slate-800 bg-[#0d1729] text-white"
                    : "border-slate-200/80 bg-white text-slate-800"
                }`}
              >
                <div className="mb-3 pb-2 border-b border-slate-200/20">
                  <BrandMark
                    client={client}
                    darkSurface={surfaceMode === "dark"}
                    appearanceOverride={draft}
                  />
                </div>
                <div className="space-y-1 text-[10px] font-semibold">
                  <div
                    className="rounded-md px-2 py-1.5 font-bold"
                    style={{
                      backgroundColor:
                        surfaceMode === "dark"
                          ? draft.primaryColor
                          : primarySoft,
                      color:
                        surfaceMode === "dark" ? "#ffffff" : draft.primaryColor,
                    }}
                  >
                    Inicio
                  </div>
                  <div
                    className={`rounded-md px-2 py-1 ${
                      surfaceMode === "dark"
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {terms.storePlural}
                  </div>
                  <div
                    className={`rounded-md px-2 py-1 ${
                      surfaceMode === "dark"
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    Ventas
                  </div>
                  <div
                    className={`rounded-md px-2 py-1 ${
                      surfaceMode === "dark"
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {terms.visitorsLabel}
                  </div>
                </div>
              </div>

              {/* Mini main content */}
              <div className="p-3 space-y-2.5 bg-[#f5f6f8]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: draft.accentColor }}
                    >
                      {draft.fontFamily} · {client.shortName}
                    </p>
                    <p className="text-xs font-bold text-slate-900">
                      Resumen por {terms.storeSingular.toLowerCase()}
                    </p>
                  </div>
                  <span
                    className="rounded-md px-2 py-1 text-[9px] font-bold text-white shadow-xs"
                    style={{
                      background: `linear-gradient(135deg, ${draft.primaryColor}, ${primaryDark})`,
                    }}
                  >
                    Exportar
                  </span>
                </div>

                {/* Mini KPIs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-400">
                        Ventas ({terms.transactionPlural.toLowerCase()})
                      </span>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: draft.primaryColor }}
                      />
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      $ 3.820.450
                    </p>
                    <span className="mt-0.5 inline-flex items-center text-[9px] font-bold text-emerald-600">
                      <ArrowUpRight className="size-2.5" /> +12,4%
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-400">
                        {terms.visitorsLabel}
                      </span>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: draft.secondaryColor }}
                      />
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      684.320
                    </p>
                    <span
                      className="mt-0.5 inline-block text-[9px] font-bold"
                      style={{ color: draft.secondaryColor }}
                    >
                      Conversión 17,4%
                    </span>
                  </div>
                </div>

                {/* Mini chart with primary, secondary and accent */}
                <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                  <div className="mb-2 flex items-center justify-between text-[9px]">
                    <span className="font-bold text-slate-700">
                      Tendencia quincenal
                    </span>
                    <div className="flex items-center gap-2 text-[8px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <i
                          className="inline-block size-1.5 rounded-full"
                          style={{ backgroundColor: draft.primaryColor }}
                        />
                        Primario
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <i
                          className="inline-block size-1.5 rounded-full"
                          style={{ backgroundColor: draft.secondaryColor }}
                        />
                        Secundario
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <i
                          className="inline-block size-1.5 rounded-full"
                          style={{ backgroundColor: draft.accentColor }}
                        />
                        Acento
                      </span>
                    </div>
                  </div>
                  <div className="flex h-14 items-end gap-1.5 pt-2">
                    {[44, 62, 54, 88, 70, 96, 82].map((h, idx) => (
                      <div
                        key={idx}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${Math.round(h * 0.44)}px`,
                            backgroundColor:
                              idx === 5
                                ? draft.accentColor
                                : idx % 2 === 0
                                  ? draft.primaryColor
                                  : draft.secondaryColor,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fixed semantic badges */}
                <div className="rounded-lg border border-slate-200/80 bg-white p-2.5">
                  <p className="mb-1.5 text-[9px] font-bold text-slate-500">
                    Estados semánticos fijos (no cambian con el tema)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[9px] font-bold text-[#047857]">
                      <CheckCircle2 className="size-2.5" /> Éxito fijo
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fffbeb] px-2 py-0.5 text-[9px] font-bold text-[#b45309]">
                      <AlertTriangle className="size-2.5" /> Advertencia fija
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f2] px-2 py-0.5 text-[9px] font-bold text-[#be123c]">
                      <ShieldAlert className="size-2.5" /> Error fijo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contrast & Domain status footer */}
          <div className="mt-3 space-y-2">
            <div
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                passesAA
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}
            >
              <span className="font-semibold">
                Contraste botón primario vs. texto blanco
              </span>
              <span className="font-bold">
                {ratio}:1 · {passesAA ? "WCAG AA OK" : "Bajo contraste"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Globe className="size-3.5 text-slate-400" />
                Dominio activo
              </span>
              <span className="font-mono font-semibold text-slate-800 truncate max-w-[195px]">
                {domainPreview}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
