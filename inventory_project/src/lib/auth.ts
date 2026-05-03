import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const opcionesAuth: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        nombreUsuario: { label: 'Usuario', type: 'text' },
        contrasena: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credenciales) {
        if (!credenciales?.nombreUsuario || !credenciales?.contrasena) {
          return null
        }

        const usuario = await prisma.usuario.findUnique({
          where: { nombreUsuario: credenciales.nombreUsuario }
        })

        if (!usuario) {
          return null
        }

        const contrasenaValida = await bcrypt.compare(
          credenciales.contrasena,
          usuario.contrasena
        )

        if (!contrasenaValida) {
          return null
        }

        return {
          id: usuario.id.toString(),
          name: usuario.nombre,
          email: usuario.nombreUsuario
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
