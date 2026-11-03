import type {
  Client,
  ClientId,
  HolidayItem,
  ModulePermissions,
  PageId,
  Plan,
  Role,
  RoleDefinition,
  TenantUser,
} from "../types"

export const colombianHolidays2025: HolidayItem[] = [
  {
    date: "01/01/2025",
    name: "Año Nuevo",
    type: "Fecha fija",
    enabled: true,
    impact: "Moderado",
  },
  {
    date: "06/01/2025",
    name: "Día de los Reyes Magos",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "24/03/2025",
    name: "Día de San José",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "17/04/2025",
    name: "Jueves Santo",
    type: "Religioso",
    enabled: true,
    impact: "Moderado",
  },
  {
    date: "18/04/2025",
    name: "Viernes Santo",
    type: "Religioso",
    enabled: true,
    impact: "Moderado",
  },
  {
    date: "01/05/2025",
    name: "Día del Trabajo",
    type: "Fecha fija",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "02/06/2025",
    name: "Ascensión del Señor",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "23/06/2025",
    name: "Corpus Christi",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "30/06/2025",
    name: "Sagrado Corazón de Jesús",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "20/07/2025",
    name: "Día de la Independencia",
    type: "Fecha fija",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "07/08/2025",
    name: "Batalla de Boyacá",
    type: "Fecha fija",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "18/08/2025",
    name: "Asunción de la Virgen",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "13/10/2025",
    name: "Día de la Raza",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Alto tráfico",
  },
  {
    date: "03/11/2025",
    name: "Todos los Santos",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "17/11/2025",
    name: "Independencia de Cartagena",
    type: "Ley Emiliani",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "08/12/2025",
    name: "Inmaculada Concepción (Velitas)",
    type: "Fecha fija",
    enabled: true,
    impact: "Pico comercial",
  },
  {
    date: "25/12/2025",
    name: "Navidad",
    type: "Fecha fija",
    enabled: true,
    impact: "Pico comercial",
  },
]

export const clients: Record<ClientId, Client> = {
  plaza: {
    id: "plaza",
    name: "Grupo Plaza Andina",
    shortName: "Plaza Andina",
    type: "operator",
    plan: "Avanzado",
    status: "Activo",
    city: "Bogotá, Medellín y Cali (3 CC)",
    color: "#0b4a5c",
    colorDark: "#083846",
    accent: "#e7eff2",
    secondaryColor: "#156d85",
    accentColor: "#e3b04b",
    initials: "PA",
    entityLabel: "local",
    entityLabelPlural: "locales",
    locations: 142,
    maxLocations: 180,
    maxUsers: 25,
    extraModules: [],
    integrationHealth: "Atención",
    scopeOptions: [
      "Todos los centros comerciales",
      "Plaza Andina Bogotá",
      "Plaza Andina Medellín",
      "Plaza Andina Cali",
    ],
    appearance: {
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
    },
    terminology: {
      storeSingular: "Local",
      storePlural: "Locales",
      mallSingular: "Centro comercial",
      mallPlural: "Centros comerciales",
      visitorsLabel: "Visitantes",
      transactionSingular: "Transacción",
      transactionPlural: "Transacciones",
    },
    parameters: {
      timezone: "America/Bogota",
      cutoffHour: "23:59",
      weekStartsOn: "Lunes",
      salesTaxMode: "sin_iva",
      ivaRate: 19,
      useColombianHolidays: true,
      markQuincenasAndPrimas: true,
      holidays: colombianHolidays2025,
    },
  },
  montana: {
    id: "montana",
    name: "Calzado Montaña",
    shortName: "Montaña",
    type: "brand",
    plan: "Profesional",
    status: "Activo",
    city: "8 ciudades DANE",
    color: "#0f766e",
    colorDark: "#115e59",
    accent: "#e1f4f1",
    secondaryColor: "#14b8a6",
    accentColor: "#f59e0b",
    initials: "CM",
    entityLabel: "tienda",
    entityLabelPlural: "tiendas",
    locations: 25,
    maxLocations: 35,
    maxUsers: 15,
    extraModules: [],
    integrationHealth: "Error",
    scopeOptions: [
      "Todas las tiendas",
      "Región Centro",
      "Región Antioquia",
      "Región Occidente",
      "Bogotá D.C.",
      "Medellín",
      "Cali",
    ],
    appearance: {
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
    },
    terminology: {
      storeSingular: "Tienda",
      storePlural: "Tiendas",
      mallSingular: "Centro comercial",
      mallPlural: "Centros comerciales",
      visitorsLabel: "Visitantes",
      transactionSingular: "Ticket",
      transactionPlural: "Tickets",
    },
    parameters: {
      timezone: "America/Bogota",
      cutoffHour: "22:30",
      weekStartsOn: "Lunes",
      salesTaxMode: "sin_iva",
      ivaRate: 19,
      useColombianHolidays: true,
      markQuincenasAndPrimas: true,
      holidays: colombianHolidays2025,
    },
  },
}

