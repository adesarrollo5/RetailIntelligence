import type { Client, CompareMode, PeriodId } from "../types"
import { calcVariationPercent } from "../utils/formatters"

export type PeriodMeta = {
  id: PeriodId
  label: string
  shortLabel: string
  prevPeriodLabel: string
  prevYearLabel: string
  multiplier: number
}

export const periodCatalog: PeriodMeta[] = [
  {
    id: "mar_2025",
    label: "01/03/2025 — 31/03/2025",
    shortLabel: "Marzo 2025",
    prevPeriodLabel: "01/02/2025 — 28/02/2025 (Periodo anterior)",
    prevYearLabel: "01/03/2024 — 31/03/2024 (Año anterior)",
    multiplier: 1,
  },
  {
    id: "feb_2025",
    label: "01/02/2025 — 28/02/2025",
    shortLabel: "Febrero 2025",
    prevPeriodLabel: "01/01/2025 — 31/01/2025 (Periodo anterior)",
    prevYearLabel: "01/02/2024 — 29/02/2024 (Año anterior)",
    multiplier: 0.91,
  },
  {
    id: "dic_2024",
    label: "01/12/2024 — 31/12/2024",
    shortLabel: "Diciembre 2024 (Prima y Navidad)",
    prevPeriodLabel: "01/11/2024 — 30/11/2024 (Periodo anterior)",
    prevYearLabel: "01/12/2023 — 31/12/2023 (Año anterior)",
    multiplier: 1.54,
  },
  {
    id: "q1_2025",
    label: "01/01/2025 — 31/03/2025",
    shortLabel: "1T 2025 (Acumulado)",
    prevPeriodLabel: "01/10/2024 — 31/12/2024 (Periodo anterior)",
    prevYearLabel: "01/01/2024 — 31/03/2024 (Año anterior)",
    multiplier: 2.78,
  },
  {
    id: "ult_13m",
    label: "01/03/2024 — 31/03/2025",
    shortLabel: "Últimos 13 meses",
    prevPeriodLabel: "01/02/2023 — 29/02/2024 (Periodo anterior)",
    prevYearLabel: "01/03/2023 — 31/03/2024 (Año anterior)",
    multiplier: 11.4,
  },
]

export function getPeriodMeta(periodId: PeriodId): PeriodMeta {
  return periodCatalog.find((p) => p.id === periodId) ?? periodCatalog[0]
}

export function getComparisonPeriodText(
  periodId: PeriodId,
  compareMode: CompareMode,
): string {
  const meta = getPeriodMeta(periodId)
  return compareMode === "prev_period"
    ? meta.prevPeriodLabel
    : meta.prevYearLabel
}

export function getScopeMultiplier(client: Client, scope: string): number {
  if (scope.startsWith("Todos") || scope.startsWith("Todas") || !scope) {
    return 1
  }
  if (client.id === "plaza") {
    if (scope.includes("Bogotá")) return 0.42
    if (scope.includes("Medellín")) return 0.33
    if (scope.includes("Cali")) return 0.25
    return 0.35
  }
  if (scope.includes("Centro") || scope.includes("Bogotá")) return 0.38
  if (scope.includes("Antioquia") || scope.includes("Medellín")) return 0.29
  if (scope.includes("Occidente") || scope.includes("Cali")) return 0.21
  return 0.26
}

export type DrilldownProduct = {
  id: string
  sku: string
  name: string
  units: number
  avgPrice: number
  netSales: number
  comparisonSales: number
  variation: number
}

export type DrilldownCategory = {
  id: string
  name: string
  transactions: number
  units: number
  netSales: number
  comparisonSales: number
  variation: number
  products: DrilldownProduct[]
}

export type DrilldownStore = {
  id: string
  name: string
  city: string
  zoneOrFormat: string
  comparable: boolean
  openedDate: string
  netSales: number
  comparisonSales: number
  variation: number
  transactions: number
  avgTicket: number
  units: number
  categories: DrilldownCategory[]
}

export type TrendPoint = {
  label: string
  fullDate: string
  actual: number
  comparison: number
  variation: number
  note?: string
}

export type BreakdownItem = {
  name: string
  subtitle?: string
  actual: number
  comparison: number
  variation: number
  share: number
  color: string
  comparable?: boolean
}

export type HeatmapCell = {
  day: string
  hour: string
  value: number
  comparison: number
  variation: number
}

export const commercialHours = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
]

export function getWeekDaysOrder(weekStartsOn: "Lunes" | "Domingo"): string[] {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  return weekStartsOn === "Domingo"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : days
}

