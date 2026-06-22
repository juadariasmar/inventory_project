import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'
import { obtenerEmpresaPorDefectoId } from '../lib/empresa'

// Esquema estricto del payload de creación de usuario de Neon Auth.
// Evita procesar datos malformados o inyecciones de campos inesperados.
const usuarioCreadoSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().optional(),
})

export class WebhooksService {
  /**
   * Valida que el token proporcionado coincida con el secreto configurado.
   * Usa comparación de tiempo constante (timingSafeEqual) para evitar timing attacks.
   * Lanza un AppError 401 si falla, 500 si el secreto no está configurado.
   */
  static async validarFirma(token: string | null): Promise<boolean> {
    const secreto = process.env.NEON_WEBHOOK_SECRET

    if (!secreto) {
      throw new AppError('NEON_WEBHOOK_SECRET no configurado en el servidor', 500)
    }

    if (!token) {
      throw new AppError('Firma de webhook inválida', 401)
    }

    const tokenBuf = Buffer.from(token)
    const secretoBuf = Buffer.from(secreto)

    // timingSafeEqual exige buffers de igual longitud; si difieren, la firma es
    // inválida. La comprobación de longitud no filtra el secreto porque su
    // longitud no es información sensible.
    if (tokenBuf.length !== secretoBuf.length || !timingSafeEqual(tokenBuf, secretoBuf)) {
      throw new AppError('Firma de webhook inválida', 401)
    }

    return true
  }

  /**
   * Procesa el evento de creacion de usuario de Neon Auth.
   * Valida el payload con Zod antes de tocar la base de datos.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async procesarEventoUsuarioCreado(payload: any): Promise<void> {
    const parsed = usuarioCreadoSchema.safeParse(payload)
    if (!parsed.success) {
      throw new AppError('Payload inválido para evento user.created', 400)
    }

    const { id, email, name } = parsed.data

    // Idempotencia: Verificar si ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { neonAuthId: id }
    })

    if (usuarioExistente) {
      console.log(`[Webhooks] Usuario ${id} ya existe en la DB. Ignorando evento.`)
      return
    }

    // Creacion del usuario pendiente, asignado a la empresa por defecto.
    const empresaId = await obtenerEmpresaPorDefectoId()
    await prisma.usuario.create({
      data: {
        neonAuthId: id,
        email: email,
        nombre: name || email,
        estado: 'PENDIENTE',
        rol: 'USUARIO',
        empresaId
      }
    })

    console.log(`[Webhooks] Usuario ${id} (${email}) sincronizado exitosamente como PENDIENTE.`)
  }
}
