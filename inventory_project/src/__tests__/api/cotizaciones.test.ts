import { POST } from '../../app/api/cotizaciones/route';
import { createMockRequest } from '../utils/test-utils';
import { NextRequest } from 'next/server';
import { prisma } from '../../lib/db';

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
  tienePermiso: jest.fn().mockResolvedValue(true)
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn().mockResolvedValue({ id: 1, role: 'admin' })
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Cotizaciones API', () => {
  let productoId: number;
  let categoriaId: number;

  beforeAll(async () => {
    const c = await prisma.categoria.create({
      data: { nombre: 'Test Cat Cot', prefijo: 'TCC' }
    });
    categoriaId = c.id;

    const p = await prisma.producto.create({
      data: { nombre: 'Test Cotiz', codigo: 'COT-123', cantidad: 5, precio: 100, categoriaId }
    });
    productoId = p.id;
  });

  afterAll(async () => {
    if (productoId) {
      await prisma.itemCotizacion.deleteMany({ where: { productoId } });
      await prisma.cotizacion.deleteMany({});
      await prisma.producto.delete({ where: { id: productoId } });
    }
    if (categoriaId) {
      await prisma.categoria.delete({ where: { id: categoriaId } });
    }
  });

  it('prevents quote creation if existing active quotes reserve all stock', async () => {
    // 1. Create first valid quote reserving 5 items (all stock)
    const req1 = createMockRequest('http://localhost/api/cotizaciones', 'POST', '127.0.0.1', {
      clienteId: null,
      clienteNombre: 'Cliente 1',
      items: [{ productoId, cantidad: 5, precioUnitario: 100 }]
    });
    const res1 = await POST(req1 as unknown as NextRequest);
    expect(res1.status).toBe(201);

    // 2. Second quote trying to reserve 1 item should fail due to insufficient stock
    const req2 = createMockRequest('http://localhost/api/cotizaciones', 'POST', '127.0.0.1', {
      clienteId: null,
      clienteNombre: 'Cliente 2',
      items: [{ productoId, cantidad: 1, precioUnitario: 100 }]
    });
    const res2 = await POST(req2 as unknown as NextRequest);
    expect(res2.status).toBe(400);
    const data = await res2.json();
    expect(data.error).toContain('insuficiente');
  });
});
