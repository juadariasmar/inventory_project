'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { UserButton } from '@neondatabase/auth-ui'

interface SubEnlace {
  href: string
  etiqueta: string
  visible: boolean
}

interface EnlaceSimple {
  tipo: 'enlace'
  href: string
  etiqueta: string
  visible: boolean
}

interface Dropdown {
  tipo: 'dropdown'
  id: string
  etiqueta: string
  visible: boolean
  items: SubEnlace[]
}

type Item = EnlaceSimple | Dropdown

export default function BarraNavegacion({ sesion }: { sesion: { user?: { rol?: string; permisos?: string[] } } | null }) {
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [dropdownAbierto, setDropdownAbierto] = useState<string | null>(null)
  const contenedorRef = useRef<HTMLDivElement>(null)

  const esAdmin = sesion?.user?.rol === 'ADMIN'
  const puedeVerAnalisis =
    esAdmin || (sesion?.user?.permisos?.includes('VER_ANALISIS') ?? false)
  const puedeVender =
    esAdmin ||
    (sesion?.user?.permisos?.includes('REALIZAR_VENTAS') ?? false) ||
    (sesion?.user?.permisos?.includes('REGISTRAR_MOVIMIENTOS') ?? false)

  // Definicion de la estructura de la barra. visible se evalua al render.
  const items: Item[] = [
    { tipo: 'enlace', href: '/', etiqueta: 'Panel', visible: true },
    {
      tipo: 'dropdown',
      id: 'ventas',
      etiqueta: 'Ventas',
      visible: puedeVender,
      items: [
        { href: '/venta-rapida', etiqueta: 'Nueva venta', visible: true },
        { href: '/ventas', etiqueta: 'Historial', visible: true },
        { href: '/cotizaciones', etiqueta: 'Cotizaciones', visible: true },
      ],
    },
    {
      tipo: 'dropdown',
      id: 'inventario',
      etiqueta: 'Inventario',
      visible: true,
      items: [
        { href: '/productos', etiqueta: 'Productos', visible: true },
        { href: '/movimientos', etiqueta: 'Movimientos', visible: true },
      ],
    },
    { tipo: 'enlace', href: '/analisis', etiqueta: 'Análisis', visible: puedeVerAnalisis },
    {
      tipo: 'dropdown',
      id: 'admin',
      etiqueta: 'Administración',
      visible: esAdmin,
      items: [
        { href: '/usuarios', etiqueta: 'Usuarios', visible: true },
        { href: '/auditoria', etiqueta: 'Auditoría', visible: true },
        { href: '/admin/configuracion', etiqueta: 'Configuración', visible: true },
      ],
    },
  ].filter((it) => it.visible) as Item[]

  // Cerrar dropdown al hacer clic fuera.
  useEffect(() => {
    if (!dropdownAbierto) return
    const onClicFuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setDropdownAbierto(null)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownAbierto(null)
    }
    document.addEventListener('mousedown', onClicFuera)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClicFuera)
      document.removeEventListener('keydown', onEscape)
    }
  }, [dropdownAbierto])

  // Cerrar dropdowns al navegar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDropdownAbierto(null)
  }, [pathname])

  const esActivo = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const seccionEsActiva = (items: SubEnlace[]) =>
    items.some((it) => esActivo(it.href))

  const cerrarMenu = () => {
    setMenuAbierto(false)
    setDropdownAbierto(null)
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div ref={contenedorRef} className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold" onClick={cerrarMenu}>
            Inventarios
          </Link>

          {/* Enlaces escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => {
              if (item.tipo === 'enlace') {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      esActivo(item.href)
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500'
                    }`}
                  >
                    {item.etiqueta}
                  </Link>
                )
              }
              // Dropdown
              const abierto = dropdownAbierto === item.id
              const activo = seccionEsActiva(item.items)
              return (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownAbierto(abierto ? null : item.id)}
                    aria-expanded={abierto}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                      activo
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500'
                    }`}
                  >
                    {item.etiqueta}
                    <span className={`text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {abierto && (
                    <div className="absolute left-0 top-full mt-1 min-w-[180px] bg-white text-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                      {item.items.filter((s) => s.visible).map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setDropdownAbierto(null)}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            esActivo(sub.href)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {sub.etiqueta}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mi cuenta (escritorio) */}
          <div className="hidden md:flex items-center">
            {sesion?.user && (
              <UserButton size="icon" />
            )}
          </div>

          {/* Botón hamburguesa (móvil) */}
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
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
        <div id="menu-movil" className="md:hidden border-t border-blue-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {items.map((item) => {
              if (item.tipo === 'enlace') {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={cerrarMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      esActivo(item.href)
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500'
                    }`}
                  >
                    {item.etiqueta}
                  </Link>
                )
              }
              return (
                <div key={item.id} className="pt-2">
                  <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
                    {item.etiqueta}
                  </div>
                  <div className="space-y-1">
                    {item.items.filter((s) => s.visible).map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={cerrarMenu}
                        className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                          esActivo(sub.href)
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-100 hover:bg-blue-500'
                        }`}
                      >
                        {sub.etiqueta}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {sesion?.user && (
            <div className="border-t border-blue-500 pt-3 pb-3 px-4 flex justify-center">
              <UserButton size="icon" />
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
