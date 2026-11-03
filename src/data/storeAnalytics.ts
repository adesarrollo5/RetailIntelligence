import type { CompareMode, PeriodId } from "../types"
import { calcVariationPercent } from "../utils/formatters"
import {
  commercialHours,
  getPeriodMeta,
  getWeekDaysOrder,
  type HeatmapCell,
} from "./analyticsData"
import { monthlySales } from "./demo"
import {
  daysBetween,
  hashString,
  REFERENCE_DATE,
  seededRandom,
  type StoreRecord,
} from "./storesData"

/* ------------------------------ Métricas ------------------------------ */

export type StoreMetrics = {
  hasData: boolean
  netSales: number
  comparisonSales: number
  variation: number
  transactions: number
  compTransactions: number
  transactionsVar: number
  avgTicket: number
  compAvgTicket: number
  avgTicketVar: number
  units: number
  compUnits: number
  unitsVar: number
  salesPerSqm: number
  compSalesPerSqm: number
  salesPerSqmVar: number
  visitors: number
  compVisitors: number
  visitorsVar: number
  conversion: number
  compConversion: number
  conversionDeltaPp: number
}

export function monthsInPeriod(periodId: PeriodId): number {
  if (periodId === "q1_2025") return 3
  if (periodId === "ult_13m") return 13
  return 1
}

export function getStoreMetrics(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
): StoreMetrics {
  const mult = getPeriodMeta(periodId).multiplier
  const growth =
    compareMode === "prev_period"
      ? store.growthPrevPeriod
      : store.growthPrevYear
  const netSales = Math.round(store.baseSales * mult)
  const comparisonSales = Math.round(netSales / (1 + growth))
  const hasData = netSales > 0

  const avgTicket = store.avgTicket
  const compAvgTicket = Math.round(avgTicket / (1 + growth * 0.4))
  const transactions = hasData ? Math.round(netSales / avgTicket) : 0
  const compTransactions = hasData
    ? Math.round(comparisonSales / compAvgTicket)
    : 0
  const units = Math.round(transactions * store.unitsPerTicket)
  const compUnits = Math.round(compTransactions * store.unitsPerTicket * 0.985)

  const conversion = store.hasCounter ? store.baseConversion : 0
  const compConversion = store.hasCounter
    ? Math.max(2, Number((conversion - growth * 4).toFixed(1)))
    : 0
  const visitors =
    store.hasCounter && hasData
      ? Math.round(transactions / (conversion / 100))
      : 0
  const compVisitors =
    store.hasCounter && hasData
      ? Math.round(compTransactions / (compConversion / 100))
      : 0

  const monthsFactor = Math.max(1, monthsInPeriod(periodId))
  const salesPerSqm = hasData
    ? Math.round(netSales / monthsFactor / store.sqm)
    : 0
  const compSalesPerSqm = hasData
    ? Math.round(comparisonSales / monthsFactor / store.sqm)
    : 0

  return {
    hasData,
    netSales,
    comparisonSales,
    variation: calcVariationPercent(netSales, comparisonSales),
    transactions,
    compTransactions,
    transactionsVar: calcVariationPercent(transactions, compTransactions),
    avgTicket: hasData ? avgTicket : 0,
    compAvgTicket: hasData ? compAvgTicket : 0,
    avgTicketVar: calcVariationPercent(avgTicket, compAvgTicket),
    units,
    compUnits,
    unitsVar: calcVariationPercent(units, compUnits),
    salesPerSqm,
    compSalesPerSqm,
    salesPerSqmVar: calcVariationPercent(salesPerSqm, compSalesPerSqm),
    visitors,
    compVisitors,
    visitorsVar: calcVariationPercent(visitors, compVisitors),
    conversion,
    compConversion,
    conversionDeltaPp: Number((conversion - compConversion).toFixed(1)),
  }
}

/* -------------------------- Series de tiempo -------------------------- */

export type SeriesPoint = {
  label: string
  actual: number
  comparison: number
}

const monthNames = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

function normalizeTo(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  return weights.map((w) => Math.round((w / sum) * total))
}

