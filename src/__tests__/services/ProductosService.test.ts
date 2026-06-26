import { prisma } from '@/lib/db'
import { ProductosService } from '@/services/ProductosService'

jest.mock('@/lib/auth/server', () => ({
  auth: { getSession: jest.fn(() => Promise.resolve({ data: { user: null } })) },
}))

let empresaId: string
let categoriaId: number

beforeAll(async () => {
  empresaId = `test-qa-prod-${Date.now()}`
  await prisma.empresa.create({
    data: { id: empresaId, nombre: `QA Test Empresa ${empresaId}` },
  })
  const cat = await prisma.categoria.create({
    data: { nombre: `QA-Test-${empresaId}`, prefijo: `QA${Date.now().toString(36).slice(-6)}`, empresaId },
  })
  categoriaId = cat.id
})

afterAll(async () => {
  await prisma.movimiento.deleteMany({ where: { empresaId } })
  await prisma.historialMovimientos.deleteMany({ where: { empresaId } })
  await prisma.producto.deleteMany({ where: { empresaId } })
  await prisma.categoria.deleteMany({ where: { empresaId } })
  await prisma.empresa.delete({ where: { id: empresaId } }).catch(() => {})
})

describe('ProductosService — QA Suite', () => {

  describe('obtenerTodos', () => {
    it('lanza AppError si empresaId está vacío', async () => {
      await expect(ProductosService.obtenerTodos('', undefined, 50)).rejects.toThrow('empresaId es requerido')
    })

    it('retorna lista vacía para empresa sin productos', async () => {
      const r = await ProductosService.obtenerTodos(empresaId)
      expect(r).toEqual({ items: [], nextCursor: null, total: 0 })
    })

    it('retorna productos paginados correctamente', async () => {
      const codigo = `QA-PAG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      await ProductosService.crear(
        { nombre: 'Pagina Test', precio: 10, cantidad: 5, categoriaId, codigo },
        null,
        empresaId
      )
      const r = await ProductosService.obtenerTodos(empresaId, undefined, 2)
      expect(r.items.length).toBeGreaterThanOrEqual(1)
      expect(r.total).toBeGreaterThanOrEqual(1)
    })
  })

  describe('crear', () => {
    it('lanza AppError si empresaId está vacío', async () => {
      await expect(ProductosService.crear({ nombre: 'X', precio: 1, categoriaId: 1 }, null, ''))
        .rejects.toThrow('empresaId es requerido')
    })

    it('lanza AppError si nombre está vacío', async () => {
      await expect(ProductosService.crear({ nombre: '', precio: 1, categoriaId }, null, empresaId))
        .rejects.toThrow('El nombre es obligatorio')
    })

    it('lanza AppError si nombre no es string', async () => {
      await expect(ProductosService.crear({ precio: 1, categoriaId }, null, empresaId))
        .rejects.toThrow('El nombre es obligatorio')
    })

    it('lanza AppError si categoriaId es inválido', async () => {
      await expect(ProductosService.crear({ nombre: 'Test', precio: 1 }, null, empresaId))
        .rejects.toThrow('La categoría es obligatoria')
    })

    it('lanza AppError si la categoría no existe', async () => {
      await expect(ProductosService.crear({ nombre: 'Test', precio: 1, categoriaId: 999999 }, null, empresaId))
        .rejects.toThrow('no existe')
    })

    it('lanza AppError si precio no es válido', async () => {
      await expect(ProductosService.crear({ nombre: 'Test', precio: 'abc', categoriaId }, null, empresaId))
        .rejects.toThrow('El precio debe ser un número válido')
    })

    it('lanza AppError si precio es negativo', async () => {
      await expect(ProductosService.crear({ nombre: 'Test', precio: -5, categoriaId }, null, empresaId))
        .rejects.toThrow('El precio debe ser un número válido')
    })

    it('crea producto exitosamente con stock inicial', async () => {
      const codigo = `QA-CREATE-${Date.now()}`
      const p = await ProductosService.crear(
        { nombre: 'Creado OK', precio: 99.99, cantidad: 10, categoriaId, codigo },
        '127.0.0.1',
        empresaId
      )
      expect(p.id).toBeGreaterThan(0)
      expect(p.nombre).toBe('Creado OK')
      expect(p.cantidad).toBe(10)
      expect(p.precio).toBe(99.99)
      expect(p.empresaId).toBe(empresaId)

      const mov = await prisma.movimiento.findFirst({ where: { productoId: p.id, empresaId } })
      expect(mov).toBeTruthy()
      expect(mov!.tipo).toBe('entrada')
      expect(mov!.cantidad).toBe(10)
      expect(mov!.notas).toBe('Stock inicial')
    })

    it('genera código automático si no se provee', async () => {
      const p = await ProductosService.crear(
        { nombre: `Auto Código ${Date.now()}`, precio: 5, cantidad: 0, categoriaId, codigo: undefined as unknown as string },
        '127.0.0.1',
        empresaId
      )
      expect(p.codigo).toBeTruthy()
      expect(p.codigo.length).toBeGreaterThan(2)
    })

    it('crea producto sin stock y sin movimiento', async () => {
      const codigo = `QA-SINSTOCK-${Date.now()}`
      const p = await ProductosService.crear(
        { nombre: 'Sin Stock', precio: 10, cantidad: 0, categoriaId, codigo },
        '127.0.0.1',
        empresaId
      )
      expect(p.cantidad).toBe(0)
      const movs = await prisma.movimiento.findMany({ where: { productoId: p.id, empresaId } })
      expect(movs.length).toBe(0)
    })

    it('lanza AppError con código duplicado', async () => {
      const codigo = `QA-DUP-${Date.now()}`
      await ProductosService.crear(
        { nombre: 'Original', precio: 10, categoriaId, codigo },
        null,
        empresaId
      )
      await expect(
        ProductosService.crear(
          { nombre: 'Duplicado', precio: 10, categoriaId, codigo },
          null,
          empresaId
        )
      ).rejects.toThrow('Ya existe un producto con ese código')
    })
  })
})
