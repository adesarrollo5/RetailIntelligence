import type { Client, CompareMode, PeriodId } from "../types"
import { distanceKm, getMunicipality } from "./colombiaGeo"
import { categoryLines, getStoreMetrics } from "./storeAnalytics"
import {
  hashString,
  REFERENCE_DATE,
  seededRandom,
  type StoreRecord,
} from "./storesData"

/* ------------------------------ Constantes ------------------------------ */

/** Categorías que no manejan mercancía física. */
export const NO_GOODS_CATEGORIES = ["Servicios", "Entretenimiento"]

/** Cobertura (días de venta) bajo la cual un SKU se considera en nivel bajo. */
export const LOW_COVERAGE_DAYS = 7
/** Cobertura sobre la cual un SKU se considera sobrestock. */
export const OVERSTOCK_COVERAGE_DAYS = 90
/** Días sin ventas a partir de los cuales el stock es inmovilizado. */
export const IMMOBILIZED_DAYS = 60
/** Cobertura objetivo del destino al recibir un traslado. */
export const TARGET_COVERAGE_DAYS = 30
/** Cobertura que el origen debe conservar tras ceder unidades. */
export const KEEP_COVERAGE_DAYS = 45

export const PERIOD_DAYS: Record<PeriodId, number> = {
  mar_2025: 31,
  feb_2025: 28,
  dic_2024: 31,
  q1_2025: 90,
  ult_13m: 395,
}

/* -------------------------------- Tipos -------------------------------- */

export type OriginCategory = {
  code: string
  name: string
  /** Categoría estándar sugerida; null si el sistema no puede inferirla. */
  suggestion: string | null
  system: string
}

export type Sku = {
  id: string
  code: string
  description: string
  owner: string
  line: string
  /** Categoría interna del grupo de catálogo (para la sugerencia). */
  groupCategory: string
  originCode: string
  price: number
  cost: number
  source: string
  /** Posición de popularidad dentro del grupo (0 = el que más vende). */
  rank: number
}

export type InventoryStatus =
  | "Quiebre"
  | "Bajo"
  | "Óptimo"
  | "Sobrestock"
  | "Inmovilizado"

export type UniverseRow = {
  id: string
  storeId: string
  skuId: string
  share: number
  dead: boolean
  /** null = el local no integra inventario. */
  stock: number | null
  compStock: number | null
  lastSaleDays: number
  daysOut: number
  refRate: number
  status: InventoryStatus | null
}

export type NoInventoryReason =
  | "Sin integración de inventario"
  | "Categoría sin inventario físico"
  | "Local sin operación"

export type Universe = {
  skus: Sku[]
  skuById: Map<string, Sku>
  rows: UniverseRow[]
  rowsByStore: Map<string, UniverseRow[]>
  origins: OriginCategory[]
  originByCode: Map<string, OriginCategory>
  storeById: Map<string, StoreRecord>
}

export type Homologation = Record<string, string | null>

/* ------------------------------ Utilidades ------------------------------ */

const plain = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const abbr = (s: string, n: number) =>
  plain(s).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, n)

export function ownerOf(store: StoreRecord, client: Client): string {
  return client.type === "operator"
    ? store.name.split(" · ")[0].trim()
    : client.shortName
}

export const sellsGoods = (s: StoreRecord) =>
  !NO_GOODS_CATEGORIES.includes(s.category)
export const hasCatalogData = (s: StoreRecord) =>
  sellsGoods(s) && s.sources.length > 0 && s.baseSales > 0
export const hasInventoryData = (s: StoreRecord) =>
  hasCatalogData(s) && s.sources.some((x) => x.kind === "Inventario")

export function noInventoryReason(s: StoreRecord): NoInventoryReason {
  if (!sellsGoods(s)) return "Categoría sin inventario físico"
  if (!s.sources.some((x) => x.kind === "Inventario")) {
    return "Sin integración de inventario"
  }
  return "Local sin operación"
}