export const roleOptions: Record<ClientId, Role[]> = {
  plaza: ["Administrador", "Gerente", "Comercial", "Analista", "Lector"],
  montana: ["Administrador", "Gerente", "Analista", "Lector"],
}

export const planRank: Record<Plan, number> = {
  Esencial: 1,
  Profesional: 2,
  Avanzado: 3,
}

export const pagePlan: Partial<Record<PageId, Plan>> = {
  integraciones: "Esencial",
  inventario: "Profesional",
  productos: "Profesional",
  trafico: "Avanzado",
  comparativos: "Profesional",
  metas: "Profesional",
  alertas: "Avanzado",
}

export const moduleCatalog: Array<{
  id: PageId
  name: string
  description: string
  minPlan: Plan
  adminOnly?: boolean
}> = [
  {
    id: "inicio",
    name: "Inicio (Resumen ejecutivo)",
    description:
      "KPIs consolidados, evolución de ventas y desempeño por ubicación.",
    minPlan: "Esencial",
  },
  {
    id: "tiendas",
    name: "Tiendas / Locales",
    description:
      "Jerarquía física (CC/zona/local o región/ciudad DANE/tienda) y m².",
    minPlan: "Esencial",
  },
  {
    id: "integraciones",
    name: "Integraciones y calidad",
    description:
      "Asistente de conexión POS/contadores, mapeo de campos y monitor.",
    minPlan: "Esencial",
  },
  {
    id: "ventas",
    name: "Ventas",
    description:
      "Análisis de ventas con o sin IVA, tickets, horarios pico y quincenas.",
    minPlan: "Esencial",
  },
  {
    id: "reportes",
    name: "Reportes",
    description:
      "Descarga y programación de informes ejecutivos en PDF y Excel.",
    minPlan: "Esencial",
  },
  {
    id: "inventario",
    name: "Inventario",
    description:
      "Rotación de existencias, días de inventario y quiebres de stock.",
    minPlan: "Profesional",
  },
  {
    id: "productos",
    name: "Productos",
    description: "Curva ABC, margen y rendimiento por categoría, marca y SKU.",
    minPlan: "Profesional",
  },
  {
    id: "trafico",
    name: "Tráfico y conversión",
    description:
      "Cruce de sensores de visitantes/aforo con transacciones de POS.",
    minPlan: "Avanzado",
  },
  {
    id: "comparativos",
    name: "Comparativos (Same-Store Sales)",
    description: "Comparación justa entre periodos, ciudades DANE y formatos.",
    minPlan: "Profesional",
  },
  {
    id: "metas",
    name: "Metas y presupuestos",
    description:
      "Asignación de cuotas mensuales y seguimiento diario de cumplimiento.",
    minPlan: "Profesional",
  },
  {
    id: "alertas",
    name: "Alertas inteligentes",
    description:
      "Detección automática de caídas de conversión, anomalías POS y metas.",
    minPlan: "Avanzado",
  },
  {
    id: "usuarios",
    name: "Usuarios y roles",
    description:
      "Control de accesos, matriz de permisos, clonación de roles y 2FA.",
    minPlan: "Esencial",
    adminOnly: true,
  },
  {
    id: "configuracion",
    name: "Configuración (Marca blanca)",
    description:
      "Personalización de apariencia, dominio propio, terminología y parámetros.",
    minPlan: "Esencial",
    adminOnly: true,
  },
]

