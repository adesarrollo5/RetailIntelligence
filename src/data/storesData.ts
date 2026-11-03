import type { Client, ClientId } from "../types"
import {
  distanceKm,
  getDepartment,
  getMunicipality,
  municipalities,
} from "./colombiaGeo"

/* ------------------------------ Tipos ------------------------------ */

export type StoreFormat = "Centro comercial" | "Calle" | "Outlet"
export const storeFormats: StoreFormat[] = [
  "Centro comercial",
  "Calle",
  "Outlet",
]

export type StoreStatus = "Activa" | "En apertura" | "Cerrada temporalmente" | "Inactiva"
export const storeStatuses: StoreStatus[] = [
  "Activa",
  "En apertura",
  "Cerrada temporalmente",
  "Inactiva",
]

export type SourceKind = "POS · Ventas" | "Contador de personas" | "Inventario" | "Catálogo ERP"
export type SourceStatus = "Conectado" | "Atención" | "Error"
export type IntegrationState = SourceStatus | "Sin integración"
export const integrationStates: IntegrationState[] = [
  "Conectado",
  "Atención",
  "Error",
  "Sin integración",
]

export type StoreSource = {
  id: string
  kind: SourceKind
  connector: string
  status: SourceStatus
  lastSync: string
  quality: number
  latencyMs: number
  records24h: number
  detail: string
}

export type StoreSchedule = { days: string; open: string; close: string }
export const scheduleDayOptions = ["Lun–Dom", "Lun–Sáb", "Lun–Vie"]

export type StoreContract = {
  monthlyRent: number
  start: string
  end: string
  adjustment: string
}

export type StoreRecord = {
  id: string
  code: string
  name: string
  parent: string
  zone: string
  format: StoreFormat
  category: string
  sqm: number
  schedule: StoreSchedule
  address: string
  lat: number
  lng: number
  status: StoreStatus
  deptCode: string
  muniCode: string
  openedDate: string
  comparable: boolean
  /** Ventas netas mensuales de referencia (marzo 2025). 0 = sin operación. */
  baseSales: number
  growthPrevPeriod: number
  growthPrevYear: number
  avgTicket: number
  unitsPerTicket: number
  /** Conversión interna de referencia (%) cuando hay contador de personas. */
  baseConversion: number
  hasCounter: boolean
  sources: StoreSource[]
  contract?: StoreContract
}

export const REFERENCE_DATE = "2025-03-31"

