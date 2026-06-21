import { CotizacionesService } from '../../services/CotizacionesService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';

describe('CotizacionesService', () => {
  let productoId: number;
  let categoriaId: number;
  let usuarioCreado = false;

  beforeAll(async () => {
    let u = await prisma.usuario.findUnique({ where: { id: 1 } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 1, nombre: 'Admin', nombreUsuario: 'adminCotServTest', contrasena: '1234' }
      });
      usuarioCreado = true;
    }

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Cot' } });
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Cot', prefijo: 'TCC' }
      });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'TEST-COT' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod Cot', codigo: 'TEST-COT', cantidad: 50, precio: 100, categoriaId }
      });
    }
    productoId = p.id;
  });

  afterAll(async () => {
    if (productoId) {
      await prisma.itemCotizacion.deleteMany({ where: { productoId } });
      await prisma.cotizacion.deleteMany({ where: { items: { some: { productoId } } } });
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
    await expect(CotizacionesService.crearCotizacion(consolidados, 1, 'test', 'Test Cliente')).rejects.toThrow(AppError);
  });

  it('creates a quotation successfully', async () => {
    const consolidados = new Map<number, number>([[productoId, 5]]);
    const resultado = await CotizacionesService.crearCotizacion(consolidados, 1, 'Cot de test', 'Test Cliente', 7);
    
    expect(resultado).toBeDefined();
    expect(resultado.cotizacion).toBeDefined();
    expect(resultado.cotizacion.total).toBe(500); // 5 * 100
    expect(resultado.itemsValidados.length).toBe(1);
    expect(resultado.itemsValidados[0].cantidad).toBe(5);
  });

  it('throws error if stock is insufficient', async () => {
    const consolidados = new Map<number, number>([[productoId, 100]]);
    await expect(CotizacionesService.crearCotizacion(consolidados, 1, 'Cot de test', 'Test Cliente', 7)).rejects.toThrow(AppError);
  });
});
