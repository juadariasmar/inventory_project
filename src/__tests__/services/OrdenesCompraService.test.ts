import { OrdenesCompraService } from '../../services/OrdenesCompraService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';

// auditoria.ts importa transitivamente @neondatabase/auth (ESM no transpilable
// por Jest). Se aisla con un mock, igual que en ProveedoresService.test.
// Nota: recibir() usa tx.auditoria.create (Prisma real), no este modulo.
jest.mock('../../lib/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extraerIp: jest.fn(() => '127.0.0.1'),
}));

describe('OrdenesCompraService', () => {
  let empresaId: string;
  let usuarioCreado = false;
  let categoriaId: number;
  let productoId: number;
  let proveedorId: number;
  const ordenesCreadas: number[] = [];
  const CANTIDAD_INICIAL = 10;

  beforeAll(async () => {
    let emp = await prisma.empresa.findUnique({ where: { id: 'test-empresa-oc-1' } });
    if (!emp) {
      emp = await prisma.empresa.create({ data: { id: 'test-empresa-oc-1', nombre: 'Test Empresa OC' } });
    }
    empresaId = emp.id;

    let u = await prisma.usuario.findUnique({ where: { id: 'test-user-oc-1' } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 'test-user-oc-1', neonAuthId: 'test-neon-auth-oc', nombre: 'Admin OC', email: 'adminOcServTest@example.com', empresaId },
      });
      usuarioCreado = true;
    }

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat OC' } });
    if (!c) {
      c = await prisma.categoria.create({ data: { nombre: 'Test Cat OC', prefijo: 'TCOC', empresaId } });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'OC-PROD-1' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod OC', codigo: 'OC-PROD-1', cantidad: CANTIDAD_INICIAL, precio: 100, categoriaId, empresaId },
      });
    }
    productoId = p.id;

    const prov = await prisma.proveedor.create({ data: { nombre: 'Proveedor OC', empresaId } });
    proveedorId = prov.id;
  });

  afterAll(async () => {
    await prisma.movimiento.deleteMany({ where: { empresaId } });
    if (ordenesCreadas.length) {
      await prisma.ordenCompraItem.deleteMany({ where: { ordenCompraId: { in: ordenesCreadas } } });
    }
    await prisma.ordenCompra.deleteMany({ where: { empresaId } });
    // recibir() escribe auditoria con Prisma real -> limpiar.
    await prisma.auditoria.deleteMany({ where: { empresaId } });
    await prisma.proveedor.deleteMany({ where: { empresaId } });
    if (productoId) await prisma.producto.delete({ where: { id: productoId } });
    if (categoriaId) await prisma.categoria.delete({ where: { id: categoriaId } });
    if (usuarioCreado) await prisma.usuario.delete({ where: { id: 'test-user-oc-1' } });
    await prisma.empresa.delete({ where: { id: 'test-empresa-oc-1' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crear sin ítems lanza AppError', async () => {
    await expect(
      OrdenesCompraService.crear({ proveedorId, items: [] }, '127.0.0.1', empresaId)
    ).rejects.toThrow(AppError);
  });

  it('crear con proveedor inexistente lanza AppError 404', async () => {
    await expect(
      OrdenesCompraService.crear(
        { proveedorId: 999999, items: [{ productoId, cantidad: 2, costoUnitario: 50 }] },
        '127.0.0.1',
        empresaId
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('crear válido devuelve orden BORRADOR con total correcto y NO modifica stock', async () => {
    const antes = await prisma.producto.findUnique({ where: { id: productoId } });

    const orden = await OrdenesCompraService.crear(
      { proveedorId, notas: 'Pedido inicial', items: [{ productoId, cantidad: 3, costoUnitario: 40 }] },
      '127.0.0.1',
      empresaId
    );
    ordenesCreadas.push(orden.id);

    expect(orden.estado).toBe('BORRADOR');
    expect(orden.total).toBe(120); // 3 * 40
    expect(orden.empresaId).toBe(empresaId);
    expect(orden.items).toHaveLength(1);
    expect(orden.items[0].subtotal).toBe(120);

    const despues = await prisma.producto.findUnique({ where: { id: productoId } });
    expect(despues?.cantidad).toBe(antes?.cantidad); // stock intacto
  });

  it('recibir pasa a RECIBIDA, crea Movimiento de entrada con ordenCompraId y aumenta el stock', async () => {
    const orden = await OrdenesCompraService.crear(
      { proveedorId, items: [{ productoId, cantidad: 5, costoUnitario: 30 }] },
      '127.0.0.1',
      empresaId
    );
    ordenesCreadas.push(orden.id);

    const antes = await prisma.producto.findUnique({ where: { id: productoId } });

    const recibida = await OrdenesCompraService.recibir(orden.id, '127.0.0.1', empresaId);
    expect(recibida.estado).toBe('RECIBIDA');

    const movimiento = await prisma.movimiento.findFirst({
      where: { ordenCompraId: orden.id, tipo: 'entrada' },
    });
    expect(movimiento).not.toBeNull();
    expect(movimiento?.cantidad).toBe(5);
    expect(movimiento?.ordenCompraId).toBe(orden.id);

    const despues = await prisma.producto.findUnique({ where: { id: productoId } });
    expect(despues?.cantidad).toBe((antes?.cantidad ?? 0) + 5); // stock aumentó
  });

  it('recibir por segunda vez lanza AppError 409 (idempotencia)', async () => {
    const orden = await OrdenesCompraService.crear(
      { proveedorId, items: [{ productoId, cantidad: 2, costoUnitario: 10 }] },
      '127.0.0.1',
      empresaId
    );
    ordenesCreadas.push(orden.id);

    await OrdenesCompraService.recibir(orden.id, '127.0.0.1', empresaId);
    await expect(
      OrdenesCompraService.recibir(orden.id, '127.0.0.1', empresaId)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('cancelar una orden BORRADOR la pasa a CANCELADA; cancelar una recibida lanza 409', async () => {
    const borrador = await OrdenesCompraService.crear(
      { proveedorId, items: [{ productoId, cantidad: 1, costoUnitario: 5 }] },
      '127.0.0.1',
      empresaId
    );
    ordenesCreadas.push(borrador.id);

    const cancelada = await OrdenesCompraService.cancelar(borrador.id, '127.0.0.1', empresaId);
    expect(cancelada.estado).toBe('CANCELADA');

    const recibida = await OrdenesCompraService.crear(
      { proveedorId, items: [{ productoId, cantidad: 1, costoUnitario: 5 }] },
      '127.0.0.1',
      empresaId
    );
    ordenesCreadas.push(recibida.id);
    await OrdenesCompraService.recibir(recibida.id, '127.0.0.1', empresaId);

    await expect(
      OrdenesCompraService.cancelar(recibida.id, '127.0.0.1', empresaId)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