export const rolePages: Record<Role, PageId[] | "all"> = {
  Administrador: "all",
  Gerente: [
    "inicio",
    "tiendas",
    "ventas",
    "inventario",
    "productos",
    "trafico",
    "comparativos",
    "metas",
    "alertas",
    "reportes",
  ],
  Comercial: [
    "inicio",
    "tiendas",
    "ventas",
    "trafico",
    "comparativos",
    "metas",
    "reportes",
  ],
  Analista: [
    "inicio",
    "tiendas",
    "integraciones",
    "ventas",
    "inventario",
    "productos",
    "trafico",
    "comparativos",
    "metas",
    "alertas",
    "reportes",
  ],
  Lector: [
    "inicio",
    "tiendas",
    "ventas",
    "trafico",
    "comparativos",
    "reportes",
  ],
  "Super Admin": [
    "inicio",
    "tiendas",
    "integraciones",
    "ventas",
    "inventario",
    "productos",
    "trafico",
    "comparativos",
    "metas",
    "alertas",
    "reportes",
    "plataforma",
  ],
  Soporte: ["inicio", "integraciones", "plataforma"],
}

const fullPerm = (): ModulePermissions => ({
  ver: true,
  crear: true,
  editar: true,
  eliminar: true,
  exportar: true,
})

const editExportPerm = (): ModulePermissions => ({
  ver: true,
  crear: true,
  editar: true,
  eliminar: false,
  exportar: true,
})

const readExportPerm = (): ModulePermissions => ({
  ver: true,
  crear: false,
  editar: false,
  eliminar: false,
  exportar: true,
})

const readOnlyPerm = (): ModulePermissions => ({
  ver: true,
  crear: false,
  editar: false,
  eliminar: false,
  exportar: false,
})

const noPerm = (): ModulePermissions => ({
  ver: false,
  crear: false,
  editar: false,
  eliminar: false,
  exportar: false,
})

export function buildRoleDefinitions(
  clientId: ClientId,
  clientType: "operator" | "brand" = clientId === "plaza"
    ? "operator"
    : "brand",
): RoleDefinition[] {
  const base: RoleDefinition[] = [
    {
      id: "Administrador",
      name: "Administrador",
      description:
        "Control total del cliente, configuración de marca blanca, usuarios y roles.",
      isSystem: true,
      isAdminRole: true,
      defaultScope: "Todo el cliente",
      permissions: {
        inicio: fullPerm(),
        tiendas: fullPerm(),
        integraciones: fullPerm(),
        ventas: fullPerm(),
        inventario: fullPerm(),
        productos: fullPerm(),
        trafico: fullPerm(),
        comparativos: fullPerm(),
        metas: fullPerm(),
        alertas: fullPerm(),
        reportes: fullPerm(),
        usuarios: fullPerm(),
        configuracion: fullPerm(),
        plataforma: noPerm(),
      },
    },
    {
      id: "Gerente",
      name: "Gerente",
      description:
        clientType === "operator"
          ? "Gerente de centro comercial con gestión de metas, alertas y reportes."
          : "Gerente regional o de tienda con seguimiento comercial y operativo.",
      isSystem: true,
      defaultScope: "Por centro comercial / región",
      permissions: {
        inicio: readExportPerm(),
        tiendas: editExportPerm(),
        integraciones: noPerm(),
        ventas: readExportPerm(),
        inventario: readExportPerm(),
        productos: readExportPerm(),
        trafico: readExportPerm(),
        comparativos: readExportPerm(),
        metas: editExportPerm(),
        alertas: editExportPerm(),
        reportes: editExportPerm(),
        usuarios: noPerm(),
        configuracion: noPerm(),
        plataforma: noPerm(),
      },
    },
    {
      id: "Analista",
      name: "Analista",
      description:
        "Explora datos, audita integraciones, configura alertas y exporta reportes.",
      isSystem: true,
      defaultScope: "Todo el cliente",
      permissions: {
        inicio: readExportPerm(),
        tiendas: readExportPerm(),
        integraciones: editExportPerm(),
        ventas: readExportPerm(),
        inventario: readExportPerm(),
        productos: readExportPerm(),
        trafico: readExportPerm(),
        comparativos: readExportPerm(),
        metas: editExportPerm(),
        alertas: editExportPerm(),
        reportes: fullPerm(),
        usuarios: noPerm(),
        configuracion: noPerm(),
        plataforma: noPerm(),
      },
    },
    {
      id: "Lector",
      name: "Lector",
      description:
        "Consulta tableros ejecutivos e indicadores sin permisos de modificación.",
      isSystem: true,
      defaultScope: "Solo ubicaciones asignadas",
      permissions: {
        inicio: readOnlyPerm(),
        tiendas: readOnlyPerm(),
        integraciones: noPerm(),
        ventas: readOnlyPerm(),
        inventario: noPerm(),
        productos: noPerm(),
        trafico: readOnlyPerm(),
        comparativos: readOnlyPerm(),
        metas: noPerm(),
        alertas: noPerm(),
        reportes: readExportPerm(),
        usuarios: noPerm(),
        configuracion: noPerm(),
        plataforma: noPerm(),
      },
    },
  ]

  if (clientType === "operator") {
    base.splice(2, 0, {
      id: "Comercial",
      name: "Comercial",
      description:
        "Gestión de arrendamiento, canon, ocupación y ventas por m² de locales.",
      isSystem: true,
      onlyOperator: true,
      defaultScope: "Por centro comercial / región",
      permissions: {
        inicio: readExportPerm(),
        tiendas: editExportPerm(),
        integraciones: noPerm(),
        ventas: readExportPerm(),
        inventario: noPerm(),
        productos: noPerm(),
        trafico: readExportPerm(),
        comparativos: readExportPerm(),
        metas: editExportPerm(),
        alertas: noPerm(),
        reportes: readExportPerm(),
        usuarios: noPerm(),
        configuracion: noPerm(),
        plataforma: noPerm(),
      },
    })
  }

  return base
}