function dailyWeights(
  year: number,
  monthIndex: number,
  days: number,
  rand: () => number,
): number[] {
  const out: number[] = []
  for (let d = 1; d <= days; d++) {
    const dow = new Date(Date.UTC(year, monthIndex, d)).getUTCDay()
    let w = [1.28, 0.85, 0.82, 0.88, 0.95, 1.25, 1.5][dow]
    if (d === 15 || d === 30 || d === days) w *= 1.28
    if (d <= 3) w *= 1.1
    if (monthIndex === 11) {
      w *= 0.8 + (d / 24) * 1.4
      if (d === 25) w *= 0.3
      if (d > 25) w *= 0.8
    }
    out.push(w * (0.92 + rand() * 0.16))
  }
  return out
}

export function buildSalesSeries(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
): { points: SeriesPoint[]; granularity: "día" | "semana" | "mes" } {
  const m = getStoreMetrics(store, periodId, compareMode)
  const rand = seededRandom(hashString(`${store.id}-series-${periodId}`))
  const randC = seededRandom(hashString(`${store.id}-seriesc-${periodId}`))

  if (
    periodId === "mar_2025" ||
    periodId === "feb_2025" ||
    periodId === "dic_2024"
  ) {
    const [year, monthIndex, days] =
      periodId === "mar_2025"
        ? [2025, 2, 31]
        : periodId === "feb_2025"
          ? [2025, 1, 28]
          : [2024, 11, 31]
    const a = normalizeTo(
      dailyWeights(year, monthIndex, days, rand),
      m.netSales,
    )
    const c = normalizeTo(
      dailyWeights(year, monthIndex, days, randC),
      m.comparisonSales,
    )
    return {
      granularity: "día",
      points: a.map((v, i) => ({
        label: String(i + 1),
        actual: v,
        comparison: c[i],
      })),
    }
  }

  if (periodId === "q1_2025") {
    const w = Array.from({ length: 13 }, (_, i) => {
      const base = i < 4 ? 0.9 : i < 9 ? 0.98 : 1.1
      return base * (0.93 + rand() * 0.14)
    })
    const wc = Array.from({ length: 13 }, () => 0.93 + randC() * 0.14)
    const a = normalizeTo(w, m.netSales)
    const c = normalizeTo(wc, m.comparisonSales)
    return {
      granularity: "semana",
      points: a.map((v, i) => ({
        label: `S${i + 1}`,
        actual: v,
        comparison: c[i],
      })),
    }
  }

  const growth =
    compareMode === "prev_period"
      ? store.growthPrevPeriod
      : store.growthPrevYear
  const a = monthlySales.map((row) => {
    const noise = 0.95 + rand() * 0.1
    return Math.round(store.baseSales * (row.sales / 3820) * noise)
  })
  const scaleA = m.netSales / (a.reduce((x, y) => x + y, 0) || 1)
  const aScaled = a.map((v) => Math.round(v * scaleA))
  return {
    granularity: "mes",
    points: aScaled.map((v, i) => {
      const monthIdx = (2 + i) % 12
      const year = 24 + Math.floor((2 + i) / 12)
      const prev = monthlySales[i].previous / monthlySales[i].sales
      return {
        label: `${monthNames[monthIdx]} ${year}`,
        actual: v,
        comparison: Math.round((v * prev) / (1 + growth * 0.2)),
      }
    }),
  }
}

/** Tendencia de 13 meses para la pestaña Resumen. */
export function buildThirteenMonthTrend(store: StoreRecord): SeriesPoint[] {
  const rand = seededRandom(hashString(`${store.id}-13m`))
  return monthlySales.map((row, i) => {
    const monthIdx = (2 + i) % 12
    const year = 24 + Math.floor((2 + i) / 12)
    const noise = 0.95 + rand() * 0.1
    const young = store.comparable ? 1 : i < 6 ? 0.55 : 1
    const actual = Math.round(
      store.baseSales * (row.sales / 3820) * noise * young,
    )
    return {
      label: `${monthNames[monthIdx]} ${year}`,
      actual,
      comparison: Math.round(
        actual * (row.previous / row.sales) * (store.comparable ? 1 : 0.9),
      ),
    }
  })
}

