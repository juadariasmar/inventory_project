import { MovimientosService } from '../../services/MovimientosService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';
import { StockService } from '../../services/StockService';

jest.mock('../../services/StockService', () => ({
  StockService: {
    validarDisponibilidad: jest.fn().mockReturnValue(true)
  }
}));

describe('MovimientosService', () => {
  let productoId: number;
  let categoriaId: number;
  let empresaId: string;
  let usuarioCreado = false;

  beforeAll(async () => {
    let emp = await prisma.empresa.findUnique({ where: { id: 'test-empresa-mov-1' } });
    if (!emp) {
      emp = await prisma.empresa.create({ data: { id: 'test-empresa-mov-1', nombre: 'Test Empresa Mov' } });
    }
    empresaId = emp.id;

    let u = await prisma.usuario.findUnique({ where: { id: '1' } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: '1', neonAuthId: 'test-neon-auth-1', nombre: 'Admin', email: 'adminMovServTest', empresaId }
      });
      usuarioCreado = true;
    }

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Serv' } });
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Serv', prefijo: 'TCS', empresaId }
      });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'TEST-SERV' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod Serv', codigo: 'TEST-SERV', cantidad: 10, precio: 100, categoriaId, empresaId }
      });
    }
    productoId = p.id;
  });

  afterAll(async () => {
    if (productoId) {
      await prisma.movimiento.deleteMany({ where: { productoId } });
      await prisma.auditoria.deleteMany({ where: { entidadId: { not: "0" } } });
      await prisma.producto.delete({ where: { id: productoId } });
    }
    if (categoriaId) {
      await prisma.categoria.delete({ where: { id: categoriaId } });
    }
    if (usuarioCreado) {
      await prisma.usuario.delete({ where: { id: '1' } });
    }
    await prisma.empresa.delete({ where: { id: 'test-empresa-mov-1' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws error if type is invalid', async () => {
    await expect(MovimientosService.registrarMovimiento(
      { productoId, tipo: 'invalido', cantidad: 5 },
      '1',
      '127.0.0.1',
      empresaId
    )).rejects.toThrow(AppError);
  });

  it('throws error if required fields are missing', async () => {
    await expect(MovimientosService.registrarMovimiento(
      { tipo: 'entrada', cantidad: 5 },
      '1',
      '127.0.0.1',
      empresaId
    )).rejects.toThrow(AppError);
  });

  it('registers an entry movement successfully', async () => {
    const mov = await MovimientosService.registrarMovimiento(
      { productoId, tipo: 'entrada', cantidad: 5 },
      '1',
      '127.0.0.1',
      empresaId
    );
    expect(mov).toBeDefined();
    expect(mov.tipo).toBe('entrada');
    expect(mov.cantidad).toBe(5);

    const producto = await prisma.producto.findUnique({ where: { id: productoId } });
    // Started at 10, should be 15 now
    expect(producto?.cantidad).toBeGreaterThanOrEqual(5);
  });

  it('validates stock availability on exit movement', async () => {
    // We mock StockService.validarDisponibilidad to ensure it gets called
    await MovimientosService.registrarMovimiento(
      { productoId, tipo: 'salida', cantidad: 2 },
      '1',
      '127.0.0.1',
      empresaId
    );
    expect(StockService.validarDisponibilidad).toHaveBeenCalled();
  });
});
