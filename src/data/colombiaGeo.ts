export type Department = { code: string; name: string }
export type Municipality = {
  code: string
  deptCode: string
  name: string
  lat: number
  lng: number
}

export const departments: Department[] = [
  { code: "05", name: "Antioquia" },
  { code: "08", name: "Atlántico" },
  { code: "11", name: "Bogotá D.C." },
  { code: "13", name: "Bolívar" },
  { code: "15", name: "Boyacá" },
  { code: "17", name: "Caldas" },
  { code: "19", name: "Cauca" },
  { code: "20", name: "Cesar" },
  { code: "23", name: "Córdoba" },
  { code: "25", name: "Cundinamarca" },
  { code: "41", name: "Huila" },
  { code: "47", name: "Magdalena" },
  { code: "50", name: "Meta" },
  { code: "52", name: "Nariño" },
  { code: "54", name: "Norte de Santander" },
  { code: "63", name: "Quindío" },
  { code: "66", name: "Risaralda" },
  { code: "68", name: "Santander" },
  { code: "73", name: "Tolima" },
  { code: "76", name: "Valle del Cauca" },
]

export const municipalities: Municipality[] = [
  { code: "05001", deptCode: "05", name: "Medellín", lat: 6.244, lng: -75.581 },
  { code: "05088", deptCode: "05", name: "Bello", lat: 6.338, lng: -75.558 },
  { code: "05266", deptCode: "05", name: "Envigado", lat: 6.171, lng: -75.583 },
  { code: "05360", deptCode: "05", name: "Itagüí", lat: 6.185, lng: -75.599 },
  { code: "05615", deptCode: "05", name: "Rionegro", lat: 6.155, lng: -75.374 },
  {
    code: "08001",
    deptCode: "08",
    name: "Barranquilla",
    lat: 10.964,
    lng: -74.796,
  },
  { code: "08758", deptCode: "08", name: "Soledad", lat: 10.918, lng: -74.765 },
  {
    code: "11001",
    deptCode: "11",
    name: "Bogotá D.C.",
    lat: 4.711,
    lng: -74.072,
  },
  {
    code: "13001",
    deptCode: "13",
    name: "Cartagena de Indias",
    lat: 10.391,
    lng: -75.479,
  },
  { code: "15001", deptCode: "15", name: "Tunja", lat: 5.535, lng: -73.367 },
  { code: "17001", deptCode: "17", name: "Manizales", lat: 5.07, lng: -75.514 },
  { code: "19001", deptCode: "19", name: "Popayán", lat: 2.444, lng: -76.614 },
  {
    code: "20001",
    deptCode: "20",
    name: "Valledupar",
    lat: 10.477,
    lng: -73.253,
  },
  { code: "23001", deptCode: "23", name: "Montería", lat: 8.748, lng: -75.881 },
  { code: "25175", deptCode: "25", name: "Chía", lat: 4.858, lng: -74.058 },
  { code: "25473", deptCode: "25", name: "Mosquera", lat: 4.706, lng: -74.23 },
  { code: "25754", deptCode: "25", name: "Soacha", lat: 4.579, lng: -74.217 },
  {
    code: "25899",
    deptCode: "25",
    name: "Zipaquirá",
    lat: 5.022,
    lng: -74.004,
  },
  { code: "41001", deptCode: "41", name: "Neiva", lat: 2.927, lng: -75.282 },
  {
    code: "47001",
    deptCode: "47",
    name: "Santa Marta",
    lat: 11.241,
    lng: -74.199,
  },
  {
    code: "50001",
    deptCode: "50",
    name: "Villavicencio",
    lat: 4.142,
    lng: -73.627,
  },
  { code: "52001", deptCode: "52", name: "Pasto", lat: 1.214, lng: -77.281 },
  { code: "54001", deptCode: "54", name: "Cúcuta", lat: 7.894, lng: -72.507 },
  { code: "63001", deptCode: "63", name: "Armenia", lat: 4.534, lng: -75.681 },
  { code: "66001", deptCode: "66", name: "Pereira", lat: 4.813, lng: -75.696 },
  {
    code: "68001",
    deptCode: "68",
    name: "Bucaramanga",
    lat: 7.119,
    lng: -73.123,
  },
  {
    code: "68276",
    deptCode: "68",
    name: "Floridablanca",
    lat: 7.062,
    lng: -73.086,
  },
  { code: "73001", deptCode: "73", name: "Ibagué", lat: 4.438, lng: -75.232 },
  { code: "76001", deptCode: "76", name: "Cali", lat: 3.452, lng: -76.532 },
  { code: "76364", deptCode: "76", name: "Jamundí", lat: 3.26, lng: -76.54 },
  { code: "76520", deptCode: "76", name: "Palmira", lat: 3.539, lng: -76.303 },
  { code: "76892", deptCode: "76", name: "Yumbo", lat: 3.585, lng: -76.495 },
]

