import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  Download,
  Footprints,
  ReceiptText,
  ShoppingCart,
  Sparkles,
} from "lucide-react"
import {
  categorySales,
  dailySales,
  locationRows,
  monthlySales,
} from "../data/demo"
import type { Client } from "../types"
import { KpiCard } from "../components/KpiCard"

export function DashboardPage({ client }: { client: Client }) {
  const [chartMode, setChartMode] = useState<"Meses" | "Días">("Meses")
  const chartData =
    chartMode === "Meses"
      ? monthlySales.map((item) => ({ label: item.month, sales: item.sales }))
      : dailySales.map((item) => ({ label: item.day, sales: item.sales }))
  const brandClient = client.type === "brand"
  const terms = client.terminology
  const conIva = client.parameters.salesTaxMode === "con_iva"
  const salesLabel = conIva
    ? "Ventas brutas (con IVA)"
    : "Ventas netas (sin IVA)"
  const mainSalesValue = brandClient
    ? conIva
      ? "$ 2.556 M"
      : "$ 2.148 M"
    : conIva
      ? "$ 4.546 M"
      : "$ 3.820 M"

  const rows = brandClient
    ? [
        {
          name: "Unicentro Bogotá",
          city: "Bogotá D.C.",
          sales: "$ 268.400.000",
          trend: "+14,6%",
          conversion: "21,3%",
          status: "Sobre meta",
        },
        {
          name: "El Tesoro",
          city: "Medellín, Antioquia",
          sales: "$ 221.180.000",
          trend: "+11,2%",
          conversion: "19,8%",
          status: "Sobre meta",
        },
        {
          name: "Chipichape",
          city: "Cali, Valle del Cauca",
          sales: "$ 189.720.000",
          trend: "+7,9%",
          conversion: "18,1%",
          status: "En línea",
        },
      ]
    : locationRows

  return (
    <div className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
            <Sparkles className="size-3.5" /> Resumen actualizado hace 8 minutos
          </p>
          <h1 className="page-title">Buenos días, Laura</h1>
          <p className="page-subtitle">
            Este es el desempeño de {client.name} en marzo.
          </p>
        </div>
        <button className="secondary-button">
          <Download className="size-4" /> Exportar resumen
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={salesLabel}
          value={mainSalesValue}
          change="+12,4%"
          detail="vs. feb. 2025"
          icon={Banknote}
        />
        <KpiCard
          label={
            brandClient
              ? terms.transactionPlural
              : `Ventas por m² (${terms.storePlural.toLowerCase()})`
          }
          value={brandClient ? "18.642" : "$ 428.600"}
          change="+8,7%"
          detail="vs. periodo anterior"
          icon={ShoppingCart}
        />
        <KpiCard
          label={
            brandClient
              ? `${terms.transactionSingular} promedio`
              : `${terms.visitorsLabel} totales`
          }
          value={brandClient ? "$ 115.225" : "684.320"}
          change="+5,1%"
          detail="vs. periodo anterior"
          icon={brandClient ? ReceiptText : Footprints}
        />
        <KpiCard
          label="Conversión"
          value={brandClient ? "19,6%" : "17,4%"}
          change="+1,3 pp"
          detail="vs. periodo anterior"
          icon={ReceiptText}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_.75fr]">
        <section className="card min-w-0 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Evolución de ventas</h2>
              <p className="section-subtitle">
                Ventas netas · valores en millones de COP
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-1">
              {(["Meses", "Días"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${
                    chartMode === mode
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[285px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={client.color}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="100%"
                      stopColor={client.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#edf0f4"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip
                  formatter={(value) => [
                    `$ ${Number(value)} millones`,
                    "Ventas",
                  ]}
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 8px 20px rgba(15,23,42,.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={client.color}
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  activeDot={{
                    r: 5,
                    fill: client.color,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div>
            <h2 className="section-title">Ventas por categoría</h2>
            <p className="section-subtitle">Participación sobre el total</p>
          </div>
          <div className="relative mx-auto h-[185px] max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={index === 0 ? client.color : entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <strong className="text-xl text-slate-900">100%</strong>
              <span className="text-[10px] text-slate-400">ventas</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {categorySales.map((item, index) => (
              <div key={item.name} className="flex items-center text-xs">
                <span
                  className="mr-2 size-2 rounded-full"
                  style={{
                    background: index === 0 ? client.color : item.color,
                  }}
                />
                <span className="flex-1 text-slate-500">{item.name}</span>
                <span className="font-bold text-slate-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="section-title">
              Desempeño por{" "}
              {client.type === "operator"
                ? terms.mallSingular.toLowerCase()
                : terms.storeSingular.toLowerCase()}
            </h2>
            <p className="section-subtitle">
              Ordenado por {salesLabel.toLowerCase()} del periodo
            </p>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold text-[var(--brand)]">
            Ver análisis completo <ArrowRight className="size-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  {client.type === "operator"
                    ? terms.mallSingular
                    : terms.storeSingular}
                </th>
                <th>{salesLabel}</th>
                <th>Variación</th>
                <th>Conversión</th>
                <th>Estado de meta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.city}</span>
                  </td>
                  <td className="font-semibold text-slate-700">{row.sales}</td>
                  <td>
                    <span className="font-bold text-emerald-600">
                      {row.trend}
                    </span>
                  </td>
                  <td>{row.conversion}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        row.status === "Sobre meta"
                          ? "status-green"
                          : "status-blue"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button className="text-slate-400">
                      <ChevronDown className="-rotate-90 size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <CalendarDays className="size-4 shrink-0" />
        <span>
          <strong>Dato útil:</strong> el pico del 15 de marzo coincide con la
          quincena. Las ventas fueron 31% superiores al promedio diario.
        </span>
      </div>
    </div>
  )
}
