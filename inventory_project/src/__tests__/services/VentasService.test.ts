import { VentasService } from '../../services/VentasService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';
import { StockService } from '../../services/StockService';

jest.mock('../../services/StockService', () => ({
  StockService: {
    validarDisponibilidad: jest.fn().mockReturnValue(true)
  }
}));

describe('VentasService', () => {
  let productoId: number;
  let categoriaId: number;
  let usuarioCreado = false;

  beforeAll(async () => {
    let u = await prisma.usuario.findUnique({ where: { id: 1 } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 1, nombre: 'Admin', nombreUsuario: 'adminVentasTest', contrasena: '1234' }
      });
      usuarioCreado = true;
    }

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Ventas' } });
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Ventas', prefijo: 'TCV' }
      });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'TEST-VENTAS' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod Ventas', codigo: 'TEST-VENTAS', cantidad: 50, precio: 100, categoriaId }
      });
    }
    productoId = p.id;
  });

  afterAll(async () => {
    if (productoId) {
      await prisma.movimiento.deleteMany({ where: { productoId } });
      await prisma.itemVenta.deleteMany({ where: { productoId } });
      await prisma.venta.deleteMany({ where: { items: { some: { productoId } } } });
      await prisma.producto.delete({ where: { id: productoId } });
    }
    if (categoriaId) {
      await prisma.categoria.delete({ where: { id: categoriaId } });
    }
    if (usuarioCreado) {
      await prisma.usuario.delete({ where: { id: 1 } });
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws error if product not found', async () => {
    const consolidados = new Map<number, number>([[-999, 1]]);
    await expect(VentasService.registrarVenta(consolidados, 1, 'test')).rejects.toThrow(AppError);
  });

  it('registers a sale successfully', async () => {
    const consolidados = new Map<number, number>([[productoId, 5]]);
    const resultado = await VentasService.registrarVenta(consolidados, 1, 'Venta de test');
    
    expect(resultado).toBeDefined();
    expect(resultado.venta).toBeDefined();
    expect(resultado.venta.total).toBe(500); // 5 * 100
    expect(resultado.itemsValidados.length).toBe(1);
    expect(resultado.itemsValidados[0].cantidad).toBe(5);
  });
});
