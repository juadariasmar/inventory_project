import nodemailer from 'nodemailer'

export const EmailService = {
  async enviarInvitacion(datos: {
    email: string
    token: string
    empresaNombre: string
    invitarPorNombre: string
  }) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const link = `${baseUrl}/invitacion?token=${datos.token}`

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('[EmailService] SMTP credentials no configuradas. Email no enviado.')
      console.log('--- EmailService: enviarInvitacion (simulado) ---')
      console.log(`  Para: ${datos.email}`)
      console.log(`  De: ${datos.invitarPorNombre}`)
      console.log(`  Empresa: ${datos.empresaNombre}`)
      console.log(`  Link: ${link}`)
      console.log('---')
      return
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: datos.email,
        subject: `Invitación a ${datos.empresaNombre}`,
        html: `
          <p>${datos.invitarPorNombre} te ha invitado a unirte a <strong>${datos.empresaNombre}</strong>.</p>
          <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Este enlace expirará en 7 días.</p>
        `,
      })
      console.log(`[EmailService] Invitación enviada a ${datos.email}`)
    } catch (error) {
      console.error('[EmailService] Error enviando email:', error)
    }
  },
}
