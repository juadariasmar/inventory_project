import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'

export class WebhooksService {
  /**
   * Valida que el token proporcionado coincida con el secreto configurado.
   * Lanza un AppError 401 si falla.
   */
  static async validarFirma(token: string | null): Promise<boolean> {
    const secreto = process.env.NEON_WEBHOOK_SECRET
    
    if (!secreto) {
      throw new AppError('NEON_WEBHOOK_SECRET no configurado en el servidor', 500)
    }

    if (!token || token !== secreto) {
      throw new AppError('Firma de webhook inválida', 401)
    }

    return true
  }

  /**
   * Procesa el evento de creacion de usuario de Neon Auth.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async procesarEventoUsuarioCreado(payload: any): Promise<void> {
    // Validacion muy basica (podria usarse Zod para mas robustez)
    if (!payload || !payload.id || !payload.email) {
      throw new AppError('Payload inválido para evento user.created', 400)
    }

    const { id, email, name } = payload

    // Idempotencia: Verificar si ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { neonAuthId: id }
    })

    if (usuarioExistente) {
      console.log(`[Webhooks] Usuario ${id} ya existe en la DB. Ignorando evento.`)
      return
    }

    // Creacion del usuario pendiente
    await prisma.usuario.create({
      data: {
        neonAuthId: id,
        email: email,
        nombre: name || email,
        estado: 'PENDIENTE',
        rol: 'USUARIO'
      }
    })
    
    console.log(`[Webhooks] Usuario ${id} (${email}) sincronizado exitosamente como PENDIENTE.`)
  }
}