/* ------------------------- Desgloses de ventas ------------------------- */

export const categoryLines: Record<string, Array<[string, number]>> = {
  Moda: [
    ["Camisas y blusas", 27],
    ["Pantalones y jeans", 24],
    ["Vestidos y faldas", 18],
    ["Chaquetas y abrigos", 17],
    ["Accesorios", 14],
  ],
  "Calzado y marroquinería": [
    ["Zapato de vestir", 28],
    ["Botas y botines", 24],
    ["Bolsos y morrales", 22],
    ["Casual y sandalias", 18],
    ["Cinturones y billeteras", 8],
  ],
  "Alimentos y bebidas": [
    ["Platos fuertes", 41],
    ["Bebidas", 22],
    ["Postres y panadería", 17],
    ["Combos", 14],
    ["Domicilios", 6],
  ],
  Tecnología: [
    ["Celulares", 46],
    ["Computación", 20],
    ["Audio y wearables", 16],
    ["Accesorios", 12],
    ["Servicio técnico", 6],
  ],
  "Hogar y decoración": [
    ["Cama y baño", 31],
    ["Decoración", 26],
    ["Cocina y mesa", 24],
    ["Iluminación", 11],
    ["Organización", 8],
  ],
  Deportes: [
    ["Running", 28],
    ["Fitness", 22],
    ["Ciclismo", 17],
    ["Outdoor", 20],
    ["Accesorios", 13],
  ],
  "Salud y belleza": [
    ["Cuidado de la piel", 31],
    ["Maquillaje", 24],
    ["Fragancias", 21],
    ["Cuidado personal", 16],
    ["Bienestar", 8],
  ],
  Servicios: [
    ["Servicio principal", 52],
    ["Servicios adicionales", 24],
    ["Suscripciones", 14],
    ["Otros", 10],
  ],
  Entretenimiento: [
    ["Boletería", 44],
    ["Alimentos y confitería", 28],
    ["Juegos", 18],
    ["Eventos", 10],
  ],
  "Calzado casual": [
    ["Mocasines y casuales", 34],
    ["Sandalias", 18],
    ["Botines", 20],
    ["Tenis urbanos", 20],
    ["Accesorios de cuero", 8],
  ],
  "Calzado deportivo": [
    ["Tenis running", 36],
    ["Tenis urbanos", 28],
    ["Entrenamiento", 18],
    ["Sandalias deportivas", 10],
    ["Medias y accesorios", 8],
  ],
  "Calzado formal": [
    ["Zapato de vestir", 42],
    ["Oxford y derby", 22],
    ["Botas de cuero", 16],
    ["Mocasines", 12],
    ["Cinturones", 8],
  ],
  Multimarca: [
    ["Calzado casual", 30],
    ["Calzado deportivo", 26],
    ["Calzado formal", 22],
    ["Botas y botines", 12],
    ["Accesorios", 10],
  ],
  "Accesorios y marroquinería": [
    ["Bolsos", 30],
    ["Cinturones", 22],
    ["Billeteras", 20],
    ["Maletines", 16],
    ["Cuidado del calzado", 12],
  ],
}

export type CategoryRow = {
  name: string
  actual: number
  comparison: number
  variation: number
  share: number
}

export function buildCategoryBreakdown(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
): CategoryRow[] {
  const m = getStoreMetrics(store, periodId, compareMode)
  const lines = categoryLines[store.category] ?? [["General", 100]]
  const rand = seededRandom(hashString(`${store.id}-cat`))
  const raw = lines.map(([, s]) => s * (0.9 + rand() * 0.2))
  const a = normalizeTo(raw, m.netSales)
  const total = a.reduce((x, y) => x + y, 0) || 1
  const compRaw = lines.map(([, s]) => s * (0.88 + rand() * 0.24))
  const c = normalizeTo(compRaw, m.comparisonSales)
  return lines.map(([name], i) => ({
    name,
    actual: a[i],
    comparison: c[i],
    variation: calcVariationPercent(a[i], c[i]),
    share: Number(((a[i] / total) * 100).toFixed(1)),
  }))
}

export type PaymentRow = { name: string; actual: number; share: number }

