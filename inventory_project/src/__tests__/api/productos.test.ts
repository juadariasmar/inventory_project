import { GET, POST } from '../../app/api/productos/route'
import { createMockRequest } from '../utils/test-utils'
import { NextRequest } from 'next/server'
import { prisma } from '../../lib/db'

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 'test-user-prod-1', role: 'admin' } }),
  esAdmin: jest.fn().mockResolvedValue(true)
}))


jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}))

describe('Productos API', () => {
  let categoriaId: number
  let productoId: number

  let categoriaCreada = false
  let usuarioCreado = false

  beforeAll(async () => {
    // Check if user 1 exists, if not create it
    let u = await prisma.usuario.findUnique({ where: { id: 'test-user-prod-1' } })
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 'test-user-prod-1', neonAuthId: 'test-neon-auth-prod-1', nombre: 'Admin Prod', email: 'adminProdTest@example.com' }
      })
      usuarioCreado = true
    }

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Prod' } })
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Prod', prefijo: 'TCP' }
      })
      categoriaCreada = true
    }
    categoriaId = c.id
  })

  afterAll(async () => {
    if (productoId) {
      await prisma.movimiento.deleteMany({ where: { productoId } })
      await prisma.itemCotizacion.deleteMany({ where: { productoId } })
      await prisma.producto.delete({ where: { id: productoId } })
    }
    if (categoriaId && categoriaCreada) {
      await prisma.categoria.delete({ where: { id: categoriaId } })
    }
    if (usuarioCreado) {
      await prisma.usuario.deleteMany({ where: { id: 'test-user-prod-1' } })
    }
  })

  it('crea un producto exitosamente', async () => {
    const req = createMockRequest('http://localhost/api/productos', 'POST', '127.0.0.1', {
      nombre: 'Producto Nuevo Test',
      codigo: 'PNT-001',
      precio: 1500,
      cantidad: 10,
      stockMinimo: 2,
      categoriaId
    })
    
    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(201)
    
    const data = await res.json()
    expect(data.nombre).toBe('Producto Nuevo Test')
    productoId = data.id
  })

  it('falla al crear producto con código duplicado', async () => {
    const req = createMockRequest('http://localhost/api/productos', 'POST', '127.0.0.1', {
      nombre: 'Producto Duplicado Test',
      codigo: 'PNT-001',
      precio: 2000,
      cantidad: 5,
      stockMinimo: 1,
      categoriaId
    })
    
    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(409)
    
    const data = await res.json()
    expect(data.error).toBe('Ya existe un producto con ese código.')
  })

  it('obtiene la lista de productos paginada', async () => {
    const req = createMockRequest('http://localhost/api/productos?limite=1', 'GET', '127.0.0.1')
    const res = await GET(req as unknown as NextRequest)
    
    expect(res.status).toBe(200)
    const data = await res.json()
    
    expect(data.items.length).toBeLessThanOrEqual(1)
    expect(data).toHaveProperty('nextCursor')
    expect(data).toHaveProperty('total')
  })
})