export const getDepartment = (code: string) =>
  departments.find((d) => d.code === code)

export const getMunicipality = (code: string) =>
  municipalities.find((m) => m.code === code)

export const municipalitiesOf = (deptCode: string) =>
  municipalities.filter((m) => m.deptCode === deptCode)

/** Distancia aproximada (km) entre dos coordenadas — fórmula de Haversine. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/* ----------------------- Mapa SVG simplificado ----------------------- */

export const MAP_W = 520
export const MAP_H = 715
const MAP_K = 41
const LNG0 = -79.2
const LAT0 = 13

export function project(lat: number, lng: number): { x: number; y: number } {
  return { x: (lng - LNG0) * MAP_K, y: (LAT0 - lat) * MAP_K }
}

/** Contorno continental simplificado (lng, lat), sentido horario. */
const outline: Array<[number, number]> = [
  [-71.33, 11.85],
  [-71.67, 12.46],
  [-72.2, 12.2],
  [-72.9, 11.55],
  [-73.6, 11.3],
  [-74.2, 11.25],
  [-74.85, 11.05],
  [-75.55, 10.4],
  [-75.8, 9.7],
  [-76.35, 8.75],
  [-76.85, 8.1],
  [-77.35, 8.67],
  [-77.5, 7.0],
  [-77.9, 6.2],
  [-77.45, 5.2],
  [-77.35, 4.2],
  [-77.1, 3.85],
  [-78.2, 2.5],
  [-78.85, 1.75],
  [-78.85, 1.4],
  [-77.9, 0.85],
  [-77.0, 0.35],
  [-75.5, -0.1],
  [-74.3, -0.95],
  [-73.2, -1.9],
  [-72.0, -2.4],
  [-70.6, -2.6],
  [-70.05, -4.2],
  [-69.95, -4.23],
  [-69.4, -1.1],
  [-69.8, 0.9],
  [-68.2, 1.7],
  [-67.1, 1.8],
  [-67.0, 2.2],
  [-67.6, 2.8],
  [-67.3, 3.5],
  [-67.8, 4.3],
  [-67.5, 5.5],
  [-67.85, 6.2],
  [-69.4, 6.1],
  [-70.1, 6.95],
  [-72.0, 7.05],
  [-72.4, 7.4],
  [-72.5, 8.4],
  [-73.0, 9.2],
  [-72.8, 9.9],
  [-72.15, 11.0],
  [-71.9, 11.45],
]

export const colombiaOutlinePath =
  outline
    .map(([lng, lat], i) => {
      const p = project(lat, lng)
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })
    .join(" ") + " Z"

/** Regiones naturales con etiqueta aproximada para dar contexto al mapa. */
export const mapContextLabels: Array<{
  text: string
  lat: number
  lng: number
}> = [
  { text: "Mar Caribe", lat: 12.1, lng: -75.6 },
  { text: "Océano Pacífico", lat: 4.6, lng: -78.6 },
  { text: "Venezuela", lat: 6.5, lng: -68.4 },
  { text: "Ecuador", lat: 0.0, lng: -78.2 },
  { text: "Perú", lat: -2.2, lng: -73.8 },
  { text: "Brasil", lat: -1.0, lng: -68.0 },
  { text: "Panamá", lat: 8.5, lng: -78.2 },
]