export function buildPaymentMix(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
): PaymentRow[] {
  const m = getStoreMetrics(store, periodId, compareMode)
  const rand = seededRandom(hashString(`${store.id}-pay`))
  const base: Array<[string, number]> =
    store.category === "Alimentos y bebidas"
      ? [
          ["Tarjeta crédito", 28],
          ["Tarjeta débito", 27],
          ["Efectivo", 26],
          ["Billeteras (Nequi, Daviplata)", 14],
          ["Bonos y otros", 5],
        ]
      : store.category === "Tecnología"
        ? [
            ["Tarjeta crédito", 52],
            ["Tarjeta débito", 20],
            ["Efectivo", 6],
            ["Billeteras (Nequi, Daviplata)", 10],
            ["Bonos y otros", 12],
          ]
        : [
            ["Tarjeta crédito", 35],
            ["Tarjeta débito", 27],
            ["Efectivo", 17],
            ["Billeteras (Nequi, Daviplata)", 14],
            ["Bonos y otros", 7],
          ]
  const a = normalizeTo(
    base.map(([, s]) => s * (0.92 + rand() * 0.16)),
    m.netSales,
  )
  const total = a.reduce((x, y) => x + y, 0) || 1
  return base.map(([name], i) => ({
    name,
    actual: a[i],
    share: Number(((a[i] / total) * 100).toFixed(1)),
  }))
}

const salesHourWeights: Record<string, number> = {
  "09:00": 0.35,
  "10:00": 0.55,
  "11:00": 0.75,
  "12:00": 0.95,
  "13:00": 1.05,
  "14:00": 0.9,
  "15:00": 1.0,
  "16:00": 1.2,
  "17:00": 1.45,
  "18:00": 1.5,
  "19:00": 1.25,
  "20:00": 0.8,
}
const dayWeights: Record<string, number> = {
  Lun: 0.82,
  Mar: 0.84,
  Mié: 0.88,
  Jue: 0.95,
  Vie: 1.25,
  Sáb: 1.55,
  Dom: 1.3,
}

export function buildHourDayHeatmap(
  store: StoreRecord,
  total: number,
  weekStartsOn: "Lunes" | "Domingo",
  kind: "sales" | "visitors",
  compareMode: CompareMode,
): HeatmapCell[] {
  const days = getWeekDaysOrder(weekStartsOn)
  const rand = seededRandom(hashString(`${store.id}-hm-${kind}`))
  const open = store.schedule.open
  const close = store.schedule.close
  const raw: Array<{ day: string; hour: string; w: number }> = []
  days.forEach((day) => {
    commercialHours.forEach((hour) => {
      const isOpen = hour >= open && hour < close
      const closedDay =
        (store.schedule.days === "Lun–Sáb" && day === "Dom") ||
        (store.schedule.days === "Lun–Vie" && (day === "Dom" || day === "Sáb"))
      const w =
        isOpen && !closedDay
          ? (salesHourWeights[hour] ?? 1) *
            (dayWeights[day] ?? 1) *
            (0.9 + rand() * 0.2)
          : 0
      raw.push({ day, hour, w })
    })
  })
  const sum = raw.reduce((a, b) => a + b.w, 0) || 1
  return raw.map((r) => {
    const value = Math.round((r.w / sum) * total)
    const comp = Math.round(value * (compareMode === "prev_year" ? 0.88 : 0.91))
    return {
      day: r.day,
      hour: r.hour,
      value,
      comparison: comp,
      variation: calcVariationPercent(value, comp),
    }
  })
}

/* ------------------------------ Tráfico ------------------------------ */

export type StoreTraffic = {
  visitors: number
  compVisitors: number
  conversion: number
  salesPerVisitor: number
  captureRate: number
  compCaptureRate: number
  mallVisitors: number
  dwellMinutes: number
  peakHour: string
  byHour: Array<{ hour: string; visitors: number }>
  byDay: Array<{ day: string; visitors: number }>
}

