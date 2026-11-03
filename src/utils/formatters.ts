export function formatNumberCO(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded < 0 ? "-" : ""
  const abs = Math.abs(rounded).toString()
  const withDots = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${sign}${withDots}`
}

export function formatCOP(value: number): string {
  const rounded = Math.round(value)
  if (rounded < 0) {
    return `-$ ${formatNumberCO(Math.abs(rounded))}`
  }
  return `$ ${formatNumberCO(rounded)}`
}

export function formatDecimalCO(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",")
}

export function formatVariationCO(
  variationPercent: number,
  suffix = "%",
): string {
  const sign = variationPercent > 0 ? "+" : ""
  return `${sign}${variationPercent.toFixed(1).replace(".", ",")}${suffix}`
}

export function calcVariationPercent(
  current: number,
  comparison: number,
): number {
  if (!comparison) return 0
  return Number((((current - comparison) / comparison) * 100).toFixed(1))
}
