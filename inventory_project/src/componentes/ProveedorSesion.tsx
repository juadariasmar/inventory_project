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
        signIn: "Iniciar sesión",
        signUp: "Registrarse",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
