import { Building2, Hexagon, Layers, Sparkles } from "lucide-react"
import type { AppearanceConfig, Client } from "../types"
import { darkenHex } from "../utils/contrast"

export function BrandMark({
  client,
  compact = false,
  darkSurface = false,
  appearanceOverride,
}: {
  client: Client
  compact?: boolean
  darkSurface?: boolean
  appearanceOverride?: AppearanceConfig
}) {
  const appearance = appearanceOverride ?? client.appearance
  const variant = darkSurface ? appearance.logoDark : appearance.logoLight
  const customUrl = darkSurface
    ? appearance.customLogoDarkUrl
    : appearance.customLogoLightUrl
  const primary = appearance.primaryColor || client.color
  const secondary = appearance.secondaryColor || client.secondaryColor
  const accent = appearance.accentColor || client.accentColor
  const primaryDark = darkenHex(primary, 0.24)

  return (
    <div className="flex items-center gap-3">
      {variant === "custom" && customUrl ? (
        <img
          src={customUrl}
          alt={client.shortName}
          className="size-9 shrink-0 rounded-xl border border-slate-200/40 object-contain bg-white/90 p-1 shadow-sm"
        />
      ) : variant === "emblem" ? (
        <div
          className="relative grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          }}
        >
          <Hexagon className="size-5 opacity-35" />
          <span className="absolute text-[10px] font-black tracking-tight">
            {client.initials}
          </span>
        </div>
      ) : variant === "horizontal" ? (
        <div
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-white shadow-sm"
          style={{
            background: darkSurface
              ? `linear-gradient(135deg, ${secondary}, ${primary})`
              : `linear-gradient(135deg, ${primary}, ${primaryDark})`,
          }}
        >
          <Layers className="size-3.5" style={{ color: accent }} />
          <span className="text-[11px] font-black tracking-tight">
            {client.initials}
          </span>
        </div>
      ) : variant === "minimal" ? (
        <div
          className="grid size-9 shrink-0 place-items-center rounded-xl border-2 font-extrabold text-xs shadow-sm"
          style={{
            borderColor: primary,
            backgroundColor: darkSurface ? "rgba(255,255,255,0.08)" : "#ffffff",
            color: darkSurface ? "#ffffff" : primary,
          }}
        >
          <Building2 className="size-4" />
        </div>
      ) : (
        <div
          className="grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold tracking-tight text-white shadow-sm"
          style={{
            background: `linear-gradient(145deg, ${primary}, ${primaryDark})`,
          }}
        >
          {client.initials}
        </div>
      )}
      {!compact && (
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-bold ${
              darkSurface ? "text-white" : "text-slate-900"
            }`}
          >
            {client.shortName}
          </p>
          <p
            className={`flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] ${
              darkSurface ? "text-slate-300" : "text-slate-400"
            }`}
          >
            <Sparkles className="size-2.5 shrink-0" style={{ color: accent }} />
            <span className="truncate">{appearance.productName}</span>
          </p>
        </div>
      )}
    </div>
  )
}
