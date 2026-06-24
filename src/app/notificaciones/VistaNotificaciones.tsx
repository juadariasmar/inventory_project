'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Package, AlertTriangle, Clock, UserPlus, Users } from 'lucide-react'

const ICONOS: Record<string, React.ReactNode> = {
  STOCK_BAJO: <Package className="w-5 h-5 text-yellow-500" />,
  STOCK_CRITICO: <AlertTriangle className="w-5 h-5 text-red-500" />,
  COTIZACION_POR_VENCER: <Clock className="w-5 h-5 text-orange-500" />,
  PRODUCTO_SIN_MOVIMIENTO: <Package className="w-5 h-5 text-gray-400" />,
  INVITACION_ACEPTADA: <UserPlus className="w-5 h-5 text-emerald-500" />,
  USUARIO_REGISTRADO: <Users className="w-5 h-5 text-blue-500" />,
}

interface Notificacion {
  id: number
  tipo: string
  titulo: string
  mensaje: string | null
  link: string | null
  leida: boolean
  creadoEn: string
}

export default function VistaNotificaciones({ empresaId }: { empresaId: string }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    fetch('/api/notificaciones')
      .then((r) => r.json())
      .then((data) => { setNotificaciones(data as Notificacion[]); setCargando(false) })
      .catch(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const marcarLeida = async (id: number) => {
    await fetch(`/api/notificaciones/${id}`, { method: 'PATCH' })
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    )
  }

  const marcarTodas = async () => {
    await fetch('/api/notificaciones/marcar-todas', { method: 'POST' })
    cargar()
  }

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando notificaciones...</p>
  }

  return (
    <>
      {notificaciones.length > 0 && notificaciones.some((n) => !n.leida) && (
        <button
          type="button"
          onClick={marcarTodas}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
        </button>
      )}

      <section className="space-y-3">
        {notificaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No tienes notificaciones.</p>
          </div>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-lg shadow-sm border p-4 flex items-start gap-3 transition-colors ${n.leida ? 'opacity-60' : 'border-l-4 border-l-primary'}`}
            >
              <div className="mt-0.5">{ICONOS[n.tipo] ?? <Bell className="w-5 h-5 text-gray-400" />}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                {n.mensaje && <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.creadoEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link href={n.link} className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap">
                    Ver más
                  </Link>
                )}
                {!n.leida && (
                  <button
                    type="button"
                    onClick={() => marcarLeida(n.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  )
}
