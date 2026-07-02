import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import crypto, { createPublicKey } from 'crypto'
import { z } from 'zod'
import { enviarCodigoVerificacion, enviarMagicLink } from '../lib/mailer'

const usuarioCreadoSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().optional(),
})

export class WebhooksService {
  static async validarFirma(rawBody: string, headers: Headers): Promise<boolean> {
    const signature = headers.get('x-neon-signature')
    const kid = headers.get('x-neon-signature-kid')
    const timestamp = headers.get('x-neon-timestamp')

    if (!signature || !kid || !timestamp) {
      throw new AppError('Faltan headers de firma de Neon Auth', 401)
    }

    const baseUrl = process.env.NEON_AUTH_BASE_URL
    if (!baseUrl) {
      throw new AppError('NEON_AUTH_BASE_URL no configurado', 500)
    }

    // 1. Fetch JWKS and find the matching key
    const res = await fetch(`${baseUrl}/.well-known/jwks.json`)
    const jwks = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jwk = jwks.keys.find((k: any) => k.kid === kid)
    if (!jwk) throw new AppError(`Key ${kid} not found en JWKS`, 401)

    // 2. Import the Ed25519 public key
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' })

    // 3. Parse detached JWS (header..signature)
    const [headerB64, emptyPayload, signatureB64] = signature.split('.')
    if (emptyPayload !== '') throw new AppError('Expected detached JWS format', 401)

    // 4. Reconstruct signing input (standard JWS, double base64url encoding)
    const payloadB64 = Buffer.from(rawBody, 'utf8').toString('base64url')
    const signaturePayload = `${timestamp}.${payloadB64}`
    const signaturePayloadB64 = Buffer.from(signaturePayload, 'utf8').toString('base64url')
    const signingInput = `${headerB64}.${signaturePayloadB64}`

    // 5. Verify Ed25519 signature
    const isValid = crypto.verify(
      null,
      Buffer.from(signingInput),
      publicKey,
      Buffer.from(signatureB64, 'base64url')
    )

    if (!isValid) throw new AppError('Firma de webhook inválida', 401)

    // 6. Check timestamp freshness
    const ageMs = Date.now() - parseInt(timestamp, 10)
    if (ageMs > 5 * 60 * 1000) throw new AppError('Webhook timestamp expirado', 401)

    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async procesarEventoUsuarioCreado(payload: any): Promise<void> {
    const parsed = usuarioCreadoSchema.safeParse(payload)
    if (!parsed.success) {
      throw new AppError('Payload inválido para evento user.created', 400)
    }

    const { id, email, name } = parsed.data

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { neonAuthId: id }
    })

    if (usuarioExistente) {
      console.log(`[Webhooks] Usuario ${id} ya existe en la DB. Ignorando evento.`)
      return
    }

    const empresa = await prisma.empresa.create({
      data: { nombre: `Empresa de ${email}` },
    })

    await prisma.usuario.create({
      data: {
        neonAuthId: id,
        email,
        nombre: name || email,
        estado: 'ACTIVO',
        rol: 'ADMIN',
        empresaId: empresa.id,
      },
    })

    console.log(`[Webhooks] Usuario ${id} (${email}) registrado con empresa ${empresa.id}.`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async procesarEventoSendOtp(payload: any): Promise<void> {
    const email = payload.email || payload.emailAddress || payload.to || payload.recipient || payload.email_address
    const otp = payload.otp || payload.code || payload.passcode || payload.otp_code || payload.otpCode || payload.token

    if (!email || !otp) {
      throw new AppError('Payload de send.otp incompleto', 400)
    }

    try {
      await enviarCodigoVerificacion(email, otp)
      console.log(`[Webhooks] OTP enviado con éxito a ${email}`)
    } catch (error) {
      console.error('[SMTP ERROR]:', error)
      throw error instanceof AppError ? error : new AppError('Error al enviar el OTP', 500)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async procesarEventoSendMagicLink(payload: any): Promise<void> {
    const email = payload.email || payload.emailAddress || payload.to || payload.recipient || payload.email_address
    const url = payload.url || payload.link || payload.href || payload.link_url || payload.linkUrl

    if (!email || !url) {
      throw new AppError('Payload de send.magic_link incompleto', 400)
    }

    try {
      await enviarMagicLink(email, url)
      console.log(`[Webhooks] Magic link enviado con éxito a ${email}`)
    } catch (error) {
      console.error('[SMTP ERROR]:', error)
      throw error instanceof AppError ? error : new AppError('Error al enviar el magic link', 500)
    }
  }
}