export function buildStoreTraffic(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
  weekStartsOn: "Lunes" | "Domingo",
  mallShare: number,
): StoreTraffic {
  const m = getStoreMetrics(store, periodId, compareMode)
  const mult = getPeriodMeta(periodId).multiplier
  const mallVisitors = Math.round(684320 * mallShare * mult)
  const cells = buildHourDayHeatmap(
    store,
    m.visitors,
    weekStartsOn,
    "visitors",
    compareMode,
  )
  const hourMap = new Map<string, number>()
  const dayMap = new Map<string, number>()
  cells.forEach((c) => {
    hourMap.set(c.hour, (hourMap.get(c.hour) ?? 0) + c.value)
    dayMap.set(c.day, (dayMap.get(c.day) ?? 0) + c.value)
  })
  const byHour = commercialHours.map((h) => ({
    hour: h,
    visitors: hourMap.get(h) ?? 0,
  }))
  const peak = byHour.reduce(
    (b, c) => (c.visitors > b.visitors ? c : b),
    byHour[0],
  )
  const rand = seededRandom(hashString(`${store.id}-dwell`))
  const compMall = Math.round(
    mallVisitors / (compareMode === "prev_year" ? 1.06 : 1.03),
  )
  return {
    visitors: m.visitors,
    compVisitors: m.compVisitors,
    conversion: m.conversion,
    salesPerVisitor: m.visitors ? Math.round(m.netSales / m.visitors) : 0,
    captureRate: mallVisitors
      ? Number(((m.visitors / mallVisitors) * 100).toFixed(2))
      : 0,
    compCaptureRate: compMall
      ? Number(((m.compVisitors / compMall) * 100).toFixed(2))
      : 0,
    mallVisitors,
    dwellMinutes: Math.round(7 + rand() * 22),
    peakHour: peak.hour,
    byHour,
    byDay: getWeekDaysOrder(weekStartsOn).map((d) => ({
      day: d,
      visitors: dayMap.get(d) ?? 0,
    })),
  }
}

/* ----------------------------- Inventario ----------------------------- */

export type InventoryLineStatus = "Quiebre" | "Bajo" | "Óptimo" | "Sobrestock"

export type InventoryLine = {
  name: string
  skus: number
  units: number
  value: number
  coverageDays: number
  status: InventoryLineStatus
}

export type StoreInventory = {
  skus: number
  units: number
  valueAtCost: number
  coverageDays: number
  rotation: number
  stockouts: number
  overstock: number
  lines: InventoryLine[]
  alerts: Array<{
    sku: string
    name: string
    units: number
    daysLeft: number
    kind: "Quiebre" | "Bajo"
  }>
}

export function buildStoreInventory(store: StoreRecord): StoreInventory {
  const m = getStoreMetrics(store, "mar_2025", "prev_period")
  const rand = seededRandom(hashString(`${store.id}-inv`))
  const lines = categoryLines[store.category] ?? [["General", 100]]
  const skuDensity =
    store.category === "Alimentos y bebidas"
      ? 0.5
      : store.category === "Servicios"
        ? 0.2
        : store.category === "Moda"
          ? 3.1
          : 2.2
  const skus = Math.max(18, Math.round(store.sqm * skuDensity))
  const unitsPerDay = Math.max(1, m.units / 31)
  const costPerUnit =
    (store.avgTicket / Math.max(1, store.unitsPerTicket)) * 0.46
  const targetCoverage = 38 + rand() * 30
  const totalUnits = Math.round(unitsPerDay * targetCoverage)

  const invLines: InventoryLine[] = lines.map(([name, share], idx) => {
    const lineUnitsSold = (m.units * share) / 100 / 31
    const factor = 0.35 + rand() * 1.75
    const units = Math.round(((totalUnits * share) / 100) * factor)
    const coverage = lineUnitsSold > 0 ? units / lineUnitsSold : 0
    const status: InventoryLineStatus =
      units === 0 || coverage < 7
        ? "Quiebre"
        : coverage < 20
          ? "Bajo"
          : coverage > 75
            ? "Sobrestock"
            : "Óptimo"
    return {
      name,
      skus: Math.max(1, Math.round((skus * share) / 100)),
      units,
      value: Math.round(units * costPerUnit),
      coverageDays: Math.round(coverage),
      status: idx >= 0 ? status : status,
    }
  })
  const units = invLines.reduce((a, l) => a + l.units, 0)
  const coverage = unitsPerDay > 0 ? units / unitsPerDay : 0
  const alertCount = Math.max(2, Math.min(6, Math.round(skus / 40)))
  const alerts = Array.from({ length: alertCount }, (_, i) => {
    const line = lines[Math.floor(rand() * lines.length)][0]
    const left = Math.floor(rand() * 5)
    return {
      sku: `${store.code.replace(/[^A-Z0-9]/g, "").slice(0, 4)}-${String(
        1000 + Math.floor(rand() * 8999),
      )}`,
      name: `${line} · referencia ${i + 1}`,
      units: left,
      daysLeft:
        left === 0
          ? 0
          : Math.max(1, Math.round(left / (unitsPerDay / skus + 0.01))),
      kind: (left === 0 ? "Quiebre" : "Bajo") as "Quiebre" | "Bajo",
    }
  })
  return {
    skus,
    units,
    valueAtCost: invLines.reduce((a, l) => a + l.value, 0),
    coverageDays: Math.round(coverage),
    rotation: coverage > 0 ? Number((365 / coverage).toFixed(1)) : 0,
    stockouts: Math.max(
      invLines.filter((l) => l.status === "Quiebre").length,
      Math.round(skus * 0.03),
    ),
    overstock: invLines.filter((l) => l.status === "Sobrestock").length,
    lines: invLines,
    alerts,
  }
}

