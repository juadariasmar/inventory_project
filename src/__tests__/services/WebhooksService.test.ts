import { WebhooksService } from '../../services/WebhooksService'
import { prisma } from '../../lib/db'

jest.mock('../../lib/db', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    empresa: {
      findFirst: jest.fn()
    }
  }
}))

describe('WebhooksService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ADMIN_EMAILS
    ;(prisma.empresa.findFirst as jest.Mock).mockResolvedValue({ id: 'empresa-default-id' })
  })

  describe('validarFirma', () => {
    it('debe lanzar error si el secreto no esta configurado', async () => {
      delete process.env.NEON_WEBHOOK_SECRET
      await expect(WebhooksService.validarFirma('token')).rejects.toThrow('NEON_WEBHOOK_SECRET no configurado')
    })

    it('debe lanzar error si el token es invalido', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      await expect(WebhooksService.validarFirma('token_falso')).rejects.toThrow('Firma de webhook inválida')
    })

    it('debe retornar true si el token es valido', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      const resultado = await WebhooksService.validarFirma('secreto_super_seguro')
      expect(resultado).toBe(true)
    })

    it('debe rechazar un token de igual longitud pero distinto (timingSafeEqual)', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      const mismaLongitud = 'X'.repeat('secreto_super_seguro'.length)
      await expect(WebhooksService.validarFirma(mismaLongitud)).rejects.toThrow('Firma de webhook inválida')
    })

    it('debe rechazar (sin RangeError) un token de longitud distinta al secreto', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      await expect(WebhooksService.validarFirma('x')).rejects.toThrow('Firma de webhook inválida')
    })
  })

  describe('procesarEventoUsuarioCreado', () => {
    it('debe lanzar error si el payload es invalido', async () => {
      await expect(WebhooksService.procesarEventoUsuarioCreado({})).rejects.toThrow('Payload inválido para evento user.created')
    })

    it('debe lanzar 400 si el email no es un correo válido (Zod)', async () => {
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await expect(
        WebhooksService.procesarEventoUsuarioCreado({ id: 'neon-1', email: 'no-es-email' })
      ).rejects.toThrow('Payload inválido para evento user.created')
      expect(prisma.usuario.create).not.toHaveBeenCalled()
    })

    it('debe ignorar si el usuario ya existe (idempotencia)', async () => {
      const payload = { id: 'neon-123', email: 'test@ejemplo.com', name: 'Test' }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'local-1' })
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { neonAuthId: 'neon-123' } })
      expect(prisma.usuario.create).not.toHaveBeenCalled()
    })

    it('debe crear el usuario en estado PENDIENTE (con empresa por defecto) si no existe', async () => {
      const payload = { id: 'neon-123', email: 'test@ejemplo.com', name: 'Test Name' }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: {
          neonAuthId: 'neon-123',
          email: 'test@ejemplo.com',
          nombre: 'Test Name',
          estado: 'PENDIENTE',
          rol: 'USUARIO',
          empresaId: 'empresa-default-id'
        }
      })
    })

    it('debe crear como ADMIN/ACTIVO si el email está en ADMIN_EMAILS', async () => {
      process.env.ADMIN_EMAILS = 'jefe@empresa.com, test@ejemplo.com'
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await WebhooksService.procesarEventoUsuarioCreado({ id: 'neon-9', email: 'test@ejemplo.com', name: 'Jefe' })
      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: {
          neonAuthId: 'neon-9',
          email: 'test@ejemplo.com',
          nombre: 'Jefe',
          estado: 'ACTIVO',
          rol: 'ADMIN',
          empresaId: 'empresa-default-id'
        }
      })
    })

    it('debe usar el email como nombre si no viene name', async () => {
      const payload = { id: 'neon-123', email: 'test@ejemplo.com' }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ nombre: 'test@ejemplo.com' }) })
      )
    })
  })
})
