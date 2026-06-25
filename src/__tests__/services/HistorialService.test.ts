import { prisma } from '@/lib/db'
import { HistorialService } from '@/services/HistorialService'

let empresaId: string
let productoId: number
let categoriaId: number
const usuarioId = 'qa-test-user'

beforeAll(async () => {
  empresaId = `test-qa-hist-${Date.now()}`
  await prisma.empresa.create({
    data: { id: empresaId, nombre: `QA Hist Test ${empresaId}` },
  })
  const cat = await prisma.categoria.create({
    data: { nombre: `QA-Hist-${empresaId}`, prefijo: `QH${empresaId.slice(0, 4)}`, empresaId },
  })
  categoriaId = cat.id
  const prod = await prisma.producto.create({
    data: { nombre: 'Producto Auditado', codigo: `QA-HIST-${Date.now()}`, precio: 50, cantidad: 20, stockMinimo: 1, categoriaId, empresaId },
  })
  productoId = prod.id
})

afterAll(async () => {
  await prisma.producto.deleteMany({ where: { empresaId } })
  await prisma.categoria.deleteMany({ where: { empresaId } })
  await prisma.historialMovimientos.deleteMany({ where: { empresaId } })
  await prisma.movimiento.deleteMany({ where: { empresaId } })
  await prisma.empresa.delete({ where: { id: empresaId } }).catch(() => {})
})

describe('HistorialService — QA Suite', () => {

  describe('registrar', () => {
    it('crea una entrada de historial para CREAR', async () => {
      await HistorialService.registrar({
        usuarioId,
        accion: 'CREAR',
        recursoId: productoId,
        descripcion: 'Producto creado en test',
        datosDespues: { nombre: 'Test' },
        ip: '10.0.0.1',
        empresaId,
      })
      const entries = await prisma.historialMovimientos.findMany({
        where: { recursoId: productoId, empresaId },
      })
      expect(entries.length).toBe(1)
      expect(entries[0].accion).toBe('CREAR')
      expect(entries[0].usuarioId).toBe(usuarioId)
      expect(entries[0].descripcion).toContain('creado')
    })

    it('crea una entrada de historial para MODIFICAR con antes/despues', async () => {
      await HistorialService.registrar({
        usuarioId,
        accion: 'MODIFICAR',
        recursoId: productoId,
        descripcion: 'Precio actualizado de 50 a 75',
        datosAntes: { precio: 50 },
        datosDespues: { precio: 75 },
        ip: '10.0.0.2',
        empresaId,
      })
      const entries = await prisma.historialMovimientos.findMany({
        where: { recursoId: productoId, empresaId },
        orderBy: { creadoEn: 'desc' },
        take: 1,
      })
      expect(entries[0].accion).toBe('MODIFICAR')
      expect(entries[0].datosAntes).toEqual({ precio: 50 })
      expect(entries[0].datosDespues).toEqual({ precio: 75 })
    })

    it('crea una entrada de historial para ELIMINAR', async () => {
      await HistorialService.registrar({
        usuarioId,
        accion: 'ELIMINAR',
        recursoId: productoId,
        descripcion: 'Producto eliminado (stock: 0)',
        datosAntes: { nombre: 'Producto Auditado', cantidad: 0 },
        ip: '10.0.0.3',
        empresaId,
      })
      const entries = await prisma.historialMovimientos.findMany({
        where: { recursoId: productoId, empresaId, accion: 'ELIMINAR' },
      })
      expect(entries.length).toBe(1)
    })
  })

  describe('obtenerHistorial', () => {
    it('retorna el historial completo de un recurso', async () => {
      const historial = await HistorialService.obtenerHistorial(productoId, empresaId)
      expect(historial.length).toBeGreaterThanOrEqual(3)
      expect(historial[0].recursoId).toBe(productoId)
    })

    it('retorna array vacío para recurso sin historial', async () => {
      const historial = await HistorialService.obtenerHistorial(999999, empresaId)
      expect(historial).toEqual([])
    })
  })
})
