import { WebhooksService } from '../../services/WebhooksService'
import { prisma } from '../../lib/db'

jest.mock('../../lib/db', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

describe('WebhooksService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
  })

  describe('procesarEventoUsuarioCreado', () => {
    it('debe lanzar error si el payload es invalido', async () => {
      await expect(WebhooksService.procesarEventoUsuarioCreado({})).rejects.toThrow('Payload inválido para evento user.created')
    })

    it('debe ignorar si el usuario ya existe (idempotencia)', async () => {
      const payload = {
        id: 'neon-123',
        email: 'test@ejemplo.com',
        name: 'Test'
      }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'local-1' })
      
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { neonAuthId: 'neon-123' } })
      expect(prisma.usuario.create).not.toHaveBeenCalled()
    })

    it('debe crear el usuario en estado PENDIENTE si no existe', async () => {
      const payload = {
        id: 'neon-123',
        email: 'test@ejemplo.com',
        name: 'Test Name'
      }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      
      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: {
          neonAuthId: 'neon-123',
          email: 'test@ejemplo.com',
          nombre: 'Test Name',
          estado: 'PENDIENTE',
          rol: 'USUARIO'
        }
      })
    })

    it('debe usar el email como nombre si no viene name', async () => {
      const payload = {
        id: 'neon-123',
        email: 'test@ejemplo.com'
      }
      ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null)
      
      await WebhooksService.procesarEventoUsuarioCreado(payload)
      
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: 'test@ejemplo.com'
          })
        })
      )
    })
  })
})