export const initialUsersByClient: Record<ClientId, TenantUser[]> = {
  plaza: [
    {
      id: "u-pa-1",
      name: "Laura Gómez Restrepo",
      email: "laura.gomez@plazaandina.com.co",
      role: "Administrador",
      scope: "Todos los centros comerciales",
      status: "Activo",
      lastAccess: "31/03/2025 08:42",
      twoFactor: true,
    },
    {
      id: "u-pa-2",
      name: "Carlos Andrés Mejía",
      email: "c.mejia@plazaandina.com.co",
      role: "Gerente",
      scope: "Plaza Andina Medellín (Antioquia)",
      status: "Activo",
      lastAccess: "31/03/2025 07:55",
      twoFactor: true,
    },
    {
      id: "u-pa-3",
      name: "Valentina Ospina Castro",
      email: "v.ospina@plazaandina.com.co",
      role: "Comercial",
      scope: "Plaza Andina Bogotá · Zona Moda",
      status: "Activo",
      lastAccess: "30/03/2025 18:14",
      twoFactor: true,
    },
    {
      id: "u-pa-4",
      name: "Santiago Pardo Beltrán",
      email: "s.pardo@plazaandina.com.co",
      role: "Analista",
      scope: "Todos los centros comerciales",
      status: "Activo",
      lastAccess: "31/03/2025 08:20",
      twoFactor: false,
    },
    {
      id: "u-pa-5",
      name: "Marcela Caicedo Lozano",
      email: "m.caicedo@plazaandina.com.co",
      role: "Lector",
      scope: "Plaza Andina Cali (Valle del Cauca)",
      status: "Invitación pendiente",
      lastAccess: "Sin ingresar",
      twoFactor: false,
    },
  ],
  montana: [
    {
      id: "u-cm-1",
      name: "Laura Gómez Restrepo",
      email: "l.gomez@calzadomontana.co",
      role: "Administrador",
      scope: "Todas las tiendas (25 ubicaciones)",
      status: "Activo",
      lastAccess: "31/03/2025 08:50",
      twoFactor: true,
    },
    {
      id: "u-cm-2",
      name: "Julián Arango Vélez",
      email: "j.arango@calzadomontana.co",
      role: "Gerente",
      scope: "Región Antioquia · Medellín y Envigado",
      status: "Activo",
      lastAccess: "31/03/2025 08:05",
      twoFactor: true,
    },
    {
      id: "u-cm-3",
      name: "Camila Serrano Duarte",
      email: "c.serrano@calzadomontana.co",
      role: "Analista",
      scope: "Todas las tiendas (25 ubicaciones)",
      status: "Activo",
      lastAccess: "30/03/2025 19:30",
      twoFactor: true,
    },
    {
      id: "u-cm-4",
      name: "Diego Fernando Ríos",
      email: "d.rios@calzadomontana.co",
      role: "Lector",
      scope: "Bogotá D.C. · Tiendas CC y Calle",
      status: "Activo",
      lastAccess: "29/03/2025 14:12",
      twoFactor: false,
    },
  ],
}

