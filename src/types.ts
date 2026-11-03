export type ClientId = string
export type Plan = "Esencial" | "Profesional" | "Avanzado"
export type Role = string

export type GoogleFontId = "Inter" | "DM Sans" | "Plus Jakarta Sans" | "Manrope" | "Outfit" | "IBM Plex Sans"

export type LogoVariant = "monogram" | "emblem" | "horizontal" | "minimal" | "custom"

export type FaviconVariant = "rounded" | "circle" | "shield" | "outline" | "custom"

export type AppearanceConfig = {
  productName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: GoogleFontId
  logoLight: LogoVariant
  logoDark: LogoVariant
  favicon: FaviconVariant
  customLogoLightUrl?: string
  customLogoDarkUrl?: string
  customFaviconUrl?: string
  subdomain: string
  customDomain: string
  dnsVerified: boolean
}

export type TerminologyConfig = {
  storeSingular: string
  storePlural: string
  mallSingular: string
  mallPlural: string
  visitorsLabel: string
  transactionSingular: string
  transactionPlural: string
}

export type HolidayItem = {
  date: string
  name: string
  type: "Ley Emiliani" | "Fecha fija" | "Religioso"
  enabled: boolean
  impact: "Alto tráfico" | "Moderado" | "Pico comercial"
}

export type ParametersConfig = {
  timezone: string
  cutoffHour: string
  weekStartsOn: "Lunes" | "Domingo"
  salesTaxMode: "sin_iva" | "con_iva"
  ivaRate: number
  useColombianHolidays: boolean
  markQuincenasAndPrimas: boolean
  holidays: HolidayItem[]
}

export type Client = {
  id: ClientId
  name: string
  shortName: string
  type: "operator" | "brand"
  plan: Plan
  status: "Activo" | "Suspendido"
  city: string
  color: string
  colorDark: string
  accent: string
  secondaryColor: string
  accentColor: string
  initials: string
  entityLabel: string
  entityLabelPlural: string
  locations: number
  maxLocations: number
  maxUsers: number
  extraModules: PageId[]
  integrationHealth: "Conectado" | "Atención" | "Error"
  scopeOptions: string[]
  appearance: AppearanceConfig
  terminology: TerminologyConfig
  parameters: ParametersConfig
}

export type PageId = "inicio" | "tiendas" | "integraciones" | "ventas" | "inventario" | "productos" | "trafico" | "comparativos" | "metas" | "alertas" | "reportes" | "usuarios" | "configuracion" | "plataforma"

export type IntegrationStatus = "Conectado" | "Atención" | "Pendiente"

export type PermissionAction = "ver" | "crear" | "editar" | "eliminar" | "exportar"

export type ModulePermissions = Record<PermissionAction, boolean>

export type DataScopeLevel = "Todo el cliente" | "Por centro comercial / región" | "Por ciudad (DANE)" | "Solo ubicaciones asignadas"

export type RoleDefinition = {
  id: string
  name: string
  description: string
  isSystem?: boolean
  isAdminRole?: boolean
  onlyOperator?: boolean
  defaultScope: DataScopeLevel
  permissions: Record<PageId, ModulePermissions>
}

export type UserStatus = "Activo" | "Invitación pendiente" | "Suspendido"

export type TenantUser = {
  id: string
  name: string
  email: string
  role: string
  scope: string
  status: UserStatus
  lastAccess: string
  twoFactor: boolean
}

export type CompareMode = "prev_period" | "prev_year"

export type PeriodId = "mar_2025" | "feb_2025" | "dic_2024" | "q1_2025" | "ult_13m"

export type GlobalFilters = {
  scope: string
  periodId: PeriodId
  compareMode: CompareMode
}

export type ModuleDataState = "ready" | "loading" | "empty" | "error"

export type PlatformIntegrationStatus = "Error" | "Atención" | "Conectado"

export type PlatformIntegrationSource = {
  id: string
  clientId: ClientId
  clientName: string
  clientColor: string
  clientInitials: string
  connectorName: string
  kind: "POS · Ventas" | "Contador de personas" | "Inventario" | "Catálogo ERP"
  scope: string
  status: PlatformIntegrationStatus
  lastSync: string
  quality: number
  latencyMs: number
  records24h: number
  diagnostic: string
  errorDetail?: string
}

export type PlatformAuditCategory = "soporte" | "cliente" | "plan" | "integracion" | "seguridad"

export type PlatformAuditEntry = {
  id: string
  timestamp: string
  actorEmail: string
  actorRole: string
  clientName: string
  clientId?: ClientId
  action: string
  targetObject: string
  category: PlatformAuditCategory
}