export function buildSalesAnalytics(
  client: Client,
  scope: string,
  periodId: PeriodId,
  compareMode: CompareMode,
  comparableOnly: boolean,
) {
  const periodMeta = getPeriodMeta(periodId)
  const scopeMult = getScopeMultiplier(client, scope)
  const compFactor = comparableOnly ? 0.915 : 1
  const scale = periodMeta.multiplier * scopeMult * compFactor
  const yearSpread = compareMode === "prev_year" ? 0.96 : 1

  const isOperator = client.id === "plaza"
  const baseNetSales = isOperator ? 3820450000 : 2148320000
  const basePrevNetSales = (isOperator ? 3398900000 : 1911300000) * yearSpread

  const netSales = Math.round(baseNetSales * scale)
  const compNetSales = Math.round(basePrevNetSales * scale)

  const grossSales = Math.round(netSales * 1.19)
  const compGrossSales = Math.round(compNetSales * 1.188)

  const discounts = Math.round(grossSales * (isOperator ? 0.062 : 0.074))
  const compDiscounts = Math.round(
    compGrossSales * (isOperator ? 0.066 : 0.071),
  )

  const returnsAmount = Math.round(grossSales * (isOperator ? 0.021 : 0.028))
  const compReturnsAmount = Math.round(
    compGrossSales * (isOperator ? 0.023 : 0.03),
  )

  const transactions = Math.max(
    120,
    Math.round((isOperator ? 31420 : 18642) * scale),
  )
  const compTransactions = Math.max(
    110,
    Math.round((isOperator ? 28900 : 17140) * scale * yearSpread),
  )

  const avgTicket = Math.round(netSales / Math.max(1, transactions))
  const compAvgTicket = Math.round(compNetSales / Math.max(1, compTransactions))

  const unitsPerTicket = isOperator
    ? comparableOnly
      ? 2.54
      : 2.48
    : comparableOnly
      ? 1.92
      : 1.86
  const compUnitsPerTicket = isOperator ? 2.39 : 1.79

  const totalUnits = Math.round(transactions * unitsPerTicket)
  const compTotalUnits = Math.round(compTransactions * compUnitsPerTicket)

  const avgPrice = Math.round(netSales / Math.max(1, totalUnits))
  const compAvgPrice = Math.round(compNetSales / Math.max(1, compTotalUnits))

  const kpis = {
    netSales: {
      current: netSales,
      comparison: compNetSales,
      variation: calcVariationPercent(netSales, compNetSales),
    },
    grossSales: {
      current: grossSales,
      comparison: compGrossSales,
      variation: calcVariationPercent(grossSales, compGrossSales),
    },
    discounts: {
      current: discounts,
      comparison: compDiscounts,
      variation: calcVariationPercent(discounts, compDiscounts),
      ratePercent: Number(((discounts / grossSales) * 100).toFixed(1)),
    },
    returns: {
      current: returnsAmount,
      comparison: compReturnsAmount,
      variation: calcVariationPercent(returnsAmount, compReturnsAmount),
      ratePercent: Number(((returnsAmount / grossSales) * 100).toFixed(1)),
    },
    transactions: {
      current: transactions,
      comparison: compTransactions,
      variation: calcVariationPercent(transactions, compTransactions),
    },
    avgTicket: {
      current: avgTicket,
      comparison: compAvgTicket,
      variation: calcVariationPercent(avgTicket, compAvgTicket),
    },
    unitsPerTicket: {
      current: unitsPerTicket,
      comparison: compUnitsPerTicket,
      variation: calcVariationPercent(unitsPerTicket, compUnitsPerTicket),
    },
    avgPrice: {
      current: avgPrice,
      comparison: compAvgPrice,
      variation: calcVariationPercent(avgPrice, compAvgPrice),
    },
  }

  const rawDays = [
    { d: "01/03", b: 96, c: 88 },
    { d: "03/03", b: 102, c: 93 },
    { d: "05/03", b: 108, c: 97 },
    { d: "07/03", b: 118, c: 105 },
    { d: "09/03", b: 124, c: 112 },
    { d: "11/03", b: 112, c: 103 },
    { d: "13/03", b: 131, c: 118 },
    { d: "15/03", b: 194, c: 162, note: "Pico quincena" },
    { d: "17/03", b: 146, c: 131 },
    { d: "19/03", b: 129, c: 118 },
    { d: "21/03", b: 142, c: 126 },
    { d: "23/03", b: 158, c: 139 },
    { d: "24/03", b: 166, c: 144, note: "Festivo San José" },
    { d: "27/03", b: 148, c: 132 },
    { d: "30/03", b: 212, c: 179, note: "Pico quincena fin de mes" },
    { d: "31/03", b: 184, c: 161 },
  ]
  const dayFactor = netSales / 2270
  const trendByDay: TrendPoint[] = rawDays.map((item) => {
    const actual = Math.round(item.b * dayFactor)
    const comparison = Math.round(item.c * dayFactor * yearSpread)
    return {
      label: item.d,
      fullDate: `${item.d}/2025`,
      actual,
      comparison,
      variation: calcVariationPercent(actual, comparison),
      note: item.note,
    }
  })

  const rawWeeks = [
    { w: "Sem 1 (01-07 Mar)", b: 685, c: 618 },
    { w: "Sem 2 (08-14 Mar)", b: 810, c: 735 },
    { w: "Sem 3 (15-21 Mar · Quincena)", b: 1095, c: 942, note: "Quincena" },
    { w: "Sem 4 (22-28 Mar · Puente)", b: 965, c: 868, note: "Puente festivo" },
    { w: "Sem 5 (29-31 Mar · Cierre)", b: 645, c: 558 },
  ]
  const weekFactor = netSales / 4200
  const trendByWeek: TrendPoint[] = rawWeeks.map((item) => {
    const actual = Math.round(item.b * weekFactor)
    const comparison = Math.round(item.c * weekFactor * yearSpread)
    return {
      label: item.w.split(" ")[0] + " " + item.w.split(" ")[1],
      fullDate: item.w,
      actual,
      comparison,
      variation: calcVariationPercent(actual, comparison),
      note: item.note,
    }
  })

  const rawMonths = [
    { m: "Mar 24", b: 3180, c: 2940 },
    { m: "Abr 24", b: 3010, c: 2870 },
    { m: "May 24", b: 3290, c: 3060, note: "Día de la Madre" },
    { m: "Jun 24", b: 3960, c: 3470, note: "Prima mitad de año" },
    { m: "Jul 24", b: 3620, c: 3310 },
    { m: "Ago 24", b: 3510, c: 3260 },
    { m: "Sep 24", b: 3440, c: 3200, note: "Amor y Amistad" },
    { m: "Oct 24", b: 3710, c: 3390 },
    { m: "Nov 24", b: 4280, c: 3740, note: "Black Friday" },
    { m: "Dic 24", b: 5890, c: 4920, note: "Prima y Navidad" },
    { m: "Ene 25", b: 3370, c: 3150 },
    { m: "Feb 25", b: 3460, c: 3230 },
    { m: "Mar 25", b: 3820, c: 3398 },
  ]
  const monthFactor = netSales / 3820
  const trendByMonth: TrendPoint[] = rawMonths.map((item) => {
    const actual = Math.round(item.b * monthFactor)
    const comparison = Math.round(item.c * monthFactor * yearSpread)
    return {
      label: item.m,
      fullDate: item.m,
      actual,
      comparison,
      variation: calcVariationPercent(actual, comparison),
      note: item.note,
    }
  })

  const rawStores: DrilldownStore[] = isOperator
    ? [
        {
          id: "st-pa-1",
          name: "Arturo Calle · Local 104 (Bogotá)",
          city: "Bogotá D.C.",
          zoneOrFormat: "Plaza Andina Bogotá · Zona Moda Piso 1",
          comparable: true,
          openedDate: "12/05/2019",
          netSales: Math.round(netSales * 0.24),
          comparisonSales: Math.round(compNetSales * 0.232),
          variation: 0,
          transactions: Math.round(transactions * 0.21),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.23),
          categories: [],
        },
        {
          id: "st-pa-2",
          name: "Vélez · Local 212 (Medellín)",
          city: "Medellín, Antioquia",
          zoneOrFormat: "Plaza Andina Medellín · Zona Cuero Piso 2",
          comparable: true,
          openedDate: "04/09/2020",
          netSales: Math.round(netSales * 0.2),
          comparisonSales: Math.round(compNetSales * 0.195),
          variation: 0,
          transactions: Math.round(transactions * 0.18),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.19),
          categories: [],
        },
        {
          id: "st-pa-3",
          name: "Crepes & Waffles · Plazoleta 301 (Bogotá)",
          city: "Bogotá D.C.",
          zoneOrFormat: "Plaza Andina Bogotá · Plazoleta Central Piso 3",
          comparable: true,
          openedDate: "18/02/2018",
          netSales: Math.round(netSales * 0.18),
          comparisonSales: Math.round(compNetSales * 0.182),
          variation: 0,
          transactions: Math.round(transactions * 0.25),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.24),
          categories: [],
        },
        {
          id: "st-pa-4",
          name: "Studio F · Local 118 (Cali)",
          city: "Cali, Valle del Cauca",
          zoneOrFormat: "Plaza Andina Cali · Pasillo Central",
          comparable: true,
          openedDate: "10/11/2021",
          netSales: Math.round(netSales * 0.16),
          comparisonSales: Math.round(compNetSales * 0.165),
          variation: 0,
          transactions: Math.round(transactions * 0.15),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.16),
          categories: [],
        },
        {
          id: "st-pa-5",
          name: "iShop · Local 102 (Medellín)",
          city: "Medellín, Antioquia",
          zoneOrFormat: "Plaza Andina Medellín · Acceso Principal",
          comparable: true,
          openedDate: "22/08/2022",
          netSales: Math.round(netSales * 0.13),
          comparisonSales: Math.round(compNetSales * 0.138),
          variation: 0,
          transactions: Math.round(transactions * 0.12),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.1),
          categories: [],
        },
        {
          id: "st-pa-6",
          name: "Decathlon Urbano · Local 240 (Apertura 2024)",
          city: "Bogotá D.C.",
          zoneOrFormat: "Plaza Andina Bogotá · Ampliación Norte",
          comparable: false,
          openedDate: "15/09/2024",
          netSales: Math.round(netSales * 0.09),
          comparisonSales: Math.round(compNetSales * 0.088),
          variation: 0,
          transactions: Math.round(transactions * 0.09),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.08),
          categories: [],
        },
      ]
    : [
        {
          id: "st-cm-1",
          name: "Montaña Unicentro Bogotá",
          city: "Bogotá D.C.",
          zoneOrFormat: "Formato Centro Comercial · Región Centro",
          comparable: true,
          openedDate: "14/03/2017",
          netSales: Math.round(netSales * 0.23),
          comparisonSales: Math.round(compNetSales * 0.221),
          variation: 0,
          transactions: Math.round(transactions * 0.22),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.23),
          categories: [],
        },
        {
          id: "st-cm-2",
          name: "Montaña El Tesoro Medellín",
          city: "Medellín, Antioquia",
          zoneOrFormat: "Formato Centro Comercial · Región Antioquia",
          comparable: true,
          openedDate: "20/07/2019",
          netSales: Math.round(netSales * 0.2),
          comparisonSales: Math.round(compNetSales * 0.194),
          variation: 0,
          transactions: Math.round(transactions * 0.19),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.2),
          categories: [],
        },
        {
          id: "st-cm-3",
          name: "Montaña Chipichape Cali",
          city: "Cali, Valle del Cauca",
          zoneOrFormat: "Formato Centro Comercial · Región Occidente",
          comparable: true,
          openedDate: "05/10/2020",
          netSales: Math.round(netSales * 0.18),
          comparisonSales: Math.round(compNetSales * 0.182),
          variation: 0,
          transactions: Math.round(transactions * 0.18),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.18),
          categories: [],
        },
        {
          id: "st-cm-4",
          name: "Montaña Zona T Calle 82",
          city: "Bogotá D.C.",
          zoneOrFormat: "Formato Calle Flagship · Región Centro",
          comparable: true,
          openedDate: "11/11/2021",
          netSales: Math.round(netSales * 0.16),
          comparisonSales: Math.round(compNetSales * 0.165),
          variation: 0,
          transactions: Math.round(transactions * 0.16),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.15),
          categories: [],
        },
        {
          id: "st-cm-5",
          name: "Montaña Outlet Las Américas",
          city: "Bogotá D.C.",
          zoneOrFormat: "Formato Outlet · Región Centro",
          comparable: true,
          openedDate: "02/04/2022",
          netSales: Math.round(netSales * 0.14),
          comparisonSales: Math.round(compNetSales * 0.148),
          variation: 0,
          transactions: Math.round(transactions * 0.16),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.15),
          categories: [],
        },
        {
          id: "st-cm-6",
          name: "Montaña Viva Envigado (Apertura Oct 2024)",
          city: "Envigado, Antioquia",
          zoneOrFormat: "Formato Centro Comercial · Nueva apertura",
          comparable: false,
          openedDate: "18/10/2024",
          netSales: Math.round(netSales * 0.09),
          comparisonSales: Math.round(compNetSales * 0.09),
          variation: 0,
          transactions: Math.round(transactions * 0.09),
          avgTicket: 0,
          units: Math.round(totalUnits * 0.09),
          categories: [],
        },
      ]

  const populatedStores: DrilldownStore[] = rawStores
    .filter((st) => (!comparableOnly ? true : st.comparable))
    .map((st) => {
      const variation = calcVariationPercent(st.netSales, st.comparisonSales)
      const avgT = Math.round(st.netSales / Math.max(1, st.transactions))
      const catDefs = isOperator
        ? [
            {
              suffix: "c1",
              name: "Prendas exteriores y sastrería",
              share: 0.44,
              cShare: 0.42,
              prods: [
                {
                  sku: "AC-CHA-401",
                  name: "Chaqueta impermeable Andina Pro",
                  share: 0.42,
                  price: 289900,
                },
                {
                  sku: "AC-BLA-210",
                  name: "Blazer lino mezcla ejecutivo",
                  share: 0.34,
                  price: 349900,
                },
                {
                  sku: "AC-CAM-118",
                  name: "Camisa Oxford algodón pima",
                  share: 0.24,
                  price: 159900,
                },
              ],
            },
            {
              suffix: "c2",
              name: "Calzado y marroquinería",
              share: 0.34,
              cShare: 0.35,
              prods: [
                {
                  sku: "VZ-BOT-890",
                  name: "Bota cuero graso artesanal",
                  share: 0.46,
                  price: 429900,
                },
                {
                  sku: "VZ-MOR-512",
                  name: "Morral porta-PC cuero napa",
                  share: 0.32,
                  price: 519900,
                },
                {
                  sku: "VZ-CIN-104",
                  name: "Cinturón doble faz hebilla mate",
                  share: 0.22,
                  price: 149900,
                },
              ],
            },
            {
              suffix: "c3",
              name: "Accesorios y complementos",
              share: 0.22,
              cShare: 0.23,
              prods: [
                {
                  sku: "AC-BIL-302",
                  name: "Billetera RFID cuero grabado",
                  share: 0.5,
                  price: 129900,
                },
                {
                  sku: "AC-GAF-710",
                  name: "Gafas polarizadas montura acetato",
                  share: 0.5,
                  price: 189900,
                },
              ],
            },
          ]
        : [
            {
              suffix: "c1",
              name: "Botas senderismo e impermeables",
              share: 0.46,
              cShare: 0.44,
              prods: [
                {
                  sku: "CM-PAR-901",
                  name: "Bota Páramo DryTex Vibram",
                  share: 0.45,
                  price: 389900,
                },
                {
                  sku: "CM-COC-740",
                  name: "Botín Cocuy cuero hidrofugado",
                  share: 0.33,
                  price: 329900,
                },
                {
                  sku: "CM-NEV-512",
                  name: "Bota Nevado caña media",
                  share: 0.22,
                  price: 299900,
                },
              ],
            },
            {
              suffix: "c2",
              name: "Tenis urbanos y casuales",
              share: 0.35,
              cShare: 0.36,
              prods: [
                {
                  sku: "CM-URB-310",
                  name: "Tenis Sabana suela ultraligera",
                  share: 0.48,
                  price: 249900,
                },
                {
                  sku: "CM-CAS-205",
                  name: "Zapato mocasín cuero nobuck",
                  share: 0.31,
                  price: 269900,
                },
                {
                  sku: "CM-RUN-118",
                  name: "Tenis Trail Chicamocha Grip",
                  share: 0.21,
                  price: 279900,
                },
              ],
            },
            {
              suffix: "c3",
              name: "Morrales y cuidado del cuero",
              share: 0.19,
              cShare: 0.2,
              prods: [
                {
                  sku: "CM-MOR-402",
                  name: "Morral Tayrona 28L impermeable",
                  share: 0.62,
                  price: 219900,
                },
                {
                  sku: "CM-KIT-099",
                  name: "Kit renovador e impermeabilizante",
                  share: 0.38,
                  price: 54900,
                },
              ],
            },
          ]

      const categories: DrilldownCategory[] = catDefs.map((cd) => {
        const catNet = Math.round(st.netSales * cd.share)
        const catComp = Math.round(st.comparisonSales * cd.cShare)
        const catTx = Math.round(st.transactions * cd.share)
        const catUnits = Math.round(st.units * cd.share)
        const products: DrilldownProduct[] = cd.prods.map((p, idx) => {
          const pNet = Math.round(catNet * p.share)
          const pComp = Math.round(
            catComp * (p.share + (idx === 0 ? -0.02 : 0.01)),
          )
          const pUnits = Math.max(1, Math.round(pNet / p.price))
          return {
            id: `${st.id}-${cd.suffix}-p${idx}`,
            sku: p.sku,
            name: p.name,
            units: pUnits,
            avgPrice: p.price,
            netSales: pNet,
            comparisonSales: pComp,
            variation: calcVariationPercent(pNet, pComp),
          }
        })
        return {
          id: `${st.id}-${cd.suffix}`,
          name: cd.name,
          transactions: catTx,
          units: catUnits,
          netSales: catNet,
          comparisonSales: catComp,
          variation: calcVariationPercent(catNet, catComp),
          products,
        }
      })

      return {
        ...st,
        variation,
        avgTicket: avgT,
        categories,
      }
    })

  const byStore: BreakdownItem[] = populatedStores.map((st, idx) => ({
    name: st.name.split(" · ")[0],
    subtitle: st.city,
    actual: st.netSales,
    comparison: st.comparisonSales,
    variation: st.variation,
    share: Number(((st.netSales / Math.max(1, netSales)) * 100).toFixed(1)),
    color:
      idx === 0
        ? client.color
        : idx === 1
          ? client.secondaryColor
          : idx === 2
            ? client.accentColor
            : "#64748b",
    comparable: st.comparable,
  }))

  const rawCategories = isOperator
    ? [
        { name: "Moda y confección", s: 0.36, cs: 0.345, color: client.color },
        {
          name: "Gastronomía y cafés",
          s: 0.25,
          cs: 0.255,
          color: client.secondaryColor,
        },
        {
          name: "Calzado y marroquinería",
          s: 0.17,
          cs: 0.168,
          color: client.accentColor,
        },
        { name: "Tecnología y hogar", s: 0.13, cs: 0.14, color: "#f59e0b" },
        {
          name: "Entretenimiento y servicios",
          s: 0.09,
          cs: 0.092,
          color: "#94a3b8",
        },
      ]
    : [
        {
          name: "Botas outdoor e impermeables",
          s: 0.42,
          cs: 0.395,
          color: client.color,
        },
        {
          name: "Tenis urbanos y casuales",
          s: 0.28,
          cs: 0.285,
          color: client.secondaryColor,
        },
        {
          name: "Calzado formal en cuero",
          s: 0.16,
          cs: 0.172,
          color: client.accentColor,
        },
        {
          name: "Morrales y marroquinería",
          s: 0.1,
          cs: 0.105,
          color: "#6366f1",
        },
        { name: "Accesorios y cuidado", s: 0.04, cs: 0.043, color: "#94a3b8" },
      ]

  const byCategory: BreakdownItem[] = rawCategories.map((cat) => {
    const actual = Math.round(netSales * cat.s)
    const comparison = Math.round(compNetSales * cat.cs)
    return {
      name: cat.name,
      actual,
      comparison,
      variation: calcVariationPercent(actual, comparison),
      share: Math.round(cat.s * 100),
      color: cat.color,
    }
  })

  const rawPayments = [
    {
      name: "Débito",
      subtitle: "Tarjetas débito Redeban / Credibanco",
      s: 0.36,
      cs: 0.352,
      color: client.color,
    },
    {
      name: "Crédito",
      subtitle: "Visa, Mastercard, Amex y Diners",
      s: 0.28,
      cs: 0.294,
      color: client.secondaryColor,
    },
    {
      name: "Transferencia",
      subtitle: "PSE, Nequi, Daviplata y QR Bancolombia",
      s: 0.19,
      cs: 0.162,
      color: client.accentColor,
    },
    {
      name: "Efectivo",
      subtitle: "Recaudo en billetes y monedas COP",
      s: 0.12,
      cs: 0.142,
      color: "#10b981",
    },
    {
      name: "Otros",
      subtitle: "Bonos regalo, BigPass y crédito directo",
      s: 0.05,
      cs: 0.05,
      color: "#94a3b8",
    },
  ]

  const byPaymentMethod: BreakdownItem[] = rawPayments.map((pm) => {
    const actual = Math.round(netSales * pm.s)
    const comparison = Math.round(compNetSales * pm.cs)
    return {
      name: pm.name,
      subtitle: pm.subtitle,
      actual,
      comparison,
      variation: calcVariationPercent(actual, comparison),
      share: Math.round(pm.s * 100),
      color: pm.color,
    }
  })

  const orderedDays = getWeekDaysOrder(client.parameters.weekStartsOn)
  const dayWeights: Record<string, number> = {
    Lun: 0.78,
    Mar: 0.82,
    Mié: 0.88,
    Jue: 0.96,
    Vie: 1.24,
    Sáb: 1.48,
    Dom: 1.18,
  }
  const hourWeights: Record<string, number> = {
    "09:00": 0.32,
    "10:00": 0.48,
    "11:00": 0.68,
    "12:00": 0.96,
    "13:00": 1.08,
    "14:00": 0.94,
    "15:00": 1.06,
    "16:00": 1.24,
    "17:00": 1.44,
    "18:00": 1.52,
    "19:00": 1.28,
    "20:00": 0.84,
  }

  const baseCellSale = netSales / (7 * 12 * 4.2)
  const salesHeatmap: HeatmapCell[] = []
  orderedDays.forEach((day) => {
    commercialHours.forEach((hour) => {
      const dw = dayWeights[day] ?? 1
      const hw = hourWeights[hour] ?? 1
      const value = Math.round(baseCellSale * dw * hw)
      const comp = Math.round(
        value * (compareMode === "prev_year" ? 0.87 : 0.9),
      )
      salesHeatmap.push({
        day,
        hour,
        value,
        comparison: comp,
        variation: calcVariationPercent(value, comp),
      })
    })
  })

  return {
    kpis,
    trendByDay,
    trendByWeek,
    trendByMonth,
    byStore,
    byCategory,
    byPaymentMethod,
    salesHeatmap,
    storesHierarchy: populatedStores,
    totalLocationsCount: rawStores.length,
    comparableLocationsCount: rawStores.filter((s) => s.comparable).length,
  }
}

