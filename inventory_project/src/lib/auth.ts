import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { registrarAuditoria } from './auditoria'

function extraerIpDeHeaders(headers: Record<string, string> | undefined): string | null {
  if (!headers) return null
  const fwd = headers['x-forwarded-for']
  if (fwd) return fwd.split(',')[0].trim()
  return headers['x-real-ip'] || null
}

export const opcionesAuth: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        nombreUsuario: { label: 'Usuario', type: 'text' },
        contrasena: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credenciales, req) {
        const ip = extraerIpDeHeaders(req?.headers as Record<string, string> | undefined)
        const nombreUsuario = credenciales?.nombreUsuario

        if (!nombreUsuario || !credenciales?.contrasena) {
          return null
        }

        const usuario = await prisma.usuario.findUnique({
          where: { nombreUsuario }
        })

        if (!usuario) {
          await registrarAuditoria({
            accion: 'LOGIN_FALLIDO',
            entidad: 'Sesion',
            usuarioId: null,
            datos: { nombreUsuario, motivo: 'USUARIO_NO_EXISTE' },
            ip,
          })
          return null
        }

        const contrasenaValida = await bcrypt.compare(
          credenciales.contrasena,
          usuario.contrasena
        )

        if (!contrasenaValida) {
          await registrarAuditoria({
            accion: 'LOGIN_FALLIDO',
            entidad: 'Sesion',
            usuarioId: usuario.id,
            datos: { nombreUsuario, motivo: 'CONTRASENA_INCORRECTA' },
            ip,
          })
          return null
        }

        await registrarAuditoria({
          accion: 'LOGIN',
          entidad: 'Sesion',
          usuarioId: usuario.id,
          datos: { nombreUsuario },
          ip,
        })

        return {
          id: usuario.id.toString(),
          name: usuario.nombre,
          email: usuario.nombreUsuario,
          rol: usuario.rol,
          permisos: usuario.permisos,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    // 8 horas (una jornada laboral). Pasado este tiempo el usuario debe
    // volver a iniciar sesion.
    maxAge: 8 * 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
        token.permisos = user.permisos
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.rol = token.rol
        session.user.permisos = token.permisos
      }
      return session
    }
  }
}
