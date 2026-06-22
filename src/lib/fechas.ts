// Helpers de formato de fecha en zona horaria de Colombia.
// Necesario porque el servidor (Vercel) corre en UTC y, sin timeZone explicito,
// toLocale* formatea en UTC y se ven horas adelantadas 5 h respecto a la realidad.

const LOCALE = 'es-MX'
const ZONA = 'America/Bogota'

export function formatearFechaHora(fecha: Date | string): string {
  return new Date(fecha).toLocaleString(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: ZONA,
  })
}

export function formatearFecha(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString(LOCALE, {
    timeZone: ZONA,
  })
}

export function formatearHora(fecha: Date | string): string {
  return new Date(fecha).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA,
  })
}

// Formato relativo: "hoy", "ayer", "hace 3 días", "hace 2 meses", etc.
// Util para mostrar antiguedad sin obligar al usuario a calcular.
export function formatearAntiguedad(fecha: Date | string, ahora: Date = new Date()): string {
  const d = new Date(fecha)
  const diffMs = ahora.getTime() - d.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDias <= 0) return 'hoy'
  if (diffDias === 1) return 'ayer'
  if (diffDias < 7) return `hace ${diffDias} días`
  if (diffDias < 30) {
    const semanas = Math.floor(diffDias / 7)
    return `hace ${semanas} semana${semanas !== 1 ? 's' : ''}`
  }
  if (diffDias < 365) {
    const meses = Math.floor(diffDias / 30)
    return `hace ${meses} mes${meses !== 1 ? 'es' : ''}`
  }
  const anios = Math.floor(diffDias / 365)
  return `hace ${anios} año${anios !== 1 ? 's' : ''}`
}

// Cuantos dias han pasado desde la fecha (entero, sin signo).
export function diasDesde(fecha: Date | string, ahora: Date = new Date()): number {
  const d = new Date(fecha)
  const diffMs = ahora.getTime() - d.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