/* ------------------------------ Contrato ------------------------------ */

export const OCCUPANCY_GREEN_MAX = 12
export const OCCUPANCY_AMBER_MAX = 18

export type OccupancyLevel = "ok" | "warn" | "high" | "nodata"

export function occupancyLevel(pct: number, hasData: boolean): OccupancyLevel {
  if (!hasData) return "nodata"
  if (pct <= OCCUPANCY_GREEN_MAX) return "ok"
  if (pct <= OCCUPANCY_AMBER_MAX) return "warn"
  return "high"
}

export type ContractMetrics = {
  months: number
  rentPeriod: number
  compRentPeriod: number
  netSales: number
  comparisonSales: number
  occupancyPct: number
  compOccupancyPct: number
  level: OccupancyLevel
  rentPerSqm: number
  daysToExpiry: number
  termStatus: "Vigente" | "Por vencer" | "Vencido" | "Por iniciar"
  elapsedPct: number
  totalDays: number
}

export function getContractMetrics(
  store: StoreRecord,
  periodId: PeriodId,
  compareMode: CompareMode,
): ContractMetrics | null {
  if (!store.contract) return null
  const m = getStoreMetrics(store, periodId, compareMode)
  const months = monthsInPeriod(periodId)
  const rentPeriod = store.contract.monthlyRent * months
  const compRentPeriod = Math.round(rentPeriod / 1.045)
  const occupancyPct = m.netSales > 0 ? (rentPeriod / m.netSales) * 100 : 0
  const compOccupancyPct =
    m.comparisonSales > 0 ? (compRentPeriod / m.comparisonSales) * 100 : 0
  const daysToExpiry = daysBetween(REFERENCE_DATE, store.contract.end)
  const totalDays = Math.max(
    1,
    daysBetween(store.contract.start, store.contract.end),
  )
  const elapsed = daysBetween(store.contract.start, REFERENCE_DATE)
  return {
    months,
    rentPeriod,
    compRentPeriod,
    netSales: m.netSales,
    comparisonSales: m.comparisonSales,
    occupancyPct: Number(occupancyPct.toFixed(1)),
    compOccupancyPct: Number(compOccupancyPct.toFixed(1)),
    level: occupancyLevel(occupancyPct, m.hasData),
    rentPerSqm: Math.round(store.contract.monthlyRent / store.sqm),
    daysToExpiry,
    termStatus:
      elapsed < 0
        ? "Por iniciar"
        : daysToExpiry < 0
          ? "Vencido"
          : daysToExpiry <= 180
            ? "Por vencer"
            : "Vigente",
    elapsedPct: Math.max(0, Math.min(100, (elapsed / totalDays) * 100)),
    totalDays,
  }
}
