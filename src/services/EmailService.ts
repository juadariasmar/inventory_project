import { enviarInvitacionOrganizacion } from '../lib/mailer'
import { prisma } from '../lib/db'

export const EmailService = {
  async enviarInvitacion(datos: {
    email: string
    token: string
    empresaNombre: string
    invitarPorNombre: string
  }) {
    const invitacion = await prisma.invitacion.findUnique({
      where: { token: datos.token },
      select: { empresaId: true }
    })

    if (invitacion) {
      await enviarInvitacionOrganizacion(datos.email, invitacion.empresaId, datos.token)
    } else {
      console.warn(`[EmailService] Invitación no encontrada para token ${datos.token}. No se pudo enviar el correo.`)
    }
  },
}
