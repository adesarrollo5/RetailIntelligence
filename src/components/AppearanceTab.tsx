import { useState } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  ImageUp,
  Lock,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react"
import type {
  AppearanceConfig,
  Client,
  FaviconVariant,
  LogoVariant,
} from "../types"
import {
  getContrastRatio,
  googleFontsCatalog,
  makeAccessiblePrimary,
} from "../utils/contrast"
import { BrandMark } from "./BrandMark"
import { LiveThemePreview } from "./LiveThemePreview"

type Props = {
  client: Client
  onSaveAppearance: (next: AppearanceConfig) => void
}

type LogoOptionItem = {
  id: LogoVariant
  label: string
  desc: string
}

const logoOptions: LogoOptionItem[] = [
  {
    id: "monogram",
    label: "Monograma degradado",
    desc: "Iniciales sobre bloque primario",
  },
  {
    id: "emblem",
    label: "Emblema hexagonal",
    desc: "Símbolo geométrico + iniciales",
  },
  {
    id: "horizontal",
    label: "Cápsula corporativa",
    desc: "Isotipo de capas + sigla",
  },
  {
    id: "minimal",
    label: "Contorno arquitectónico",
    desc: "Marco limpio de alto contraste",
  },
]

type FaviconOptionItem = {
  id: FaviconVariant
  label: string
}

const faviconOptions: FaviconOptionItem[] = [
  { id: "rounded", label: "Cuadrado redondeado" },
  { id: "circle", label: "Circular" },
  { id: "shield", label: "Escudo compacto" },
  { id: "outline", label: "Borde sobre blanco" },
]

const primaryPresets = [
  { label: "Azul Petróleo", hex: "#0b4a5c" },
  { label: "Verde Montaña", hex: "#0f766e" },
  { label: "Índigo Ejecutivo", hex: "#4338ca" },
  { label: "Borgoña Retail", hex: "#9f1239" },
  { label: "Pizarra Oscuro", hex: "#1e293b" },
  { label: "Ámbar Claro (Prueba baja AA)", hex: "#f59e0b" },
]

