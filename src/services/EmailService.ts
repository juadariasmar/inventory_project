export const EmailService = {
  async enviarInvitacion(datos: {
    email: string
    token: string
    empresaNombre: string
    invitarPorNombre: string
  }) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const link = `${baseUrl}/invitacion?token=${datos.token}`

    if (process.env.NODE_ENV !== 'production') {
      console.log('--- EmailService: enviarInvitacion ---')
      console.log(`  Para: ${datos.email}`)
      console.log(`  De: ${datos.invitarPorNombre}`)
      console.log(`  Empresa: ${datos.empresaNombre}`)
      console.log(`  Link: ${link}`)
      console.log('---')
      return
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@inventario.app',
        to: datos.email,
        subject: `Invitación a ${datos.empresaNombre}`,
        html: `
          <p>${datos.invitarPorNombre} te ha invitado a unirte a <strong>${datos.empresaNombre}</strong>.</p>
          <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Este enlace expirará en 7 días.</p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Error enviando email:', error)
    }
  },
}