export const monthlySales = [
  { month: "Mar", sales: 3180, previous: 2940 },
  { month: "Abr", sales: 3010, previous: 2870 },
  { month: "May", sales: 3290, previous: 3060 },
  { month: "Jun", sales: 3960, previous: 3470 },
  { month: "Jul", sales: 3620, previous: 3310 },
  { month: "Ago", sales: 3510, previous: 3260 },
  { month: "Sep", sales: 3440, previous: 3200 },
  { month: "Oct", sales: 3710, previous: 3390 },
  { month: "Nov", sales: 4280, previous: 3740 },
  { month: "Dic", sales: 5890, previous: 4920 },
  { month: "Ene", sales: 3370, previous: 3150 },
  { month: "Feb", sales: 3460, previous: 3230 },
  { month: "Mar", sales: 3820, previous: 3180 },
]

export const dailySales = [
  { day: "1", sales: 108 },
  { day: "3", sales: 115 },
  { day: "5", sales: 122 },
  { day: "7", sales: 118 },
  { day: "9", sales: 130 },
  { day: "11", sales: 127 },
  { day: "13", sales: 148 },
  { day: "15", sales: 194 },
  { day: "17", sales: 142 },
  { day: "19", sales: 136 },
  { day: "21", sales: 149 },
  { day: "23", sales: 153 },
  { day: "25", sales: 146 },
  { day: "27", sales: 160 },
  { day: "29", sales: 214 },
  { day: "31", sales: 189 },
]

export const categorySales = [
  { name: "Moda", value: 38, color: "#0b4a5c" },
  { name: "Alimentos", value: 25, color: "#12a594" },
  { name: "Servicios", value: 16, color: "#f59e0b" },
  { name: "Hogar", value: 12, color: "#8b5cf6" },
  { name: "Otros", value: 9, color: "#cbd5e1" },
]

export const locationRows = [
  {
    name: "Plaza Andina Bogotá",
    city: "Bogotá D.C.",
    sales: "$ 1.584.300.000",
    trend: "+12,8%",
    conversion: "18,4%",
    status: "Sobre meta",
  },
  {
    name: "Plaza Andina Medellín",
    city: "Medellín, Antioquia",
    sales: "$ 1.267.850.000",
    trend: "+9,2%",
    conversion: "17,1%",
    status: "Sobre meta",
  },
  {
    name: "Plaza Andina Cali",
    city: "Cali, Valle del Cauca",
    sales: "$ 967.920.000",
    trend: "+5,1%",
    conversion: "15,8%",
    status: "En línea",
  },
]

export const integrationItems = [
  {
    name: "Siesa Enterprise",
    kind: "POS · Ventas",
    scope: "142 locales",
    status: "Conectado",
    sync: "Hoy, 08:42",
    quality: 98,
  },
  {
    name: "Footfall Vision",
    kind: "Contador de personas",
    scope: "3 centros comerciales",
    status: "Conectado",
    sync: "Hoy, 08:35",
    quality: 96,
  },
  {
    name: "SAP Business One",
    kind: "Inventario",
    scope: "87 locales",
    status: "Atención",
    sync: "Ayer, 23:10",
    quality: 83,
  },
]

export const montanaIntegrations = [
  {
    name: "Vendty",
    kind: "POS · Ventas",
    scope: "25 tiendas",
    status: "Conectado",
    sync: "Hoy, 08:47",
    quality: 99,
  },
  {
    name: "CSV automático",
    kind: "Inventario",
    scope: "25 tiendas",
    status: "Conectado",
    sync: "Hoy, 06:00",
    quality: 94,
  },
]
