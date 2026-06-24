import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import { createHmac, timingSafeEqual } from 'crypto'
import { z } from 'zod'

const usuarioCreadoSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().optional(),
})

export class WebhooksService {
  static async validarFirma(payload: string, signatureHeader: string | null): Promise<boolean> {
    const secreto = process.env.NEON_WEBHOOK_SECRET

    if (!secreto) {
      throw new AppError('NEON_WEBHOOK_SECRET no configurado en el servidor', 500)
    }

    if (!signatureHeader) {
      throw new AppError('Firma de webhook inválida', 401)
    }

    const expected = createHmac('sha256', secreto).update(payload).digest('hex')
    const sigBuf = Buffer.from(signatureHeader)
    const expBuf = Buffer.from(expected)

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new AppError('Firma de webhook inválida', 401)
    }

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
}
