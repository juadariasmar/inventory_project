import { WebhooksService } from '../../services/WebhooksService'
import { prisma } from '../../lib/db'
import * as crypto from 'crypto'

jest.mock('crypto', () => {
  const original = jest.requireActual('crypto')
  return {
    ...original,
    createPublicKey: jest.fn(),
    verify: jest.fn()
  }
})

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

describe('WebhooksService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ADMIN_EMAILS
    ;(prisma.empresa.findFirst as jest.Mock).mockResolvedValue({ id: 'empresa-default-id' })
    ;(prisma.empresa.create as jest.Mock).mockResolvedValue({ id: 'empresa-auto-creada' })
  })

  describe('validarFirma', () => {
    let mockHeaders: Headers

    beforeEach(() => {
      mockHeaders = new Headers()
      mockHeaders.set('x-neon-signature', 'header..signature')
      mockHeaders.set('x-neon-signature-kid', 'test-kid')
      mockHeaders.set('x-neon-timestamp', Date.now().toString())
      process.env.NEON_AUTH_BASE_URL = 'http://localhost:3000'

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            keys: [{
              kid: 'test-kid',
              kty: 'OKP',
              crv: 'Ed25519',
              x: 'dGVzdA' // just a dummy base64 string for format
            }]
          })
        })
      ) as jest.Mock

      ;(crypto.createPublicKey as jest.Mock).mockReturnValue({} as any)
      ;(crypto.verify as jest.Mock).mockReturnValue(true)
    })

    it('debe lanzar error si faltan headers', async () => {
      mockHeaders.delete('x-neon-signature')
      await expect(WebhooksService.validarFirma('{}', mockHeaders)).rejects.toThrow('Faltan headers de firma de Neon Auth')
    })

    it('debe lanzar error si NEON_AUTH_BASE_URL no está configurado', async () => {
      delete process.env.NEON_AUTH_BASE_URL
      await expect(WebhooksService.validarFirma('{}', mockHeaders)).rejects.toThrow('NEON_AUTH_BASE_URL no configurado')
    })

    it('debe lanzar error si el KID no se encuentra en el JWKS', async () => {
      mockHeaders.set('x-neon-signature-kid', 'unknown-kid')
      await expect(WebhooksService.validarFirma('{}', mockHeaders)).rejects.toThrow('Key unknown-kid not found en JWKS')
    })

    it('debe retornar true si la firma es valida', async () => {
      const resultado = await WebhooksService.validarFirma('{}', mockHeaders)
      expect(resultado).toBe(true)
    })

    it('debe lanzar error si la firma es invalida', async () => {
      ;(crypto.verify as jest.Mock).mockReturnValue(false)
      await expect(WebhooksService.validarFirma('{}', mockHeaders)).rejects.toThrow('Firma de webhook inválida')
    })

    it('debe lanzar error si el timestamp ha expirado', async () => {
      mockHeaders.set('x-neon-timestamp', (Date.now() - 10 * 60 * 1000).toString()) // 10 minutes ago
      await expect(WebhooksService.validarFirma('{}', mockHeaders)).rejects.toThrow('Webhook timestamp expirado')
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
