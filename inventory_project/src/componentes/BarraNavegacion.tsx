'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function BarraNavegacion() {
  const pathname = usePathname()
  const { data: sesion } = useSession()

  const enlaces = [
    { href: '/', etiqueta: 'Panel' },
    { href: '/productos', etiqueta: 'Productos' },
    { href: '/movimientos', etiqueta: 'Movimientos' },
    { href: '/categorias', etiqueta: 'Categorías' },
  ]

  const esActivo = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Inventarios
            </Link>
            <div className="ml-10 flex space-x-4">
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
          </div>
          <div className="flex items-center space-x-4">
            {sesion?.user && (
              <>
                <span className="text-sm text-blue-100">
                  Hola, {sesion.user.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-700 hover:bg-blue-800 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