export type GateTrafficItem = {
  id: string
  name: string
  zone: string
  type: "Peatonal" | "Vehicular" | "Transporte masivo"
  visitors: number
  comparisonVisitors: number
  variation: number
  share: number
}

export type LocalCaptureItem = {
  id: string
  localName: string
  category: string
  zone: string
  mallVisitors: number
  localVisitors: number
  captureRate: number
  comparisonCaptureRate: number
  captureVariationPp: number
  transactions: number
  internalConversion: number
  salesPerVisitor: number
}

export function buildTrafficAnalytics(
  client: Client,
  scope: string,
  periodId: PeriodId,
  compareMode: CompareMode,
) {
  const periodMeta = getPeriodMeta(periodId)
  const scopeMult = getScopeMultiplier(client, scope)
  const scale = periodMeta.multiplier * scopeMult
  const yearSpread = compareMode === "prev_year" ? 0.94 : 1

  const isOperator = client.id === "plaza"
  const visitors = Math.max(
    800,
    Math.round((isOperator ? 684320 : 94850) * scale),
  )
  const compVisitors = Math.max(
    750,
    Math.round((isOperator ? 648900 : 89200) * scale * yearSpread),
  )

  const transactions = Math.max(
    120,
    Math.round((isOperator ? 119072 : 18642) * scale),
  )
  const compTransactions = Math.max(
    100,
    Math.round((isOperator ? 108366 : 16948) * scale * yearSpread),
  )

  const netSales = Math.round((isOperator ? 3820450000 : 2148320000) * scale)
  const compNetSales = Math.round(
    (isOperator ? 3398900000 : 1911300000) * scale * yearSpread,
  )

  const conversionRate = Number(((transactions / visitors) * 100).toFixed(1))
  const compConversionRate = Number(
    ((compTransactions / compVisitors) * 100).toFixed(1),
  )
  const conversionDiffPp = Number(
    (conversionRate - compConversionRate).toFixed(1),
  )

  const salePerVisitor = Math.round(netSales / Math.max(1, visitors))
  const compSalePerVisitor = Math.round(
    compNetSales / Math.max(1, compVisitors),
  )

  const peakHourVisitors = Math.round(visitors * 0.138)
  const compPeakHourVisitors = Math.round(compVisitors * 0.132)

  const kpis = {
    visitors: {
      current: visitors,
      comparison: compVisitors,
      variation: calcVariationPercent(visitors, compVisitors),
    },
    conversion: {
      current: conversionRate,
      comparison: compConversionRate,
      variationPp: conversionDiffPp,
      variationPercent: calcVariationPercent(
        conversionRate,
        compConversionRate,
      ),
    },
    salePerVisitor: {
      current: salePerVisitor,
      comparison: compSalePerVisitor,
      variation: calcVariationPercent(salePerVisitor, compSalePerVisitor),
    },
    peakHour: {
      slot: "17:00 — 18:00",
      dayLabel: "Sábados y quincenas",
      visitors: peakHourVisitors,
      comparisonVisitors: compPeakHourVisitors,
      variation: calcVariationPercent(peakHourVisitors, compPeakHourVisitors),
    },
  }

  const rawCombined = [
    { label: "01/03", v: 36200, cv: 34100, conv: 16.2, cConv: 15.6 },
    { label: "04/03", v: 39400, cv: 37200, conv: 16.5, cConv: 15.8 },
    { label: "07/03", v: 46800, cv: 43900, conv: 17.1, cConv: 16.3 },
    { label: "10/03", v: 41200, cv: 39100, conv: 16.8, cConv: 16.1 },
    { label: "13/03", v: 44900, cv: 42100, conv: 17.3, cConv: 16.4 },
    { label: "15/03", v: 64800, cv: 58900, conv: 19.4, cConv: 18.1 },
    { label: "18/03", v: 43500, cv: 41200, conv: 17.0, cConv: 16.2 },
    { label: "21/03", v: 49200, cv: 46100, conv: 17.6, cConv: 16.8 },
    { label: "24/03", v: 55400, cv: 51300, conv: 18.2, cConv: 17.1 },
    { label: "27/03", v: 47100, cv: 44300, conv: 17.4, cConv: 16.6 },
    { label: "30/03", v: 68900, cv: 62400, conv: 19.8, cConv: 18.4 },
    { label: "31/03", v: 54100, cv: 49800, conv: 18.5, cConv: 17.3 },
  ]
  const vScale = visitors / 591500
  const combinedSeries = rawCombined.map((item) => {
    const vis = Math.round(item.v * vScale)
    const compVis = Math.round(item.cv * vScale * yearSpread)
    return {
      label: item.label,
      visitors: vis,
      comparisonVisitors: compVis,
      visitorsVariation: calcVariationPercent(vis, compVis),
      conversion: item.conv,
      comparisonConversion: item.cConv,
      conversionVariation: calcVariationPercent(item.conv, item.cConv),
    }
  })

  const orderedDays = getWeekDaysOrder(client.parameters.weekStartsOn)
  const dayWeights: Record<string, number> = {
    Lun: 0.74,
    Mar: 0.79,
    Mié: 0.86,
    Jue: 0.95,
    Vie: 1.28,
    Sáb: 1.56,
    Dom: 1.34,
  }
  const hourWeights: Record<string, number> = {
    "09:00": 0.28,
    "10:00": 0.45,
    "11:00": 0.69,
    "12:00": 1.05,
    "13:00": 1.18,
    "14:00": 1.02,
    "15:00": 1.12,
    "16:00": 1.32,
    "17:00": 1.58,
    "18:00": 1.49,
    "19:00": 1.22,
    "20:00": 0.78,
  }
  const baseCellVisitors = visitors / (7 * 12 * 4.1)
  const visitorsHeatmap: HeatmapCell[] = []
  orderedDays.forEach((day) => {
    commercialHours.forEach((hour) => {
      const dw = dayWeights[day] ?? 1
      const hw = hourWeights[hour] ?? 1
      const value = Math.max(12, Math.round(baseCellVisitors * dw * hw))
      const comp = Math.max(
        10,
        Math.round(value * (compareMode === "prev_year" ? 0.91 : 0.94)),
      )
      visitorsHeatmap.push({
        day,
        hour,
        value,
        comparison: comp,
        variation: calcVariationPercent(value, comp),
      })
    })
  })

  const gatesTraffic: GateTrafficItem[] = [
    {
      id: "gate-1",
      name: "Puerta 1 · Peatonal Av. Principal",
      zone: "Plazoleta Frontal Piso 1",
      type: "Peatonal",
      visitors: Math.round(visitors * 0.34),
      comparisonVisitors: Math.round(compVisitors * 0.33),
      variation: calcVariationPercent(
        Math.round(visitors * 0.34),
        Math.round(compVisitors * 0.33),
      ),
      share: 34,
    },
    {
      id: "gate-2",
      name: "Puerta 2 · Conexión Transporte Masivo",
      zone: "Pasillo Oriental Nivel Calle",
      type: "Transporte masivo",
      visitors: Math.round(visitors * 0.26),
      comparisonVisitors: Math.round(compVisitors * 0.25),
      variation: calcVariationPercent(
        Math.round(visitors * 0.26),
        Math.round(compVisitors * 0.25),
      ),
      share: 26,
    },
    {
      id: "gate-3",
      name: "Puerta 3 · Parqueadero Norte (Sótanos 1 y 2)",
      zone: "Lobby Ascensores Norte",
      type: "Vehicular",
      visitors: Math.round(visitors * 0.19),
      comparisonVisitors: Math.round(compVisitors * 0.198),
      variation: calcVariationPercent(
        Math.round(visitors * 0.19),
        Math.round(compVisitors * 0.198),
      ),
      share: 19,
    },
    {
      id: "gate-4",
      name: "Puerta 4 · Acceso Plazoleta Gastronómica",
      zone: "Terraza Comidas Piso 3",
      type: "Peatonal",
      visitors: Math.round(visitors * 0.13),
      comparisonVisitors: Math.round(compVisitors * 0.136),
      variation: calcVariationPercent(
        Math.round(visitors * 0.13),
        Math.round(compVisitors * 0.136),
      ),
      share: 13,
    },
    {
      id: "gate-5",
      name: "Puerta 5 · Parqueadero Sur y Valet",
      zone: "Zona Financiera y Servicios",
      type: "Vehicular",
      visitors: Math.round(visitors * 0.08),
      comparisonVisitors: Math.round(compVisitors * 0.086),
      variation: calcVariationPercent(
        Math.round(visitors * 0.08),
        Math.round(compVisitors * 0.086),
      ),
      share: 8,
    },
  ]

  const rawCaptureLocales = [
    {
      id: "cap-1",
      localName: "Crepes & Waffles · Plazoleta 301",
      category: "Gastronomía",
      zone: "Piso 3 · Plazoleta Central",
      captureRate: 14.8,
      compCapture: 13.9,
      internalConv: 38.4,
      spv: 18450,
    },
    {
      id: "cap-2",
      localName: "Arturo Calle · Local 104 (Ancla)",
      category: "Moda masculina",
      zone: "Piso 1 · Plaza Principal",
      captureRate: 12.4,
      compCapture: 11.6,
      internalConv: 21.8,
      spv: 26920,
    },
    {
      id: "cap-3",
      localName: "iShop · Local 102",
      category: "Tecnología",
      zone: "Piso 1 · Acceso Norte",
      captureRate: 11.2,
      compCapture: 10.5,
      internalConv: 12.6,
      spv: 31400,
    },
    {
      id: "cap-4",
      localName: "Vélez · Local 212",
      category: "Calzado y cuero",
      zone: "Piso 2 · Galería Moda",
      captureRate: 9.6,
      compCapture: 9.1,
      internalConv: 19.5,
      spv: 24180,
    },
    {
      id: "cap-5",
      localName: "Studio F · Local 118",
      category: "Moda femenina",
      zone: "Piso 1 · Pasillo Central",
      captureRate: 8.9,
      compCapture: 8.7,
      internalConv: 20.2,
      spv: 21750,
    },
    {
      id: "cap-6",
      localName: "Decathlon Urbano · Local 240",
      category: "Deportes",
      zone: "Piso 2 · Ampliación Norte",
      captureRate: 10.4,
      compCapture: 9.8,
      internalConv: 24.1,
      spv: 19600,
    },
  ]

  const localCaptureRates: LocalCaptureItem[] = rawCaptureLocales.map(
    (item) => {
      const localVisitors = Math.round((visitors * item.captureRate) / 100)
      const tx = Math.round((localVisitors * item.internalConv) / 100)
      return {
        id: item.id,
        localName: item.localName,
        category: item.category,
        zone: item.zone,
        mallVisitors: visitors,
        localVisitors,
        captureRate: item.captureRate,
        comparisonCaptureRate: item.compCapture,
        captureVariationPp: Number(
          (item.captureRate - item.compCapture).toFixed(1),
        ),
        transactions: tx,
        internalConversion: item.internalConv,
        salesPerVisitor: item.spv,
      }
    },
  )

  return {
    kpis,
    combinedSeries,
    visitorsHeatmap,
    gatesTraffic,
    localCaptureRates,
  }
}
