import type { FaviconVariant, GoogleFontId } from "../types"

type RgbTuple = {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RgbTuple | null {
  const clean = hex.replace("#", "").trim()
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function channelLuminance(value: number): number {
  const sRGB = value / 255
  return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const r = channelLuminance(rgb.r)
  const g = channelLuminance(rgb.g)
  const b = channelLuminance(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function getContrastRatio(hexA: string, hexB = "#ffffff"): number {
  const lumA = getRelativeLuminance(hexA)
  const lumB = getRelativeLuminance(hexB)
  const brightest = Math.max(lumA, lumB)
  const darkest = Math.min(lumA, lumB)
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2))
}

export function darkenHex(hex: string, factor = 0.22): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#183caa"
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * (1 - factor))))
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

export function softTintHex(hex: string, weight = 0.9): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#e8efff"
  const mix = (c: number) =>
    Math.round(c + (255 - c) * weight)
      .toString(16)
      .padStart(2, "0")
  return `#${mix(rgb.r)}${mix(rgb.g)}${mix(rgb.b)}`
}

export function makeAccessiblePrimary(hex: string): string {
  let candidate = hex
  for (let i = 0; i < 18; i++) {
    if (getContrastRatio(candidate, "#ffffff") >= 4.55) {
      return candidate
    }
    candidate = darkenHex(candidate, 0.1)
  }
  return "#1d4ed8"
}

export const googleFontsCatalog: Array<{
  id: GoogleFontId
  label: string
  category: string
  stack: string
  letterSpacing: string
}> = [
  {
    id: "Inter",
    label: "Inter",
    category: "Sans neutra de interfaz",
    stack:
      "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: "-0.011em",
  },
  {
    id: "DM Sans",
    label: "DM Sans",
    category: "Geométrica amable",
    stack: "'DM Sans', 'Avenir Next', 'Segoe UI', ui-sans-serif, sans-serif",
    letterSpacing: "-0.015em",
  },
  {
    id: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans",
    category: "Corporativa moderna",
    stack:
      "'Plus Jakarta Sans', 'Trebuchet MS', 'Segoe UI', ui-sans-serif, sans-serif",
    letterSpacing: "-0.02em",
  },
  {
    id: "Manrope",
    label: "Manrope",
    category: "Alta precisión numérica",
    stack: "'Manrope', 'Helvetica Neue', Arial, ui-sans-serif, sans-serif",
    letterSpacing: "-0.018em",
  },
  {
    id: "Outfit",
    label: "Outfit",
    category: "Marca blanca contemporánea",
    stack: "'Outfit', 'Gill Sans', 'Segoe UI', ui-sans-serif, sans-serif",
    letterSpacing: "-0.008em",
  },
  {
    id: "IBM Plex Sans",
    label: "IBM Plex Sans",
    category: "Analítica e ingeniería",
    stack:
      "'IBM Plex Sans', 'Franklin Gothic Medium', 'Segoe UI', ui-sans-serif, sans-serif",
    letterSpacing: "-0.005em",
  },
]

export function getFontStack(fontId: GoogleFontId): string {
  return (
    googleFontsCatalog.find((f) => f.id === fontId)?.stack ??
    googleFontsCatalog[0].stack
  )
}

export function applyFaviconToDocument(
  initials: string,
  primaryColor: string,
  variant: FaviconVariant,
  customUrl?: string,
) {
  if (typeof document === "undefined") return
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  if (variant === "custom" && customUrl) {
    link.href = customUrl
    return
  }
  const rx = variant === "circle" ? "16" : variant === "shield" ? "5" : "8"
  const fill = variant === "outline" ? "#ffffff" : primaryColor
  const textFill = variant === "outline" ? primaryColor : "#ffffff"
  const stroke =
    variant === "outline" ? `stroke="${primaryColor}" stroke-width="3"` : ""
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="${rx}" fill="${fill}" ${stroke}/><text x="16" y="20" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="${textFill}">${initials.slice(0, 2)}</text></svg>`
  link.href = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
