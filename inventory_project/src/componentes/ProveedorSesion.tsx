'use client'

import { NeonAuthUIProvider } from '@neondatabase/auth-ui'
import { authClient } from '@/lib/auth/client'
import { ReactNode } from 'react'

interface PropiedadesProveedor {
  children: ReactNode
}

export default function ProveedorSesion({ children }: PropiedadesProveedor) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      social={{ providers: ['google'] }}
      localization={{
        SIGN_IN: "Iniciar sesión",
        SIGN_UP: "Registrarse",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
