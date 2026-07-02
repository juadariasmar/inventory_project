import nodemailer from 'nodemailer'
import { prisma } from './db'
import { AppError } from './AppError'

const getTransporter = () => {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)

  if (!process.env.SMTP_PASS && !process.env.SMTP_PASSWORD) {
    console.warn('[SMTP ERROR]: process.env.SMTP_PASS is not defined in the environment!')
  }

  if (!user || !pass) {
    console.warn('[Mailer] SMTP credentials not configured. Using fallback console mailer.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

export async function enviarCorreoRecuperacion(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/auth/reset-password?token=${token}`

  const transporter = getTransporter()
  if (!transporter) {
    console.log(`--- [Simulado] Enviar Correo Recuperación a ${email} ---`)
    console.log(`Link: ${link}`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Restablecer contraseña - Sistema de Inventario',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Restablecer tu contraseña</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Inventario.</p>
          <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Haz clic en el siguiente enlace o el botón de abajo para continuar con el proceso:</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 20px;">Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; line-height: 16px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/><a href="${link}">${link}</a></p>
        </div>
      `,
    })
    console.log(`[Mailer] Correo de recuperación enviado a ${email}`)
  } catch (error) {
    console.error('[SMTP ERROR]:', error)
    throw new AppError('Error al enviar el correo de recuperación', 500)
  }
}

export async function enviarCodigoVerificacion(email: string, codigo: string) {
  const transporter = getTransporter()
  if (!transporter) {
    console.log(`--- [Simulado] Enviar Código Verificación a ${email} ---`)
    console.log(`Código: ${codigo}`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Código de verificación - Sistema de Inventario',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Código de verificación</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Tu código de verificación de inicio de sesión para el Sistema de Inventario es:</p>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${codigo}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 20px;">Por seguridad, no compartas este código con nadie. Expira en unos minutos.</p>
        </div>
      `,
    })
    console.log(`[Mailer] Código de verificación enviado a ${email}`)
  } catch (error) {
    console.error('[SMTP ERROR]:', error)
    throw new AppError('Error al enviar el código de verificación', 500)
  }
}

export async function enviarInvitacionOrganizacion(email: string, empresaId: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/invitacion?token=${token}`

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nombre: true },
  })
  const empresaNombre = empresa?.nombre || 'tu organización'

  const transporter = getTransporter()
  if (!transporter) {
    console.log(`--- [Simulado] Enviar Invitación Organización a ${email} ---`)
    console.log(`Empresa: ${empresaNombre}`)
    console.log(`Link: ${link}`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Te han invitado a unirte a ${empresaNombre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Invitación de Organización</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Te han invitado a unirte a la empresa <strong>${empresaNombre}</strong> en el Sistema de Inventario.</p>
          <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">Haz clic en el botón de abajo para aceptar la invitación y completar tu registro:</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aceptar Invitación</a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 20px;">Esta invitación tiene una validez de 7 días.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; line-height: 16px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/><a href="${link}">${link}</a></p>
        </div>
      `,
    })
    console.log(`[Mailer] Invitación de organización enviada a ${email}`)
  } catch (error) {
    console.error('[SMTP ERROR]:', error)
    throw new AppError('Error al enviar la invitación de organización', 500)
  }
}

export async function enviarMagicLink(email: string, url: string) {
  const transporter = getTransporter()
  if (!transporter) {
    console.log(`--- [Simulado] Enviar Magic Link a ${email} ---`)
    console.log(`URL: ${url}`)
    return
  }

  const isReset = url.includes('reset') || url.includes('password')
  const subject = isReset ? 'Restablecer contraseña - Sistema de Inventario' : 'Iniciar sesión - Sistema de Inventario'
  const title = isReset ? 'Restablecer tu contraseña' : 'Enlace de inicio de sesión'
  const body = isReset 
    ? 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.' 
    : 'Usa el botón de abajo para iniciar sesión de forma segura en tu cuenta.'
  const btnText = isReset ? 'Restablecer Contraseña' : 'Iniciar Sesión'

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">${title}</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">${body}</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${btnText}</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; line-height: 16px;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/><a href="${url}">${url}</a></p>
        </div>
      `,
    })
    console.log(`[Mailer] Magic link enviado a ${email}`)
  } catch (error) {
    console.error('[SMTP ERROR]:', error)
    throw new AppError('Error al enviar el correo', 500)
  }
}
