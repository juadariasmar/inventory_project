'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface PropiedadesProveedor {
  children: ReactNode
}

export default function ProveedorSesion({ children }: PropiedadesProveedor) {
  return <SessionProvider>{children}</SessionProvider>
}