export function AppearanceTab({ client, onSaveAppearance }: Props) {
  const [draft, setDraft] = useState<AppearanceConfig>(client.appearance)
  const [dnsChecking, setDnsChecking] = useState(false)
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)

  const contrastRatio = getContrastRatio(draft.primaryColor, "#ffffff")
  const passesWCAG = contrastRatio >= 4.5
  const canUseCustomDomain = client.plan === "Avanzado"

  const handleFileUpload = (
    target: "light" | "dark" | "favicon",
    file?: File,
  ) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return
      if (target === "light") {
        setDraft((prev) => ({
          ...prev,
          logoLight: "custom",
          customLogoLightUrl: result,
        }))
      } else if (target === "dark") {
        setDraft((prev) => ({
          ...prev,
          logoDark: "custom",
          customLogoDarkUrl: result,
        }))
      } else {
        setDraft((prev) => ({
          ...prev,
          favicon: "custom",
          customFaviconUrl: result,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const copyText = (key: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {})
    }
    setCopiedRecord(key)
    setTimeout(() => setCopiedRecord(null), 1800)
  }

  const verifyDns = () => {
    setDnsChecking(true)
    setTimeout(() => {
      setDnsChecking(false)
      setDraft((prev) => ({ ...prev, dnsVerified: true }))
    }, 550)
  }

  const resetDefaults = () => {
    const defaultAppearance: AppearanceConfig =
      client.id === "plaza"
        ? {
            productName: "Retail Intelligence",
            primaryColor: "#0b4a5c",
            secondaryColor: "#156d85",
            accentColor: "#e3b04b",
            fontFamily: "DM Sans",
            logoLight: "monogram",
            logoDark: "emblem",
            favicon: "rounded",
            subdomain: "plazaandina",
            customDomain: "analitica.plazaandina.com.co",
            dnsVerified: true,
          }
        : {
            productName: "Montaña Pulso Retail",
            primaryColor: "#0f766e",
            secondaryColor: "#14b8a6",
            accentColor: "#f59e0b",
            fontFamily: "Inter",
            logoLight: "emblem",
            logoDark: "monogram",
            favicon: "circle",
            subdomain: "calzadomontana",
            customDomain: "bi.calzadomontana.co",
            dnsVerified: false,
          }
    setDraft(defaultAppearance)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.32fr_.88fr]">
      <div className="space-y-5">
        {/* 1. Identidad, logos y nombre visible */}
        <section className="card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--brand)]" />
                Identidad visual y logotipos
              </h2>
              <p className="section-subtitle">
                Configure el nombre visible del producto, los logos para fondo
                claro/oscuro y el favicon del navegador.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              Marca blanca · {client.shortName}
            </span>
          </div>

          <div className="mb-5">
            <label className="block">
              <span className="field-label">Nombre visible del producto</span>
              <input
                type="text"
                className="field"
                value={draft.productName}
                onChange={(e) =>
                  setDraft({ ...draft, productName: e.target.value })
                }
                placeholder="Ej. Plaza Andina Intelligence"
              />
            </label>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Reemplaza la etiqueta &ldquo;Retail Intelligence&rdquo; en barra
              lateral, pantalla de ingreso, pestaña del navegador y reportes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Logo fondo claro */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Logo para fondo claro
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Usado en barra lateral clara y reportes PDF
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                  <ImageUp className="size-3.5" /> Subir
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload("light", e.target.files?.[0])
                    }
                  />
                </label>
              </div>
              <div className="mb-3 flex h-16 items-center justify-center rounded-lg border border-slate-200/80 bg-white px-4">
                <BrandMark
                  client={client}
                  darkSurface={false}
                  appearanceOverride={draft}
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {logoOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, logoLight: opt.id })}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition ${
                      draft.logoLight === opt.id
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] font-bold text-[var(--brand)]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo fondo oscuro */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Logo para fondo oscuro
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Usado en portada de login y modo contraste
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                  <ImageUp className="size-3.5" /> Subir
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload("dark", e.target.files?.[0])
                    }
                  />
                </label>
              </div>
              <div className="mb-3 flex h-16 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1729] px-4">
                <BrandMark
                  client={client}
                  darkSurface={true}
                  appearanceOverride={draft}
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {logoOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, logoDark: opt.id })}
                    className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition ${
                      draft.logoDark === opt.id
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] font-bold text-[var(--brand)]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Favicon del navegador (32×32 px)
                </p>
                <p className="text-[11px] text-slate-400">
                  Icono mostrado en la pestaña del navegador y marcadores
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                <ImageUp className="size-3.5" /> Subir ICO / PNG
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload("favicon", e.target.files?.[0])
                  }
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {faviconOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, favicon: item.id })}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-semibold transition ${
                    draft.favicon === item.id
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center text-[9px] font-black ${
                      item.id === "circle"
                        ? "rounded-full"
                        : item.id === "shield"
                          ? "rounded-[4px]"
                          : "rounded-md"
                    }`}
                    style={{
                      backgroundColor:
                        item.id === "outline" ? "#ffffff" : draft.primaryColor,
                      color:
                        item.id === "outline" ? draft.primaryColor : "#ffffff",
                      border:
                        item.id === "outline"
                          ? `2px solid ${draft.primaryColor}`
                          : "none",
                    }}
                  >
                    {client.initials.slice(0, 2)}
                  </span>
                  <span className="truncate text-[11px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Paleta de colores y contraste WCAG AA */}
        <section className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Palette className="size-4 text-[var(--brand)]" />
              Colores de marca y validación WCAG AA
            </h2>
            <p className="section-subtitle">
              Personalice los colores primario, secundario y de acento. Los
              colores semánticos de éxito, advertencia y error son fijos.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {primaryPresets.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setDraft({ ...draft, primaryColor: preset.hex })}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300"
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: preset.hex }}
                />
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Primario */}
            <div className="rounded-xl border border-slate-200 p-3.5">
              <span className="block text-xs font-bold text-slate-800">
                Color primario
              </span>
              <span className="block text-[10px] text-slate-400">
                Botones, navegación activa y serie principal
              </span>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Selector color primario"
                  value={draft.primaryColor}
                  onChange={(e) =>
                    setDraft({ ...draft, primaryColor: e.target.value })
                  }
                  className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                />
                <input
                  type="text"
                  value={draft.primaryColor}
                  onChange={(e) =>
                    setDraft({ ...draft, primaryColor: e.target.value })
                  }
                  className="field h-9 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Secundario */}
            <div className="rounded-xl border border-slate-200 p-3.5">
              <span className="block text-xs font-bold text-slate-800">
                Color secundario
              </span>
              <span className="block text-[10px] text-slate-400">
                Comparativos, series de apoyo y gráficas
              </span>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Selector color secundario"
                  value={draft.secondaryColor}
                  onChange={(e) =>
                    setDraft({ ...draft, secondaryColor: e.target.value })
                  }
                  className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                />
                <input
                  type="text"
                  value={draft.secondaryColor}
                  onChange={(e) =>
                    setDraft({ ...draft, secondaryColor: e.target.value })
                  }
                  className="field h-9 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Acento */}
            <div className="rounded-xl border border-slate-200 p-3.5">
              <span className="block text-xs font-bold text-slate-800">
                Color de acento
              </span>
              <span className="block text-[10px] text-slate-400">
                Destacados, picos de quincena e insignias
              </span>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Selector color de acento"
                  value={draft.accentColor}
                  onChange={(e) =>
                    setDraft({ ...draft, accentColor: e.target.value })
                  }
                  className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                />
                <input
                  type="text"
                  value={draft.accentColor}
                  onChange={(e) =>
                    setDraft({ ...draft, accentColor: e.target.value })
                  }
                  className="field h-9 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>

          {/* WCAG AA Check */}
          {!passesWCAG ? (
            <div
              role="alert"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">
                    Advertencia de accesibilidad: el color primario no cumple el
                    contraste WCAG AA ({contrastRatio}:1)
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    Se requiere una relación mínima de <strong>4.5:1</strong>{" "}
                    frente a texto blanco (#FFFFFF) para garantizar legibilidad
                    en botones primarios e indicadores activos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    primaryColor: makeAccessiblePrimary(draft.primaryColor),
                  })
                }
                className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white hover:bg-amber-950"
              >
                Ajustar a tono accesible
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Contraste WCAG AA verificado:</strong> relación{" "}
                  <strong>{contrastRatio}:1</strong> sobre texto blanco (mínimo
                  exigido 4.5:1).
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                AA Aprobado
              </span>
            </div>
          )}

          {/* Colores semánticos fijos */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Colores semánticos del sistema (Fijos)
                </p>
                <p className="text-[11px] text-slate-500">
                  Protegidos para que metas, alertas y calidad de datos
                  mantengan significado inequívoco.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                  <span className="size-2 rounded-full bg-[#10b981]" /> Éxito
                  #047857
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-[#fffbeb] px-2.5 py-1 text-[11px] font-bold text-[#b45309]">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />{" "}
                  Advertencia #B45309
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-[#fff1f2] px-2.5 py-1 text-[11px] font-bold text-[#be123c]">
                  <span className="size-2 rounded-full bg-[#f43f5e]" /> Error
                  #BE123C
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Selector de 6 fuentes de Google Fonts */}
        <section className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Type className="size-4 text-[var(--brand)]" />
              Tipografía corporativa (Google Fonts)
            </h2>
            <p className="section-subtitle">
              Seleccione entre 6 familias tipográficas optimizadas para tableros
              financieros y analítica retail.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {googleFontsCatalog.map((font) => {
              const selected = draft.fontFamily === font.id
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, fontFamily: font.id })}
                  style={{
                    fontFamily: font.stack,
                    letterSpacing: font.letterSpacing,
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]/15"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {font.label}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {font.category}
                      </p>
                    </div>
                    {selected && (
                      <span className="grid size-5 place-items-center rounded-full bg-[var(--brand)] text-white">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <div className="mt-3 border-t border-slate-200/60 pt-2">
                    <p className="text-xs font-bold text-slate-800">
                      $ 1.234.567 · +12,4%
                    </p>
                    <p className="text-[10px] text-slate-400">
                      01/03/2025 — Bogotá D.C.
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* 4. Subdominio y Dominio propio (Plan Avanzado) */}
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Globe className="size-4 text-[var(--brand)]" />
                Subdominio y dominio propio
              </h2>
              <p className="section-subtitle">
                Configure la dirección web con la que sus usuarios acceden a la
                plataforma.
              </p>
            </div>
            <span className="status-pill status-blue">Plan {client.plan}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Subdominio incluido */}
            <div className="rounded-xl border border-slate-200 p-4">
              <label className="block">
                <span className="field-label">
                  Subdominio en Retail Intelligence
                </span>
                <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[var(--brand)]">
                  <input
                    type="text"
                    value={draft.subdomain}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="h-11 min-w-0 flex-1 px-3 text-xs font-bold text-slate-800 outline-none"
                  />
                  <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 font-mono text-[11px] text-slate-500">
                    .retailintelligence.co
                  </span>
                </div>
              </label>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700">
                <ShieldCheck className="size-3.5" /> Certificado SSL comodín
                activo e incluido en todos los planes.
              </p>
            </div>

            {/* Dominio propio (Solo Avanzado) */}
            <div
              className={`rounded-xl border p-4 ${
                canUseCustomDomain
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50/80"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Dominio corporativo propio
                </span>
                {!canUseCustomDomain ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    <Lock className="size-3" /> Disponible en plan Avanzado
                  </span>
                ) : (
                  <span
                    className={`status-pill ${
                      draft.dnsVerified ? "status-green" : "status-amber"
                    }`}
                  >
                    {draft.dnsVerified ? "DNS verificado" : "Pendiente DNS"}
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={!canUseCustomDomain}
                value={draft.customDomain}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    customDomain: e.target.value.toLowerCase().trim(),
                    dnsVerified: false,
                  })
                }
                placeholder="analitica.suempresa.com.co"
                className="field h-11 font-mono text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                {canUseCustomDomain
                  ? "Oculta por completo el dominio de Retail Intelligence ante sus usuarios."
                  : "Actualice al plan Avanzado en la pestaña 'Plan y módulos' para habilitar CNAME propio."}
              </p>
            </div>
          </div>

          {/* Simulated DNS instructions */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Instrucciones de configuración DNS (CNAME y validación TXT)
                </p>
                <p className="text-[11px] text-slate-500">
                  Agregue estos registros en el proveedor DNS de su organización
                  (Route53, Cloudflare o GoDaddy).
                </p>
              </div>
              {canUseCustomDomain && (
                <button
                  type="button"
                  onClick={verifyDns}
                  disabled={dnsChecking}
                  className="secondary-button h-8 px-3 text-[11px]"
                >
                  <RefreshCw
                    className={`size-3.5 ${dnsChecking ? "animate-spin" : ""}`}
                  />
                  {dnsChecking ? "Verificando..." : "Verificar propagación DNS"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Host / Nombre</th>
                    <th className="px-3 py-2">Valor / Destino</th>
                    <th className="px-3 py-2">TTL</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="px-3 py-2.5 font-bold text-blue-700">
                      CNAME
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {(draft.customDomain || "analitica.empresa.co").split(
                        ".",
                      )[0] || "analitica"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      cname.retailintelligence.co
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">3600</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          copyText("cname", "cname.retailintelligence.co")
                        }
                        className="inline-flex items-center gap-1 rounded px-2 py-1 font-sans text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                      >
                        <Copy className="size-3" />
                        {copiedRecord === "cname" ? "Copiado" : "Copiar"}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 font-bold text-purple-700">
                      TXT
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">_ri-verify</td>
                    <td className="px-3 py-2.5 text-slate-600">
                      ri-tenant-verification={client.id}_co_9f82c1d4
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">3600</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "txt",
                            `ri-tenant-verification=${client.id}_co_9f82c1d4`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded px-2 py-1 font-sans text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                      >
                        <Copy className="size-3" />
                        {copiedRecord === "txt" ? "Copiado" : "Copiar"}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={resetDefaults}
              className="secondary-button"
            >
              <RotateCcw className="size-4" /> Restaurar valores de fábrica
            </button>
            <button
              type="button"
              onClick={() => onSaveAppearance(draft)}
              className="primary-button"
            >
              <Save className="size-4" /> Guardar y aplicar tema en toda la app
            </button>
          </div>
        </section>
      </div>

      {/* Columna derecha: Vista previa en vivo */}
      <LiveThemePreview client={client} draft={draft} />
    </div>
  )
}
