'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function BarraNavegacion() {
  const pathname = usePathname()
  const { data: sesion } = useSession()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const esAdmin = sesion?.user?.rol === 'ADMIN'
  const puedeVerAnalisis =
    esAdmin || (sesion?.user?.permisos?.includes('VER_ANALISIS') ?? false)
  const puedeVender =
    esAdmin ||
    (sesion?.user?.permisos?.includes('REALIZAR_VENTAS') ?? false) ||
    (sesion?.user?.permisos?.includes('REGISTRAR_MOVIMIENTOS') ?? false)

  const enlaces = [
    { href: '/', etiqueta: 'Panel', visible: true },
    { href: '/venta-rapida', etiqueta: 'Venta rápida', visible: puedeVender },
    { href: '/ventas', etiqueta: 'Historial ventas', visible: puedeVender },
    { href: '/productos', etiqueta: 'Productos', visible: true },
    { href: '/movimientos', etiqueta: 'Movimientos', visible: true },
    { href: '/categorias', etiqueta: 'Categorías', visible: true },
    { href: '/analisis', etiqueta: 'Análisis', visible: puedeVerAnalisis },
    { href: '/usuarios', etiqueta: 'Usuarios', visible: esAdmin },
    { href: '/auditoria', etiqueta: 'Auditoría', visible: esAdmin },
  ].filter((e) => e.visible)

  const esActivo = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold" onClick={cerrarMenu}>
            Inventarios
          </Link>

          {/* Enlaces escritorio */}
          <div className="hidden lg:flex items-center space-x-1">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  esActivo(enlace.href)
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500'
                }`}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>

          {/* Lado derecho: usuario y cerrar sesión (escritorio) */}
          <div className="hidden lg:flex items-center space-x-3">
            {sesion?.user && (
              <>
                <span className="text-sm text-blue-100">
                  {sesion.user.name}
                  {esAdmin && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-800 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-800 transition-colors"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>

          {/* Botón hamburguesa (móvil) */}
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
            aria-controls="menu-movil"
            aria-expanded={menuAbierto}
            aria-label="Abrir menú"
          >
            {menuAbierto ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil colapsable */}
      {menuAbierto && (
        <div id="menu-movil" className="lg:hidden border-t border-blue-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={cerrarMenu}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  esActivo(enlace.href)
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500'
                }`}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
          {sesion?.user && (
            <div className="border-t border-blue-500 pt-3 pb-3 px-4 space-y-2">
              <div className="text-sm text-blue-100">
                {sesion.user.name}
                {esAdmin && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-800 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  cerrarMenu()
                  signOut({ callbackUrl: '/login' })
                }}
                className="w-full px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-800 transition-colors text-left"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
