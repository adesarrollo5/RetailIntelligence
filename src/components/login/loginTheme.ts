import type { Client, GoogleFontId } from "../../types"
import { darkenHex, getFontStack, softTintHex } from "../../utils/contrast"

export type LoginTheme = {
  primary: string
  primaryDark: string
  primarySoft: string
  accent: string
  /** Color de la línea secundaria en el banner con contraste AA sobre el fondo primario. */
  bannerAccent: string
  fontId: GoogleFontId
  fontStack: string
}

export function getLoginTheme(client: Client): LoginTheme {
  const primary = client.appearance.primaryColor || client.color
  const primaryDark = client.colorDark || darkenHex(primary, 0.24)
  const primarySoft = client.accent || softTintHex(primary, 0.9)
  const accent = client.appearance.accentColor || client.accentColor
  const bannerAccent = softTintHex(accent, 0.22)
  return {
    primary,
    primaryDark,
    primarySoft,
    accent,
    bannerAccent,
    fontId: client.appearance.fontFamily,
    fontStack: getFontStack(client.appearance.fontFamily),
  }
}
