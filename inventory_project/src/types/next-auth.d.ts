import 'next-auth'
import { Rol, Permiso } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      rol: Rol
      permisos: Permiso[]
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    rol: Rol
    permisos: Permiso[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: Rol
    permisos: Permiso[]
  }
}
