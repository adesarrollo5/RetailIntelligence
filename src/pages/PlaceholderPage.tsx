import {
  ArrowRight,
  BarChart3,
  CirclePlus,
  Download,
  Search,
} from "lucide-react"
import type { Client, PageId } from "../types"

const labels: Record<PageId, {
  title: string
  desc: string
}> = {
  inicio: { title: "Inicio", desc: "" },
  tiendas: {
    title: "Tiendas",
    desc: "Administre su estructura y consulte el desempeño de cada ubicación.",
  },
  integraciones: { title: "Integraciones", desc: "" },
  ventas: {
    title: "Ventas",
    desc: "Analice ventas netas, transacciones y ticket promedio.",
  },
  inventario: {
    title: "Inventario",
    desc: "Monitoree existencias, rotación y disponibilidad.",
  },
  productos: {
    title: "Productos",
    desc: "Explore el desempeño por categoría, marca y referencia.",
  },
  trafico: {
    title: "Tráfico y conversión",
    desc: "Conecte afluencia con transacciones y ventas.",
  },
  comparativos: {
    title: "Comparativos",
    desc: "Compare periodos, regiones y ubicaciones.",
  },
  metas: { title: "Metas", desc: "Defina objetivos y siga su cumplimiento." },
  alertas: {
    title: "Alertas",
    desc: "Gestione reglas y eventos que requieren atención.",
  },
  reportes: {
    title: "Reportes",
    desc: "Programe y descargue informes para su equipo.",
  },
  usuarios: {
    title: "Usuarios y roles",
    desc: "Controle accesos, permisos y alcance de datos.",
  },
  configuracion: {
    title: "Configuración",
    desc: "Personalice marca, terminología y preferencias.",
  },
  plataforma: {
    title: "Consola de plataforma",
    desc: "Supervise clientes, planes y salud de la plataforma.",
  },
}

export function PlaceholderPage({
  page,
  client,
}: {
  page: PageId
  client: Client
}) {
  const meta = labels[page]
  const dynamicTitle =
    page === "tiendas"
      ? client.terminology.storePlural
      : page === "trafico"
        ? `${client.terminology.visitorsLabel} y conversión`
        : meta.title

  return (
    <div className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{dynamicTitle}</h1>
          <p className="page-subtitle">{meta.desc}</p>
        </div>
        <button className="primary-button">
          <CirclePlus className="size-4" /> Crear nuevo
        </button>
      </div>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="field h-10 pl-9"
              placeholder={`Buscar en ${dynamicTitle.toLowerCase()}`}
            />
          </div>
          <button className="secondary-button">
            <Download className="size-4" /> Exportar
          </button>
        </div>
        <div className="grid min-h-[390px] place-items-center p-8 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <BarChart3 className="size-6" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {dynamicTitle} de {client.shortName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Este módulo está habilitado en el plan {client.plan}. La vista
              detallada conservará el alcance de datos y los permisos de su rol.
            </p>
            <button className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--brand)]">
              Explorar funcionalidad <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
