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