export function isoMinusDays(days: number): string {
  const d = new Date(`${REFERENCE_DATE}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

/* ------------------------------- Catálogo ------------------------------- */

const unitPriceBase: Record<string, number> = {
  Moda: 98000,
  "Calzado y marroquinería": 185000,
  "Alimentos y bebidas": 24000,
  Tecnología: 560000,
  "Hogar y decoración": 120000,
  Deportes: 175000,
  "Salud y belleza": 52000,
  "Calzado casual": 169000,
  "Calzado deportivo": 214000,
  "Calzado formal": 239000,
  Multimarca: 189000,
  "Accesorios y marroquinería": 79000,
}
const costRatio: Record<string, number> = {
  Moda: 0.42,
  "Calzado y marroquinería": 0.45,
  "Alimentos y bebidas": 0.33,
  Tecnología: 0.74,
  "Hogar y decoración": 0.5,
  Deportes: 0.56,
  "Salud y belleza": 0.44,
}
const descriptors = [
  "Clásico",
  "Básico",
  "Premium",
  "Urbano",
  "Confort",
  "Esencial",
  "Edición limitada",
  "Sport",
  "Slim",
  "Temporada",
]
const colors = [
  "Negro",
  "Azul",
  "Blanco",
  "Café",
  "Gris",
  "Beige",
  "Rojo",
  "Verde",
  "Miel",
]

const NOISE_ORIGINS: OriginCategory[] = [
  { code: "SIN-CLASIF", name: "Sin clasificar (carga inicial)", suggestion: null, system: "" },
  { code: "PROMO-TEMP", name: "Promoción de temporada", suggestion: null, system: "" },
  { code: "OUTLET-LIQ", name: "Liquidación de saldos", suggestion: null, system: "" },
  { code: "DOTAC-INT", name: "Dotación interna", suggestion: null, system: "" },
]

type Group = { owner: string; category: string; skus: Sku[] }

function buildGroup(
  client: Client,
  owner: string,
  category: string,
  source: string,
  used: Set<string>,
): Group {
  const rand = seededRandom(hashString(`${client.id}|${owner}|${category}|cat`))
  const lines = categoryLines[category] ?? [["General", 100] as [string, number]]
  const perLine = client.type === "operator" ? 4 : 5
  const base = unitPriceBase[category] ?? 90000
  const ratio = costRatio[category] ?? 0.46
  const ownerCode = abbr(owner, 3).padEnd(3, "X")
  const catCode = abbr(category, 2).padEnd(2, "X")
  const skus: Sku[] = []
  lines.forEach(([lineName], li) => {
    const originCode = `${catCode}-${abbr(lineName, 5)}`
    for (let j = 0; j < perLine; j++) {
      let code = `${ownerCode}-${catCode}${li + 1}${j + 1}${String(10 + Math.floor(rand() * 89))}`
      if (used.has(code)) code += abbr(owner, 5).slice(3)
      used.add(code)
      const price = Math.round((base * (0.55 + rand() * 1.25)) / 1000) * 1000 - 100
      const noisy = hashString(`${code}-noise`) % 100 < 3
      skus.push({
        id: `${client.id}:${code}`,
        code,
        description: `${lineName} ${descriptors[Math.floor(rand() * descriptors.length)]} · ${colors[Math.floor(rand() * colors.length)]}`,
        owner,
        line: lineName,
        groupCategory: category,
        originCode: noisy
          ? NOISE_ORIGINS[hashString(code) % NOISE_ORIGINS.length].code
          : originCode,
        price: Math.max(2900, price),
        cost: 0,
        source,
        rank: 0,
      })
      const sku = skus[skus.length - 1]
      sku.cost = Math.round(sku.price * (ratio * (0.88 + rand() * 0.24)))
    }
  })
  // Popularidad: orden estable por línea (más peso a las líneas grandes).
  const lineShare = new Map(lines.map(([n, s]) => [n, s]))
  const scored = skus
    .map((s) => ({
      s,
      score: (lineShare.get(s.line) ?? 10) * (0.4 + seededRandom(hashString(s.code))()),
    }))
    .sort((a, b) => b.score - a.score)
  scored.forEach((x, i) => (x.s.rank = i))
  return { owner, category, skus }
}

/* ------------------------------- Universo ------------------------------- */

export function buildUniverse(client: Client, stores: StoreRecord[]): Universe {
  const used = new Set<string>()
  const groups = new Map<string, Group>()
  const skus: Sku[] = []
  const rows: UniverseRow[] = []
  const rowsByStore = new Map<string, UniverseRow[]>()
  const storeById = new Map<string, StoreRecord>()
  const originSystems = new Map<string, string>()
  const originSuggestion = new Map<string, string>()

  for (const store of stores) {
    storeById.set(store.id, store)
    if (!hasCatalogData(store)) continue
    const owner = ownerOf(store, client)
    const key = `${owner}|${store.category}`
    let group = groups.get(key)
    if (!group) {
      const src =
        store.sources.find((x) => x.kind === "Catálogo ERP") ??
        store.sources.find((x) => x.kind === "POS · Ventas") ??
        store.sources[0]
      group = buildGroup(client, owner, store.category, src.connector, used)
      groups.set(key, group)
      skus.push(...group.skus)
      group.skus.forEach((s) => {
        if (!originSystems.has(s.originCode)) {
          originSystems.set(s.originCode, s.source)
        }
        if (!originSuggestion.has(s.originCode) && !NOISE_ORIGINS.some((n) => n.code === s.originCode)) {
          originSuggestion.set(s.originCode, store.category)
        }
      })
    }

    const rand = seededRandom(hashString(`${store.id}|inv`))
    const mar = getStoreMetrics(store, "mar_2025", "prev_period")
    const lines = categoryLines[store.category] ?? []
    const lineShare = new Map(lines.map(([n, s]) => [n, s]))
    const count = Math.min(
      group.skus.length,
      Math.max(8, Math.round(store.sqm / 6)),
    )
    const chosen = [...group.skus].sort((a, b) => a.rank - b.rank).slice(0, count)
    const weights = chosen.map((s, i) => {
      const noise = 0.7 + seededRandom(hashString(`${store.id}|${s.code}|w`))() * 0.6
      return ((lineShare.get(s.line) ?? 10) / 5) * (1 / Math.pow(i + 1, 0.55)) * noise
    })
    const total = weights.reduce((a, b) => a + b, 0) || 1
    const hasInv = hasInventoryData(store)
    const driftRand = seededRandom(hashString(`${store.id}|drift`))
    const drift = -0.06 + driftRand() * 0.16
    const storeRows: UniverseRow[] = []

    chosen.forEach((sku, i) => {
      const r = rand()
      const dead = i >= 3 && r > 0.945
      const share = weights[i] / total
      const refRate = dead ? 0 : (mar.units * share) / 31
      let stock: number | null = null
      let status: InventoryStatus | null = null
      let lastSaleDays = Math.floor(rand() * 6)
      let daysOut = 0
      if (hasInv) {
        const c = rand()
        if (dead) {
          stock = 6 + Math.floor(rand() * 55)
          lastSaleDays = 61 + Math.floor(rand() * 180)
          status = "Inmovilizado"
        } else if (c < 0.06) {
          stock = 0
          daysOut = 1 + Math.floor(rand() * 20)
          status = "Quiebre"
        } else if (c < 0.17) {
          stock = Math.max(1, Math.round(refRate * (2 + rand() * 4.5)))
        } else if (c < 0.27) {
          stock = Math.max(4, Math.round(refRate * (96 + rand() * 150)))
        } else {
          stock = Math.max(1, Math.round(refRate * (12 + rand() * 58)))
        }
        if (!status) {
          const cover = refRate > 0 ? stock / refRate : Infinity
          status =
            stock === 0
              ? "Quiebre"
              : cover < LOW_COVERAGE_DAYS
                ? "Bajo"
                : cover > OVERSTOCK_COVERAGE_DAYS
                  ? "Sobrestock"
                  : "Óptimo"
        }
      }
      const row: UniverseRow = {
        id: `${store.id}|${sku.id}`,
        storeId: store.id,
        skuId: sku.id,
        share,
        dead,
        stock,
        compStock: stock === null ? null : Math.round(stock / (1 + drift)),
        lastSaleDays,
        daysOut,
        refRate,
        status,
      }
      rows.push(row)
      storeRows.push(row)
    })
    rowsByStore.set(store.id, storeRows)
  }

  const used2 = new Set(skus.map((s) => s.originCode))
  const origins: OriginCategory[] = []
  const lineByOrigin = new Map<string, string>()
  skus.forEach((s) => {
    if (!lineByOrigin.has(s.originCode)) lineByOrigin.set(s.originCode, s.line)
  })
  for (const code of used2) {
    const noise = NOISE_ORIGINS.find((n) => n.code === code)
    origins.push(
      noise
        ? { ...noise, system: originSystems.get(code) ?? "" }
        : {
            code,
            name: lineByOrigin.get(code) ?? code,
            suggestion: originSuggestion.get(code) ?? null,
            system: originSystems.get(code) ?? "",
          },
    )
  }
  origins.sort((a, b) => a.code.localeCompare(b.code))

  return {
    skus,
    skuById: new Map(skus.map((s) => [s.id, s])),
    rows,
    rowsByStore,
    origins,
    originByCode: new Map(origins.map((o) => [o.code, o])),
    storeById,
  }
}

/** Mapeo inicial: la mayoría homologada, algunos orígenes quedan pendientes. */
export function buildInitialHomologation(u: Universe): Homologation {
  const map: Homologation = {}
  for (const o of u.origins) {
    const pending = o.suggestion === null || hashString(o.code) % 100 < 14
    map[o.code] = pending ? null : o.suggestion
  }
  return map
}

export const stdCategoryOf = (sku: Sku, h: Homologation): string | null =>
  h[sku.originCode] ?? null

export const UNMAPPED_LABEL = "Sin homologar"

/* ------------------------------ Evaluación ------------------------------ */

export type EvalRow = UniverseRow & {
  sku: Sku
  store: StoreRecord
  coverage: number
  units: number
  compUnits: number
  value: number
  compValue: number
  stockCost: number
  compStockCost: number
}

/**
 * Cruza el universo con los filtros: ventas del periodo y de su comparación
 * por store×SKU (calibradas a las ventas netas del local) y stock actual.
 */
export function evaluate(
  u: Universe,
  scopeStores: StoreRecord[],
  periodId: PeriodId,
  compareMode: CompareMode,
): EvalRow[] {
  const out: EvalRow[] = []
  const deadFactor = periodId === "mar_2025" || periodId === "feb_2025" ? 0 : 0.2
  for (const store of scopeStores) {
    const rs = u.rowsByStore.get(store.id)
    if (!rs || rs.length === 0) continue
    const m = getStoreMetrics(store, periodId, compareMode)
    const raw = rs.map((r) => {
      const sku = u.skuById.get(r.skuId)!
      const f = r.dead ? deadFactor : 1
      return {
        r,
        sku,
        ru: m.units * r.share * f,
        rc: m.compUnits * r.share * f,
      }
    })
    const s = raw.reduce((a, x) => a + x.ru * x.sku.price, 0)
    const sc = raw.reduce((a, x) => a + x.rc * x.sku.price, 0)
    const k = s > 0 ? m.netSales / s : 0
    const kc = sc > 0 ? m.comparisonSales / sc : 0
    for (const x of raw) {
      const stock = x.r.stock ?? 0
      out.push({
        ...x.r,
        sku: x.sku,
        store,
        coverage: x.r.refRate > 0 ? stock / x.r.refRate : Infinity,
        units: Math.round(x.ru),
        compUnits: Math.round(x.rc),
        value: Math.round(x.ru * x.sku.price * k),
        compValue: Math.round(x.rc * x.sku.price * kc),
        stockCost: stock * x.sku.cost,
        compStockCost: (x.r.compStock ?? 0) * x.sku.cost,
      })
    }
  }
  return out
}

/* --------------------------- KPIs de inventario --------------------------- */

export type InventoryKpis = {
  stores: number
  skuCount: number
  units: number
  compUnits: number
  value: number
  compValue: number
  sold: number
  compSold: number
  days: number
  compDays: number
  rotation: number
  compRotation: number
  annualRotation: number
  sellThrough: number
  compSellThrough: number
}

export function computeInventoryKpis(
  rows: EvalRow[],
  periodId: PeriodId,
): InventoryKpis {
  const d = PERIOD_DAYS[periodId]
  let units = 0, compUnits = 0, value = 0, compValue = 0
  let sold = 0, compSold = 0, cogs = 0, compCogs = 0
  const stores = new Set<string>()
  for (const r of rows) {
    if (r.stock === null) continue
    stores.add(r.storeId)
    units += r.stock
    compUnits += r.compStock ?? 0
    value += r.stockCost
    compValue += r.compStockCost
    sold += r.units
    compSold += r.compUnits
    cogs += r.units * r.sku.cost
    compCogs += r.compUnits * r.sku.cost
  }
  const days = sold > 0 ? units / (sold / d) : 0
  const compDays = compSold > 0 ? compUnits / (compSold / d) : 0
  const rotation = value > 0 ? cogs / value : 0
  const compRotation = compValue > 0 ? compCogs / compValue : 0
  return {
    stores: stores.size,
    skuCount: rows.filter((r) => r.stock !== null).length,
    units,
    compUnits,
    value,
    compValue,
    sold,
    compSold,
    days,
    compDays,
    rotation,
    compRotation,
    annualRotation: rotation * (365 / d),
    sellThrough: sold + units > 0 ? (sold / (sold + units)) * 100 : 0,
    compSellThrough:
      compSold + compUnits > 0 ? (compSold / (compSold + compUnits)) * 100 : 0,
  }
}

export type StoreInventorySummary = {
  store: StoreRecord
  skus: number
  units: number
  value: number
  sold: number
  days: number
  sellThrough: number
  stockouts: number
  overstock: number
  immobilized: number
}

export function summarizeByStore(rows: EvalRow[], periodId: PeriodId) {
  const d = PERIOD_DAYS[periodId]
  const map = new Map<string, StoreInventorySummary>()
  for (const r of rows) {
    if (r.stock === null) continue
    const s = map.get(r.storeId) ?? {
      store: r.store,
      skus: 0,
      units: 0,
      value: 0,
      sold: 0,
      days: 0,
      sellThrough: 0,
      stockouts: 0,
      overstock: 0,
      immobilized: 0,
    }
    s.skus += 1
    s.units += r.stock
    s.value += r.stockCost
    s.sold += r.units
    if (r.status === "Quiebre") s.stockouts += 1
    if (r.status === "Sobrestock") s.overstock += 1
    if (r.status === "Inmovilizado") s.immobilized += 1
    map.set(r.storeId, s)
  }
  for (const s of map.values()) {
    s.days = s.sold > 0 ? s.units / (s.sold / d) : 0
    s.sellThrough = s.sold + s.units > 0 ? (s.sold / (s.sold + s.units)) * 100 : 0
  }
  return [...map.values()]
}

/* ------------------------------- Traslados ------------------------------- */

export type Transfer = {
  id: string
  sku: Sku
  from: StoreRecord
  to: StoreRecord
  fromStock: number
  fromCoverage: number
  toStock: number
  toRate: number
  qty: number
  distance: number
  /** Venta diaria que se pierde en el destino por falta de stock. */
  dailyAtRisk: number
  toStatus: InventoryStatus
}

export function buildTransfers(rows: EvalRow[]): Transfer[] {
  const bySku = new Map<string, EvalRow[]>()
  for (const r of rows) {
    if (r.stock === null) continue
    const list = bySku.get(r.skuId) ?? []
    list.push(r)
    bySku.set(r.skuId, list)
  }
  const transfers: Transfer[] = []
  const coords = (s: StoreRecord) => {
    const m = getMunicipality(s.muniCode)
    return { lat: m?.lat ?? s.lat, lng: m?.lng ?? s.lng }
  }
  for (const list of bySku.values()) {
    const origins = list
      .filter((r) => r.status === "Sobrestock")
      .map((r) => ({
        r,
        available: Math.floor(r.stock! - r.refRate * KEEP_COVERAGE_DAYS),
      }))
      .filter((o) => o.available >= 1)
    if (origins.length === 0) continue
    const dests = list
      .filter((r) => r.status === "Quiebre" || r.status === "Bajo")
      .map((r) => ({
        r,
        need: Math.ceil(r.refRate * TARGET_COVERAGE_DAYS - r.stock!),
      }))
      .filter((d) => d.need >= 1 && d.r.refRate > 0)
      .sort((a, b) => b.r.refRate - a.r.refRate)
    for (const dest of dests) {
      let need = dest.need
      const sorted = [...origins].sort(
        (a, b) =>
          distanceKm(coords(a.r.store), coords(dest.r.store)) -
          distanceKm(coords(b.r.store), coords(dest.r.store)),
      )
      for (const o of sorted) {
        if (need <= 0) break
        if (o.available < 1) continue
        const qty = Math.min(o.available, need)
        o.available -= qty
        need -= qty
        transfers.push({
          id: `${o.r.id}>${dest.r.id}`,
          sku: dest.r.sku,
          from: o.r.store,
          to: dest.r.store,
          fromStock: o.r.stock!,
          fromCoverage: o.r.coverage,
          toStock: dest.r.stock!,
          toRate: dest.r.refRate,
          qty,
          distance: Math.round(
            distanceKm(coords(o.r.store), coords(dest.r.store)),
          ),
          dailyAtRisk: Math.round(dest.r.refRate * dest.r.sku.price),
          toStatus: dest.r.status!,
        })
      }
    }
  }
  return transfers.sort(
    (a, b) =>
      Number(b.toStatus === "Quiebre") - Number(a.toStatus === "Quiebre") ||
      b.dailyAtRisk - a.dailyAtRisk,
  )
}

/* ------------------------------ Productos ------------------------------ */

export type ProductAgg = {
  sku: Sku
  std: string | null
  units: number
  value: number
  compUnits: number
  compValue: number
  stores: number
}

export function aggregateBySku(rows: EvalRow[], h: Homologation): ProductAgg[] {
  const map = new Map<string, ProductAgg>()
  for (const r of rows) {
    const a = map.get(r.skuId) ?? {
      sku: r.sku,
      std: stdCategoryOf(r.sku, h),
      units: 0,
      value: 0,
      compUnits: 0,
      compValue: 0,
      stores: 0,
    }
    a.units += r.units
    a.value += r.value
    a.compUnits += r.compUnits
    a.compValue += r.compValue
    a.stores += 1
    map.set(r.skuId, a)
  }
  return [...map.values()]
}

export type AbcClass = "A" | "B" | "C"
export type AbcRow = ProductAgg & {
  metric: number
  share: number
  cumulative: number
  cls: AbcClass
  rank: number
}

export const ABC_A = 80
export const ABC_B = 95

export function classifyAbc(
  list: ProductAgg[],
  by: "value" | "units",
): { rows: AbcRow[]; zeroSales: number; total: number } {
  const withSales = list.filter((p) => p[by] > 0)
  const sorted = [...withSales].sort(
    (a, b) => b[by] - a[by] || a.sku.code.localeCompare(b.sku.code),
  )
  const total = sorted.reduce((a, p) => a + p[by], 0)
  let acc = 0
  const rows = sorted.map((p, i) => {
    const before = total > 0 ? (acc / total) * 100 : 0
    acc += p[by]
    const cumulative = total > 0 ? (acc / total) * 100 : 0
    // Un SKU pertenece a A si el acumulado previo aún no alcanzaba el 80 %.
    const cls: AbcClass = before < ABC_A ? "A" : before < ABC_B ? "B" : "C"
    return {
      ...p,
      metric: p[by],
      share: total > 0 ? (p[by] / total) * 100 : 0,
      cumulative,
      cls,
      rank: i + 1,
    }
  })
  return { rows, zeroSales: list.length - withSales.length, total }
}
