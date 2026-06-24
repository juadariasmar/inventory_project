import { WebhooksService } from '../../services/WebhooksService'
import { prisma } from '../../lib/db'
import { createHmac } from 'crypto'

jest.mock('../../lib/db', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    empresa: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

function firmarPayload(payload: string, secreto: string): string {
  return createHmac('sha256', secreto).update(payload).digest('hex')
}

describe('WebhooksService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ADMIN_EMAILS
    ;(prisma.empresa.findFirst as jest.Mock).mockResolvedValue({ id: 'empresa-default-id' })
    ;(prisma.empresa.create as jest.Mock).mockResolvedValue({ id: 'empresa-auto-creada' })
  })

  describe('validarFirma', () => {
    it('debe lanzar error si el secreto no esta configurado', async () => {
      delete process.env.NEON_WEBHOOK_SECRET
      await expect(WebhooksService.validarFirma('{}', 'firma')).rejects.toThrow('NEON_WEBHOOK_SECRET no configurado')
    })

    it('debe lanzar error si la firma es invalida', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      await expect(WebhooksService.validarFirma('{}', 'firma_falsa')).rejects.toThrow('Firma de webhook inválida')
    })

    it('debe retornar true si la firma es valida', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      const payload = JSON.stringify({ type: 'user.created', data: { id: '1', email: 'a@b.com' } })
      const firma = firmarPayload(payload, 'secreto_super_seguro')
      const resultado = await WebhooksService.validarFirma(payload, firma)
      expect(resultado).toBe(true)
    })

    it('debe rechazar una firma alterada (tampering)', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      const payload = JSON.stringify({ type: 'user.created', data: { id: '1', email: 'a@b.com' } })
      const firma = firmarPayload(payload, 'secreto_super_seguro')
      const payloadAlterado = JSON.stringify({ type: 'user.created', data: { id: '1', email: 'malo@b.com' } })
      await expect(WebhooksService.validarFirma(payloadAlterado, firma)).rejects.toThrow('Firma de webhook inválida')
    })

    it('debe lanzar 401 si no se envía firma', async () => {
      process.env.NEON_WEBHOOK_SECRET = 'secreto_super_seguro'
      await expect(WebhooksService.validarFirma('{}', null)).rejects.toThrow('Firma de webhook inválida')
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

    it('debe crear usuario ADMIN/ACTIVO con empresa propia si no existe', async () => {
      const payload = { id: 'neon-123', email: 'test@ejemplo.com', name: 'Test Name' }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      expect(prisma.empresa.create).toHaveBeenCalledWith({
        data: { nombre: 'Empresa de test@ejemplo.com' }
      })
      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: {
          neonAuthId: 'neon-123',
          email: 'test@ejemplo.com',
          nombre: 'Test Name',
          estado: 'ACTIVO',
          rol: 'ADMIN',
          empresaId: 'empresa-auto-creada'
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
          empresaId: 'empresa-auto-creada'
        }
      })
    })

    it('debe usar el email como nombre si no viene name', async () => {
      const payload = { id: 'neon-123', email: 'test@ejemplo.com' }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      expect(prisma.empresa.create).toHaveBeenCalledWith({
        data: { nombre: 'Empresa de test@ejemplo.com' }
      })
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ nombre: 'test@ejemplo.com' }) })
      )
    })
  })
})