/* --------------------------- Utilidades --------------------------- */

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededRandom(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`)
  const b = Date.parse(`${toIso}T00:00:00Z`)
  return Math.round((b - a) / 86400000)
}

export function scheduleText(s: StoreSchedule): string {
  return `${s.days} · ${s.open} – ${s.close}`
}

export function integrationStateOf(store: StoreRecord): IntegrationState {
  if (store.sources.length === 0) return "Sin integración"
  if (store.sources.some((s) => s.status === "Error")) return "Error"
  if (store.sources.some((s) => s.status === "Atención")) return "Atención"
  return "Conectado"
}

export function parentLabelOf(client: Client): string {
  return client.type === "operator" ? client.terminology.mallSingular : "Región"
}

export function getParentOptions(client: Client): string[] {
  return client.type === "operator" ? plazaParents : montanaRegions
}

export function getCategoryOptions(client: Client): string[] {
  return client.type === "operator" ? plazaCategories : montanaCategories
}

/** Coincidencia entre el selector global de alcance y una tienda. */
export function matchesGlobalScope(store: StoreRecord, scope: string): boolean {
  if (!scope || scope.startsWith("Todos") || scope.startsWith("Todas")) {
    return true
  }
  if (scope === store.parent || scope === `Región ${store.parent}`) return true
  const muni = getMunicipality(store.muniCode)
  const dept = getDepartment(store.deptCode)
  return scope === muni?.name || scope === dept?.name
}

/* ----------------------------- Catálogos ----------------------------- */

const plazaParents = [
  "Plaza Andina Bogotá",
  "Plaza Andina Medellín",
  "Plaza Andina Cali",
]
const montanaRegions = [
  "Región Centro",
  "Región Antioquia",
  "Región Occidente",
  "Región Caribe",
  "Región Santanderes",
]

const plazaCategories = [
  "Moda",
  "Calzado y marroquinería",
  "Alimentos y bebidas",
  "Tecnología",
  "Hogar y decoración",
  "Deportes",
  "Salud y belleza",
  "Servicios",
  "Entretenimiento",
]
const montanaCategories = [
  "Calzado casual",
  "Calzado deportivo",
  "Calzado formal",
  "Multimarca",
  "Accesorios y marroquinería",
]

const brandPool: Record<string, string[]> = {
  Moda: [
    "Arturo Calle",
    "Studio F",
    "Tennis",
    "Mango",
    "Offcorss",
    "Gef",
    "Bershka",
    "Americanino",
    "Koaj",
    "Naf Naf",
    "Punto Blanco",
    "Patprimo",
    "Seven Seven",
    "Esprit",
    "Basement",
    "Lili Pink",
  ],
  "Calzado y marroquinería": [
    "Vélez",
    "Bosi",
    "Mondrian",
    "Bata",
    "Crocs",
    "Skechers",
    "Aldo",
    "Hush Puppies",
    "Mario Hernández",
    "Totto",
    "Samsonite",
    "Cueros Vélez Kids",
  ],
  "Alimentos y bebidas": [
    "Juan Valdez",
    "Presto",
    "Frisby",
    "El Corral",
    "Wok",
    "Archies",
    "Starbucks",
    "Sushi Market",
    "Tostao",
    "Kokoriko",
    "Home Burgers",
    "Café Quindío",
    "Sbarro",
    "Crepes & Waffles",
    "Oma",
    "Panadería Real",
  ],
  Tecnología: [
    "iShop",
    "Samsung Store",
    "Huawei",
    "Xiaomi",
    "Claro",
    "Movistar",
    "Tigo",
    "Sony Center",
    "Lenovo Store",
    "Mac Center",
    "Game Planet",
  ],
  "Hogar y decoración": [
    "Tugó",
    "Zara Home",
    "Dormimundo",
    "Colchones Spring",
    "Homecenter Express",
    "Casa Ideas",
    "Mercería Hogar",
    "Vajillas Corona",
  ],
  Deportes: [
    "Decathlon Urbano",
    "Adidas",
    "Nike",
    "Puma",
    "Under Armour",
    "Reebok",
    "Fila",
    "Bodytech Store",
  ],
  "Salud y belleza": [
    "Farmatodo",
    "Locatel",
    "Sephora",
    "Miniso",
    "Yves Rocher",
    "Pandora",
    "Óptica Lafam",
    "Spa Aromas",
    "The Body Shop",
  ],
  Servicios: [
    "Davivienda",
    "Bancolombia",
    "Tintorería Express",
    "Foto Japón",
    "Cambios Andinos",
    "Reparación Móvil Pro",
    "Seguros Bolívar",
    "Lavandería Plus",
  ],
  Entretenimiento: [
    "Cine Colombia",
    "Divercity",
    "Zona Play",
    "Bowling Andina",
    "Escape Room",
    "Librería Panamericana",
  ],
}

const categoryProfile: Record<string, {
  sqm: [number, number]
  ticket: number
  conv: [number, number]
  prod: number
  units: number
  hours?: [string, string]
}> = {
  Moda: { sqm: [40, 180], ticket: 185000, conv: [14, 26], prod: 1, units: 2.1 },
  "Calzado y marroquinería": {
    sqm: [35, 120],
    ticket: 215000,
    conv: [12, 22],
    prod: 1.05,
    units: 1.4,
  },
  "Alimentos y bebidas": {
    sqm: [30, 220],
    ticket: 38000,
    conv: [18, 34],
    prod: 1.25,
    units: 2.6,
    hours: ["11:00", "22:00"],
  },
  Tecnología: {
    sqm: [25, 140],
    ticket: 640000,
    conv: [6, 14],
    prod: 1.5,
    units: 1.3,
  },
  "Hogar y decoración": {
    sqm: [60, 300],
    ticket: 280000,
    conv: [8, 15],
    prod: 0.8,
    units: 1.8,
  },
  Deportes: {
    sqm: [60, 400],
    ticket: 230000,
    conv: [10, 20],
    prod: 0.9,
    units: 1.9,
  },
  "Salud y belleza": {
    sqm: [20, 90],
    ticket: 62000,
    conv: [16, 30],
    prod: 1.1,
    units: 2.3,
  },
  Servicios: {
    sqm: [12, 60],
    ticket: 55000,
    conv: [20, 40],
    prod: 0.7,
    units: 1.1,
  },
  Entretenimiento: {
    sqm: [80, 900],
    ticket: 45000,
    conv: [14, 28],
    prod: 0.6,
    units: 1.6,
    hours: ["10:00", "23:00"],
  },
  "Calzado casual": {
    sqm: [60, 140],
    ticket: 228000,
    conv: [12, 22],
    prod: 1,
    units: 1.5,
  },
  "Calzado deportivo": {
    sqm: [60, 140],
    ticket: 252000,
    conv: [12, 22],
    prod: 1,
    units: 1.5,
  },
  "Calzado formal": {
    sqm: [50, 120],
    ticket: 269000,
    conv: [12, 22],
    prod: 1,
    units: 1.4,
  },
  Multimarca: {
    sqm: [90, 200],
    ticket: 241000,
    conv: [12, 22],
    prod: 1,
    units: 1.7,
  },
  "Accesorios y marroquinería": {
    sqm: [35, 80],
    ticket: 148000,
    conv: [12, 22],
    prod: 1,
    units: 1.9,
  },
}

/* --------------------------- Integraciones --------------------------- */

type SourceSeed = {
  kind: SourceKind
  connector: string
  errorChance: number
  warnChance: number
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function buildSources(
  storeId: string,
  seeds: SourceSeed[],
  rand: () => number,
  forced?: Partial<Record<SourceKind, SourceStatus>>,
): StoreSource[] {
  return seeds.map((seed, idx) => {
    const r = rand()
    let status: SourceStatus =
      r < seed.errorChance
        ? "Error"
        : r < seed.errorChance + seed.warnChance
          ? "Atención"
          : "Conectado"
    if (forced?.[seed.kind]) status = (forced[seed.kind] as SourceStatus)
    const hh = 6 + Math.floor(rand() * 3)
    const mm = Math.floor(rand() * 60)
    const quality =
      status === "Conectado"
        ? 93 + Math.floor(rand() * 7)
        : status === "Atención"
          ? 78 + Math.floor(rand() * 10)
          : 41 + Math.floor(rand() * 25)
    const detailByKind: Record<SourceKind, [string, string, string]> = {
      "POS · Ventas": [
        "Transacciones sincronizadas en línea, sin diferencias de cuadre",
        "Cierre de caja con retraso: 3 turnos pendientes de carga",
        "Credenciales del conector vencidas (HTTP 401). Reautorizar conexión",
      ],
      "Contador de personas": [
        "Sensor de conteo en línea, calibración vigente",
        "Desviación del conteo superior al 8% frente al POS",
        "Sensor sin señal desde el 29/03/2025. Revisar alimentación del equipo",
      ],
      Inventario: [
        "Existencias actualizadas cada 6 horas",
        "Carga de inventario con retraso de 14 horas",
        "Archivo de inventario rechazado: SKU vacíos en 38 filas",
      ],
      "Catálogo ERP": [
        "Catálogo de productos y precios al día",
        "Productos nuevos sin categoría asignada",
        "Servicio del ERP no disponible (timeout)",
      ],
    }
    const details = detailByKind[seed.kind]
    return {
      id: `${storeId}-src-${idx + 1}`,
      kind: seed.kind,
      connector: seed.connector,
      status,
      lastSync:
        status === "Conectado"
          ? `31/03/2025 ${pad2(hh)}:${pad2(mm)}`
          : status === "Atención"
            ? "30/03/2025 23:10"
            : "29/03/2025 21:40",
      quality,
      latencyMs:
        status === "Conectado"
          ? 180 + Math.floor(rand() * 260)
          : status === "Atención"
            ? 900 + Math.floor(rand() * 900)
            : 0,
      records24h:
        status === "Error"
          ? 0
          : Math.round(
              (seed.kind === "POS · Ventas"
                ? 240
                : seed.kind === "Inventario"
                  ? 1400
                  : seed.kind === "Contador de personas"
                    ? 960
                    : 80) *
                (0.6 + rand() * 0.9),
            ),
      detail:
        status === "Conectado"
          ? details[0]
          : status === "Atención"
            ? details[1]
            : details[2],
    }
  })
}

/* ------------------------- Generación de datos ------------------------- */

type Draftish = {
  name: string
  code: string
  parent: string
  zone: string
  format: StoreFormat
  category: string
  sqm: number
  address: string
  muniCode: string
  openedDate: string
  status?: StoreStatus
  comparable?: boolean
  weightBoost?: number
  forcedSources?: Partial<Record<SourceKind, SourceStatus>>
  noSources?: boolean
  schedule?: StoreSchedule
}

function jitter(rand: () => number, spread: number): number {
  return (rand() - 0.5) * 2 * spread
}

function finishStores(
  clientId: ClientId,
  drafts: Draftish[],
  parentTotals: Record<string, number>,
  sourceSeeds: SourceSeed[],
  options: { withCounter: boolean; withContract: boolean },
): StoreRecord[] {
  const weights = drafts.map((d) => {
    const status = d.status ?? "Activa"
    if (status !== "Activa") return 0
    const rand = seededRandom(hashString(`${clientId}-w-${d.code}`))
    const prof = categoryProfile[d.category]
    return (
      Math.pow(d.sqm, 0.8) *
      (0.65 + rand() * 1.0) *
      prof.prod *
      (d.weightBoost ?? 1)
    )
  })
  const totalsByParent: Record<string, number> = {}
  drafts.forEach((d, i) => {
    totalsByParent[d.parent] = (totalsByParent[d.parent] ?? 0) + weights[i]
  })

  return drafts.map((d, i) => {
    const rand = seededRandom(hashString(`${clientId}-s-${d.code}`))
    const prof = categoryProfile[d.category]
    const status = d.status ?? "Activa"
    const muni = getMunicipality(d.muniCode)
    const baseSales =
      weights[i] > 0
        ? Math.round(
            (parentTotals[d.parent] * weights[i]) /
              totalsByParent[d.parent] /
              1000,
          ) * 1000
        : 0
    const defaultHours: [string, string] =
      prof.hours ??
      (d.format === "Calle"
        ? ["09:00", "19:30"]
        : clientId === "plaza"
          ? ["10:00", "21:00"]
          : ["10:00", "20:00"])
    const schedule: StoreSchedule = d.schedule ?? {
      days: d.format === "Calle" ? "Lun–Sáb" : "Lun–Dom",
      open: defaultHours[0],
      close: defaultHours[1],
    }
    const hasCounter =
      options.withCounter && !d.noSources && status !== "Inactiva"
    const seeds = sourceSeeds.filter((s) => {
      if (d.noSources || status === "En apertura" || status === "Inactiva") {
        return false
      }
      if (s.kind === "Contador de personas") return hasCounter
      if (s.kind === "Inventario" && clientId === "plaza") {
        return rand() < 0.61
      }
      return true
    })
    const sources = buildSources(`st-${d.code}`, seeds, rand, d.forcedSources)

    const growthPrevPeriod = Number((-0.08 + rand() * 0.3).toFixed(3))
    const growthPrevYear = Number((-0.1 + rand() * 0.36).toFixed(3))

    let contract: StoreContract | undefined
    if (options.withContract && status !== "Inactiva") {
      const startYear = 2017 + Math.floor(rand() * 8)
      const startMonth = 1 + Math.floor(rand() * 12)
      const term = 3 + Math.floor(rand() * 8)
      const expiresSoon = status === "Activa" && rand() < 0.1
      const endIso = expiresSoon
        ? `2025-${pad2(5 + Math.floor(rand() * 7))}-${pad2(
            1 + Math.floor(rand() * 28),
          )}`
        : `${Math.max(startYear + term, 2026)}-${pad2(startMonth)}-28`
      const ratio = 0.055 + Math.pow(rand(), 1.3) * 0.2
      const rent =
        baseSales > 0
          ? Math.round((baseSales * ratio) / 50000) * 50000
          : Math.round((d.sqm * 78000) / 50000) * 50000
      contract = {
        monthlyRent: Math.max(rent, 600000),
        start:
          d.openedDate > `${startYear}-01-01`
            ? d.openedDate
            : `${startYear}-${pad2(startMonth)}-01`,
        end: endIso,
        adjustment: rand() < 0.5 ? "IPC + 1 pp" : "IPC anual",
      }
    }

    return {
      id: `st-${clientId}-${d.code.toLowerCase()}`,
      code: d.code,
      name: d.name,
      parent: d.parent,
      zone: d.zone,
      format: d.format,
      category: d.category,
      sqm: d.sqm,
      schedule,
      address: d.address,
      lat: Number(((muni?.lat ?? 4.7) + jitter(rand, 0.012)).toFixed(6)),
      lng: Number(((muni?.lng ?? -74) + jitter(rand, 0.012)).toFixed(6)),
      status,
      deptCode: muni?.deptCode ?? "11",
      muniCode: d.muniCode,
      openedDate: d.openedDate,
      comparable:
        d.comparable ?? daysBetween(d.openedDate, REFERENCE_DATE) > 400,
      baseSales,
      growthPrevPeriod,
      growthPrevYear,
      avgTicket: Math.round((prof.ticket * (0.85 + rand() * 0.3)) / 100) * 100,
      unitsPerTicket: Number((prof.units * (0.9 + rand() * 0.25)).toFixed(1)),
      baseConversion: Number(
        (prof.conv[0] + rand() * (prof.conv[1] - prof.conv[0])).toFixed(1),
      ),
      hasCounter,
      sources,
      contract,
    }
  })
}

function buildPlazaStores(): StoreRecord[] {
  type Cc = {
    parent: string
    prefix: string
    muni: string
    count: number
    address: string
    zones: Array<{ name: string; floor: number; format?: StoreFormat }>
  }
  const ccs: Cc[] = [
    {
      parent: "Plaza Andina Bogotá",
      prefix: "BOG",
      muni: "11001",
      count: 60,
      address: "Av. Calle 80 #68-45",
      zones: [
        { name: "Zona Moda", floor: 1 },
        { name: "Zona Moda", floor: 2 },
        { name: "Plazoleta Central", floor: 3 },
        { name: "Zona Tecnología", floor: 2 },
        { name: "Zona Hogar", floor: 1 },
        { name: "Ampliación Norte", floor: 2 },
        { name: "Acceso Principal", floor: 1 },
      ],
    },
    {
      parent: "Plaza Andina Medellín",
      prefix: "MED",
      muni: "05001",
      count: 48,
      address: "Cra. 43A #7 Sur-170",
      zones: [
        { name: "Zona Cuero", floor: 2 },
        { name: "Acceso Principal", floor: 1 },
        { name: "Plazoleta de Comidas", floor: 3 },
        { name: "Zona Moda", floor: 1 },
        { name: "Zona Deportes", floor: 2 },
      ],
    },
    {
      parent: "Plaza Andina Cali",
      prefix: "CAL",
      muni: "76001",
      count: 34,
      address: "Av. 6N #25-60",
      zones: [
        { name: "Pasillo Central", floor: 1 },
        { name: "Zona Outlet", floor: 1, format: "Outlet" },
        { name: "Plazoleta de Comidas", floor: 2 },
        { name: "Zona Moda", floor: 1 },
        { name: "Zona Tecnología", floor: 2 },
      ],
    },
  ]

  const fixed: Record<string, Draftish[]> = {
    "Plaza Andina Bogotá": [
      {
        name: "Arturo Calle · Local 104",
        code: "BOG-104",
        parent: "Plaza Andina Bogotá",
        zone: "Zona Moda · Piso 1",
        format: "Centro comercial",
        category: "Moda",
        sqm: 168,
        address: "Av. Calle 80 #68-45, Local 104",
        muniCode: "11001",
        openedDate: "2019-05-12",
        weightBoost: 1.9,
      },
      {
        name: "Crepes & Waffles · Plazoleta 301",
        code: "BOG-301",
        parent: "Plaza Andina Bogotá",
        zone: "Plazoleta Central · Piso 3",
        format: "Centro comercial",
        category: "Alimentos y bebidas",
        sqm: 210,
        address: "Av. Calle 80 #68-45, Plazoleta 301",
        muniCode: "11001",
        openedDate: "2018-02-18",
        weightBoost: 1.7,
        forcedSources: { "POS · Ventas": "Conectado" },
      },
      {
        name: "Decathlon Urbano · Local 240",
        code: "BOG-240",
        parent: "Plaza Andina Bogotá",
        zone: "Ampliación Norte · Piso 2",
        format: "Centro comercial",
        category: "Deportes",
        sqm: 1250,
        address: "Av. Calle 80 #68-45, Local 240",
        muniCode: "11001",
        openedDate: "2024-09-15",
        comparable: false,
        weightBoost: 0.9,
      },
      {
        name: "Zara Home · Local 215",
        code: "BOG-215",
        parent: "Plaza Andina Bogotá",
        zone: "Zona Hogar · Piso 2",
        format: "Centro comercial",
        category: "Hogar y decoración",
        sqm: 140,
        address: "Av. Calle 80 #68-45, Local 215",
        muniCode: "11001",
        openedDate: "2025-04-15",
        status: "En apertura",
        comparable: false,
      },
      {
        name: "Óptica Lafam · Local 131",
        code: "BOG-131",
        parent: "Plaza Andina Bogotá",
        zone: "Acceso Principal · Piso 1",
        format: "Centro comercial",
        category: "Salud y belleza",
        sqm: 38,
        address: "Av. Calle 80 #68-45, Local 131",
        muniCode: "11001",
        openedDate: "2016-08-03",
        status: "Cerrada temporalmente",
      },
    ],
    "Plaza Andina Medellín": [
      {
        name: "Vélez · Local 212",
        code: "MED-212",
        parent: "Plaza Andina Medellín",
        zone: "Zona Cuero · Piso 2",
        format: "Centro comercial",
        category: "Calzado y marroquinería",
        sqm: 124,
        address: "Cra. 43A #7 Sur-170, Local 212",
        muniCode: "05001",
        openedDate: "2020-09-04",
        weightBoost: 1.8,
      },
      {
        name: "iShop · Local 102",
        code: "MED-102",
        parent: "Plaza Andina Medellín",
        zone: "Acceso Principal · Piso 1",
        format: "Centro comercial",
        category: "Tecnología",
        sqm: 96,
        address: "Cra. 43A #7 Sur-170, Local 102",
        muniCode: "05001",
        openedDate: "2022-08-22",
        weightBoost: 1.5,
        forcedSources: { Inventario: "Atención" },
      },
      {
        name: "Bodytech Store · Local 233",
        code: "MED-233",
        parent: "Plaza Andina Medellín",
        zone: "Zona Deportes · Piso 2",
        format: "Centro comercial",
        category: "Deportes",
        sqm: 85,
        address: "Cra. 43A #7 Sur-170, Local 233",
        muniCode: "05001",
        openedDate: "2023-02-11",
        status: "Inactiva",
      },
    ],
    "Plaza Andina Cali": [
      {
        name: "Studio F · Local 118",
        code: "CAL-118",
        parent: "Plaza Andina Cali",
        zone: "Pasillo Central · Piso 1",
        format: "Centro comercial",
        category: "Moda",
        sqm: 132,
        address: "Av. 6N #25-60, Local 118",
        muniCode: "76001",
        openedDate: "2021-11-10",
        weightBoost: 1.8,
      },
      {
        name: "Nike Factory · Local 150",
        code: "CAL-150",
        parent: "Plaza Andina Cali",
        zone: "Zona Outlet · Piso 1",
        format: "Outlet",
        category: "Deportes",
        sqm: 190,
        address: "Av. 6N #25-60, Local 150",
        muniCode: "76001",
        openedDate: "2025-05-02",
        status: "En apertura",
        comparable: false,
      },
    ],
  }

  const drafts: Draftish[] = []
  ccs.forEach((cc) => {
    const rand = seededRandom(hashString(`plaza-${cc.prefix}`))
    const list = [...(fixed[cc.parent] ?? [])]
    const usedCodes = new Set(list.map((d) => d.code))
    const categories = Object.keys(brandPool)
    const catWeights: Record<string, number> = {
      Moda: 26,
      "Calzado y marroquinería": 10,
      "Alimentos y bebidas": 16,
      Tecnología: 8,
      "Hogar y decoración": 5,
      Deportes: 5,
      "Salud y belleza": 9,
      Servicios: 6,
      Entretenimiento: 3,
    }
    const totalW = categories.reduce((a, c) => a + catWeights[c], 0)
    let guard = 0
    while (list.length < cc.count && guard < 4000) {
      guard++
      let r = rand() * totalW
      let category = categories[0]
      for (const c of categories) {
        r -= catWeights[c]
        if (r <= 0) {
          category = c
          break
        }
      }
      const zone = cc.zones[Math.floor(rand() * cc.zones.length)]
      const local = zone.floor * 100 + 1 + Math.floor(rand() * 59)
      const code = `${cc.prefix}-${local}`
      if (usedCodes.has(code)) continue
      usedCodes.add(code)
      const brands = brandPool[category]
      const brand = brands[Math.floor(rand() * brands.length)]
      const prof = categoryProfile[category]
      const sqm = Math.round(
        prof.sqm[0] + Math.pow(rand(), 1.8) * (prof.sqm[1] - prof.sqm[0]),
      )
      const isPlazoleta = zone.name.startsWith("Plazoleta")
      const year = 2015 + Math.floor(rand() * 10)
      const openedDate = `${Math.min(year, 2024)}-${pad2(1 + Math.floor(rand() * 12))}-${pad2(1 + Math.floor(rand() * 27))}`
      list.push({
        name: `${brand} · ${
          isPlazoleta && category === "Alimentos y bebidas"
            ? "Plazoleta"
            : "Local"
        } ${local}`,
        code,
        parent: cc.parent,
        zone: `${zone.name} · Piso ${zone.floor}`,
        format: zone.format ?? "Centro comercial",
        category,
        sqm,
        address: `${cc.address}, Local ${local}`,
        muniCode: cc.muni,
        openedDate,
      })
    }
    drafts.push(...list)
  })

  return finishStores(
    "plaza",
    drafts,
    {
      "Plaza Andina Bogotá": 1584300000,
      "Plaza Andina Medellín": 1267850000,
      "Plaza Andina Cali": 967920000,
    },
    [
      {
        kind: "POS · Ventas",
        connector: "Siesa Enterprise POS",
        errorChance: 0.03,
        warnChance: 0.07,
      },
      {
        kind: "Contador de personas",
        connector: "Footfall Vision",
        errorChance: 0.04,
        warnChance: 0.08,
      },
      {
        kind: "Inventario",
        connector: "SAP Business One",
        errorChance: 0.04,
        warnChance: 0.2,
      },
    ],
    { withCounter: true, withContract: true },
  )
}

function buildMontanaStores(): StoreRecord[] {
  const R = {
    centro: "Región Centro",
    antioquia: "Región Antioquia",
    occidente: "Región Occidente",
    caribe: "Región Caribe",
    santanderes: "Región Santanderes",
  }
  const cc = "Centro comercial" as const
  const calle = "Calle" as const
  const outlet = "Outlet" as const
  const rows: Draftish[] = [
    {
      name: "Montaña Unicentro Bogotá",
      code: "CM-BOG01",
      parent: R.centro,
      zone: "Local 2-45 · Piso 2",
      format: cc,
      category: "Multimarca",
      sqm: 186,
      address: "Av. 15 #124-30, Unicentro",
      muniCode: "11001",
      openedDate: "2017-03-14",
      weightBoost: 1.5,
    },
    {
      name: "Montaña Zona T Calle 82",
      code: "CM-BOG02",
      parent: R.centro,
      zone: "Frente al parque de la 82",
      format: calle,
      category: "Calzado casual",
      sqm: 98,
      address: "Cl. 82 #12-28",
      muniCode: "11001",
      openedDate: "2018-06-20",
    },
    {
      name: "Montaña Outlet Las Américas",
      code: "CM-BOG03",
      parent: R.centro,
      zone: "Bodega 14",
      format: outlet,
      category: "Multimarca",
      sqm: 240,
      address: "Av. Cra. 68 #11-52",
      muniCode: "11001",
      openedDate: "2020-02-08",
      forcedSources: { Inventario: "Error" },
    },
    {
      name: "Montaña Andino Bogotá",
      code: "CM-BOG04",
      parent: R.centro,
      zone: "Local 3-12 · Piso 3",
      format: cc,
      category: "Calzado formal",
      sqm: 112,
      address: "Cra. 11 #82-71, Centro Andino",
      muniCode: "11001",
      openedDate: "2016-11-05",
      weightBoost: 1.3,
    },
    {
      name: "Montaña Chapinero Calle 53",
      code: "CM-BOG05",
      parent: R.centro,
      zone: "Zona comercial Chapinero",
      format: calle,
      category: "Calzado deportivo",
      sqm: 74,
      address: "Cl. 53 #13-40",
      muniCode: "11001",
      openedDate: "2019-09-12",
    },
    {
      name: "Montaña Titán Plaza",
      code: "CM-BOG06",
      parent: R.centro,
      zone: "Local 1-87 · Piso 1",
      format: cc,
      category: "Calzado casual",
      sqm: 130,
      address: "Av. Cl. 80 #72-35, Titán Plaza",
      muniCode: "11001",
      openedDate: "2021-04-30",
    },
    {
      name: "Montaña Gran Estación",
      code: "CM-BOG07",
      parent: R.centro,
      zone: "Local 2-30 · Piso 2",
      format: cc,
      category: "Accesorios y marroquinería",
      sqm: 68,
      address: "Av. Cl. 26 #62-47, Gran Estación",
      muniCode: "11001",
      openedDate: "2025-04-20",
      status: "En apertura",
      comparable: false,
    },
    {
      name: "Montaña El Tesoro Medellín",
      code: "CM-MED01",
      parent: R.antioquia,
      zone: "Local 2-18 · Piso 2",
      format: cc,
      category: "Multimarca",
      sqm: 172,
      address: "Cra. 25A #1A Sur-45, El Tesoro",
      muniCode: "05001",
      openedDate: "2017-08-17",
      weightBoost: 1.5,
    },
    {
      name: "Montaña Oviedo",
      code: "CM-MED02",
      parent: R.antioquia,
      zone: "Local 1-22 · Piso 1",
      format: cc,
      category: "Calzado casual",
      sqm: 104,
      address: "Cra. 43A #6 Sur-15, C.C. Oviedo",
      muniCode: "05001",
      openedDate: "2018-10-02",
    },
    {
      name: "Montaña Laureles Primer Parque",
      code: "CM-MED03",
      parent: R.antioquia,
      zone: "Primer Parque de Laureles",
      format: calle,
      category: "Calzado formal",
      sqm: 82,
      address: "Cra. 74 #39B-15",
      muniCode: "05001",
      openedDate: "2019-12-06",
    },
    {
      name: "Montaña Premium Plaza",
      code: "CM-MED04",
      parent: R.antioquia,
      zone: "Local 3-09 · Piso 3",
      format: cc,
      category: "Calzado deportivo",
      sqm: 96,
      address: "Cra. 43A #30-25, Premium Plaza",
      muniCode: "05001",
      openedDate: "2020-07-19",
    },
    {
      name: "Montaña Santafé Medellín",
      code: "CM-MED05",
      parent: R.antioquia,
      zone: "Local 1-64 · Piso 1",
      format: cc,
      category: "Accesorios y marroquinería",
      sqm: 58,
      address: "Cl. 7 Sur #43A-100, Santafé",
      muniCode: "05001",
      openedDate: "2022-03-25",
    },
    {
      name: "Montaña Outlet San Diego",
      code: "CM-MED06",
      parent: R.antioquia,
      zone: "Local 214",
      format: outlet,
      category: "Multimarca",
      sqm: 210,
      address: "Cl. 34 #43-66, San Diego",
      muniCode: "05001",
      openedDate: "2021-10-14",
    },
    {
      name: "Montaña Viva Envigado",
      code: "CM-ENV01",
      parent: R.antioquia,
      zone: "Local 2-40 · Piso 2",
      format: cc,
      category: "Calzado casual",
      sqm: 118,
      address: "Cra. 48 #32B Sur-139, Viva Envigado",
      muniCode: "05266",
      openedDate: "2024-10-18",
      comparable: false,
      weightBoost: 0.8,
    },
    {
      name: "Montaña Chipichape Cali",
      code: "CM-CAL01",
      parent: R.occidente,
      zone: "Local 1-33 · Piso 1",
      format: cc,
      category: "Multimarca",
      sqm: 158,
      address: "Cl. 38 Nte. #6N-35, Chipichape",
      muniCode: "76001",
      openedDate: "2017-05-26",
      weightBoost: 1.4,
    },
    {
      name: "Montaña Unicentro Cali",
      code: "CM-CAL02",
      parent: R.occidente,
      zone: "Local 2-14 · Piso 2",
      format: cc,
      category: "Calzado deportivo",
      sqm: 110,
      address: "Cra. 100 #5-169, Unicentro",
      muniCode: "76001",
      openedDate: "2018-09-08",
    },
    {
      name: "Montaña Jardín Plaza",
      code: "CM-CAL03",
      parent: R.occidente,
      zone: "Local 1-08 · Piso 1",
      format: cc,
      category: "Calzado casual",
      sqm: 94,
      address: "Cra. 98 #16-200, Jardín Plaza",
      muniCode: "76001",
      openedDate: "2019-04-13",
    },
    {
      name: "Montaña Granada Calle 5",
      code: "CM-CAL04",
      parent: R.occidente,
      zone: "Barrio Granada",
      format: calle,
      category: "Calzado formal",
      sqm: 70,
      address: "Av. 9N #12N-30",
      muniCode: "76001",
      openedDate: "2021-01-23",
      forcedSources: { "POS · Ventas": "Atención" },
    },
    {
      name: "Montaña Parque Arboleda Pereira",
      code: "CM-PER01",
      parent: R.occidente,
      zone: "Local 1-27 · Piso 1",
      format: cc,
      category: "Calzado casual",
      sqm: 88,
      address: "Av. Circunvalar #4-30, Parque Arboleda",
      muniCode: "66001",
      openedDate: "2020-11-27",
      status: "Cerrada temporalmente",
    },
    {
      name: "Montaña Buenavista Barranquilla",
      code: "CM-BAQ01",
      parent: R.caribe,
      zone: "Local 2-05 · Piso 2",
      format: cc,
      category: "Multimarca",
      sqm: 150,
      address: "Cl. 98 #52-115, Buenavista",
      muniCode: "08001",
      openedDate: "2018-12-01",
      weightBoost: 1.2,
    },
    {
      name: "Montaña Calle 84 Barranquilla",
      code: "CM-BAQ02",
      parent: R.caribe,
      zone: "Zona comercial Calle 84",
      format: calle,
      category: "Calzado deportivo",
      sqm: 76,
      address: "Cl. 84 #51B-20",
      muniCode: "08001",
      openedDate: "2022-06-18",
    },
    {
      name: "Montaña Caribe Plaza Cartagena",
      code: "CM-CTG01",
      parent: R.caribe,
      zone: "Local 1-41 · Piso 1",
      format: cc,
      category: "Calzado casual",
      sqm: 102,
      address: "Av. Pedro de Heredia #31-50, Caribe Plaza",
      muniCode: "13001",
      openedDate: "2019-02-15",
    },
    {
      name: "Montaña Bocagrande Cartagena",
      code: "CM-CTG02",
      parent: R.caribe,
      zone: "Avenida San Martín",
      format: calle,
      category: "Accesorios y marroquinería",
      sqm: 62,
      address: "Av. San Martín #8-45, Bocagrande",
      muniCode: "13001",
      openedDate: "2023-01-20",
    },
    {
      name: "Montaña Cacique Bucaramanga",
      code: "CM-BGA01",
      parent: R.santanderes,
      zone: "Local 1-19 · Piso 1",
      format: cc,
      category: "Multimarca",
      sqm: 124,
      address: "Tv. Oriental #92-98, Cacique",
      muniCode: "68001",
      openedDate: "2018-03-09",
      forcedSources: { "POS · Ventas": "Error" },
    },
    {
      name: "Montaña Cabecera Bucaramanga",
      code: "CM-BGA02",
      parent: R.santanderes,
      zone: "Cabecera del Llano",
      format: calle,
      category: "Calzado formal",
      sqm: 66,
      address: "Cra. 35 #50-30",
      muniCode: "68001",
      openedDate: "2021-08-21",
    },
  ]
  return finishStores(
    "montana",
    rows,
    {
      [R.centro]: 2148320000 * 0.395,
      [R.antioquia]: 2148320000 * 0.265,
      [R.occidente]: 2148320000 * 0.17,
      [R.caribe]: 2148320000 * 0.115,
      [R.santanderes]: 2148320000 * 0.055,
    },
    [
      {
        kind: "POS · Ventas",
        connector: "Vendty Retail POS",
        errorChance: 0.02,
        warnChance: 0.06,
      },
      {
        kind: "Inventario",
        connector: "CSV automático",
        errorChance: 0.02,
        warnChance: 0.1,
      },
    ],
    { withCounter: false, withContract: false },
  )
}

export const initialStoresByClient: Record<ClientId, StoreRecord[]> = {
  plaza: buildPlazaStores(),
  montana: buildMontanaStores(),
}

/* ------------------------- Alcance por perfil ------------------------- */

export type ManagerProfile = "regional" | "tienda"

export type ManagerAssignment = {
  profile: ManagerProfile
  personName: string
  /** Etiqueta mostrada al usuario (p. ej. "Plaza Andina Medellín"). */
  label: string
  parents?: string[]
  storeIds?: string[]
}

export const managerAssignments: Record<ClientId, Record<ManagerProfile, ManagerAssignment>> =
  {
    plaza: {
      regional: {
        profile: "regional",
        personName: "Carlos Andrés Mejía",
        label: "Plaza Andina Medellín",
        parents: ["Plaza Andina Medellín"],
      },
      tienda: {
        profile: "tienda",
        personName: "Sandra Patricia Rojas",
        label: "Arturo Calle · Local 104",
        storeIds: ["st-plaza-bog-104"],
      },
    },
    montana: {
      regional: {
        profile: "regional",
        personName: "Julián Arango Vélez",
        label: "Región Antioquia",
        parents: ["Región Antioquia"],
      },
      tienda: {
        profile: "tienda",
        personName: "Natalia Quintero Mora",
        label: "Montaña Unicentro Bogotá",
        storeIds: ["st-montana-cm-bog01"],
      },
    },
  }

export function getManagerAssignment(
  clientId: ClientId,
  profile: ManagerProfile,
): ManagerAssignment | undefined {
  return managerAssignments[clientId]?.[profile]
}

/* ------------------------------ Formulario ------------------------------ */

export type StoreDraft = {
  name: string
  code: string
  parent: string
  zone: string
  format: string
  category: string
  sqm: string
  scheduleDays: string
  open: string
  close: string
  address: string
  lat: string
  lng: string
  status: string
  deptCode: string
  muniCode: string
}

export type DraftErrors = Partial<Record<keyof StoreDraft, string>>

export const emptyDraft = (): StoreDraft => ({
  name: "",
  code: "",
  parent: "",
  zone: "",
  format: "",
  category: "",
  sqm: "",
  scheduleDays: "Lun–Dom",
  open: "10:00",
  close: "21:00",
  address: "",
  lat: "",
  lng: "",
  status: "En apertura",
  deptCode: "",
  muniCode: "",
})

export function draftFromStore(s: StoreRecord): StoreDraft {
  return {
    name: s.name,
    code: s.code,
    parent: s.parent,
    zone: s.zone,
    format: s.format,
    category: s.category,
    sqm: String(s.sqm).replace(".", ","),
    scheduleDays: s.schedule.days,
    open: s.schedule.open,
    close: s.schedule.close,
    address: s.address,
    lat: String(s.lat),
    lng: String(s.lng),
    status: s.status,
    deptCode: s.deptCode,
    muniCode: s.muniCode,
  }
}

export function parseDecimal(value: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".")
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return Number.NaN
  return Number(normalized)
}

export type ValidationContext = {
  existing: StoreRecord[]
  editingId?: string
  parentOptions: string[]
  categoryOptions: string[]
}

export function validateDraft(
  d: StoreDraft,
  ctx: ValidationContext,
): { errors: DraftErrors; warnings: string[] } {
  const errors: DraftErrors = {}
  const warnings: string[] = []
  const others = ctx.existing.filter((s) => s.id !== ctx.editingId)

  const name = d.name.trim()
  if (!name) errors.name = "El nombre es obligatorio."
  else if (name.length < 3) errors.name = "Use al menos 3 caracteres."
  else if (name.length > 80) errors.name = "Máximo 80 caracteres."
  else if (others.some((s) => s.name.toLowerCase() === name.toLowerCase()))
    errors.name = "Ya existe una ubicación con este nombre."

  const code = d.code.trim()
  if (!code) errors.code = "El código interno es obligatorio."
  else if (!/^[A-Z0-9]{2,8}(-[A-Z0-9]{1,8})+$/.test(code))
    errors.code = "Formato inválido. Use mayúsculas y guion, p. ej. BOG-104."
  else if (others.some((s) => s.code === code))
    errors.code = "Este código interno ya está en uso."

  if (!d.parent) errors.parent = "Seleccione una opción."
  else if (!ctx.parentOptions.includes(d.parent))
    errors.parent = "Valor no reconocido para este cliente."

  const zone = d.zone.trim()
  if (!zone) errors.zone = "Indique la zona o el piso."
  else if (zone.length < 2 || zone.length > 60)
    errors.zone = "Entre 2 y 60 caracteres."

  if (!d.format) errors.format = "Seleccione un formato."
  else if (!storeFormats.includes(d.format as StoreFormat))
    errors.format = "Formato no válido (Centro comercial, Calle u Outlet)."

  if (!d.category) errors.category = "Seleccione una categoría."
  else if (!ctx.categoryOptions.includes(d.category))
    errors.category = "Categoría no reconocida para este cliente."

  const sqm = parseDecimal(d.sqm)
  if (!d.sqm.trim()) errors.sqm = "Los m² son obligatorios."
  else if (Number.isNaN(sqm)) errors.sqm = "Ingrese un número válido."
  else if (sqm <= 0) errors.sqm = "Debe ser mayor que 0."
  else if (sqm > 20000) errors.sqm = "Máximo 20.000 m²."

  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!timeRe.test(d.open)) errors.open = "Hora inválida (HH:MM)."
  if (!timeRe.test(d.close)) errors.close = "Hora inválida (HH:MM)."
  if (!errors.open && !errors.close && d.close <= d.open)
    errors.close = "El cierre debe ser posterior a la apertura."
  if (!scheduleDayOptions.includes(d.scheduleDays))
    errors.scheduleDays = "Días de atención no válidos."

  const address = d.address.trim()
  if (!address) errors.address = "La dirección es obligatoria."
  else if (address.length < 5) errors.address = "Dirección demasiado corta."

  const lat = parseDecimal(d.lat)
  const lng = parseDecimal(d.lng)
  if (!d.lat.trim()) errors.lat = "Latitud obligatoria."
  else if (Number.isNaN(lat)) errors.lat = "Número inválido."
  else if (lat < -4.3 || lat > 13.5)
    errors.lat = "Fuera de Colombia (−4,3 a 13,5)."
  if (!d.lng.trim()) errors.lng = "Longitud obligatoria."
  else if (Number.isNaN(lng)) errors.lng = "Número inválido."
  else if (lng < -82 || lng > -66.8)
    errors.lng = "Fuera de Colombia (−82 a −66,8)."

  if (!storeStatuses.includes(d.status as StoreStatus))
    errors.status = "Seleccione un estado."

  const dept = getDepartment(d.deptCode)
  if (!d.deptCode) errors.deptCode = "Seleccione un departamento."
  else if (!dept) errors.deptCode = "Código DANE de departamento inválido."
  const muni = getMunicipality(d.muniCode)
  if (!d.muniCode) errors.muniCode = "Seleccione un municipio."
  else if (!muni) errors.muniCode = "Código DANE de municipio inválido."
  else if (dept && muni.deptCode !== dept.code)
    errors.muniCode = `El municipio ${muni.code} no pertenece a ${dept.name}.`

  if (muni && !errors.lat && !errors.lng) {
    const km = distanceKm({ lat, lng }, muni)
    if (km > 60)
      warnings.push(
        `Las coordenadas están a ${Math.round(km)} km del centro de ${muni.name}. Verifique que sean correctas.`,
      )
  }

  return { errors, warnings }
}

export function storeFromDraft(
  d: StoreDraft,
  client: Client,
  base?: StoreRecord,
): StoreRecord {
  const sqm = parseDecimal(d.sqm)
  const prof = categoryProfile[d.category]
  return {
    id: base?.id ?? `st-${client.id}-${d.code.trim().toLowerCase()}`,
    code: d.code.trim(),
    name: d.name.trim(),
    parent: d.parent,
    zone: d.zone.trim(),
    format: d.format as StoreFormat,
    category: d.category,
    sqm,
    schedule: { days: d.scheduleDays, open: d.open, close: d.close },
    address: d.address.trim(),
    lat: parseDecimal(d.lat),
    lng: parseDecimal(d.lng),
    status: d.status as StoreStatus,
    deptCode: d.deptCode,
    muniCode: d.muniCode,
    openedDate: base?.openedDate ?? REFERENCE_DATE,
    comparable: base?.comparable ?? false,
    baseSales: base?.baseSales ?? 0,
    growthPrevPeriod: base?.growthPrevPeriod ?? 0,
    growthPrevYear: base?.growthPrevYear ?? 0,
    avgTicket: base?.avgTicket ?? prof?.ticket ?? 100000,
    unitsPerTicket: base?.unitsPerTicket ?? prof?.units ?? 1.5,
    baseConversion: base?.baseConversion ?? 15,
    hasCounter: base?.hasCounter ?? false,
    sources: base?.sources ?? [],
    contract: base?.contract,
  }
}

export function nearestMunicipalityDefaults(muniCode: string) {
  const m = municipalities.find((x) => x.code === muniCode)
  return m ? { lat: m.lat.toFixed(6), lng: m.lng.toFixed(6) } : null
}
