import { POST } from '../../app/api/movimientos/route';
import { createMockRequest } from '../utils/test-utils';
import { NextRequest } from 'next/server';
import { prisma } from '../../lib/db';

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
  tienePermiso: jest.fn().mockResolvedValue(true)
}));

// Mock NextAuth to avoid the error 'jose' package issues or edge runtime issues in tests
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn().mockResolvedValue({ id: 1, role: 'admin' })
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Movimientos API', () => {
  let productoId: number;
  let categoriaId: number;
  let usuarioId: number;

  beforeAll(async () => {
    let u = await prisma.usuario.findUnique({ where: { id: 1 } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 1, nombre: 'Admin', nombreUsuario: 'adminTestMov', contrasena: '1234' }
      });
    }
    usuarioId = u.id;

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Mov' } });
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Mov', prefijo: 'TCM' }
      });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'TEST-MOV' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod Mov', codigo: 'TEST-MOV', cantidad: 10, precio: 100, categoriaId }
      });
    }
    productoId = p.id;
  });

  afterAll(async () => {
    if (productoId) {
      await prisma.movimiento.deleteMany({ where: { productoId } });
      await prisma.producto.delete({ where: { id: productoId } });
    }
    if (categoriaId) {
      await prisma.categoria.delete({ where: { id: categoriaId } });
    }
    if (usuarioId) {
      await prisma.auditoria.deleteMany({ where: { usuarioId } });
      await prisma.usuario.delete({ where: { id: usuarioId } });
    }
  });

  it('prevents exit movement if stock is insufficient', async () => {
    const req = createMockRequest('http://localhost/api/movimientos', 'POST', '127.0.0.1', {
      productoId,
      tipo: 'salida',
      cantidad: 50 // more than 10
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('suficiente');
  });

  it('allows entry movement', async () => {
    const req = createMockRequest('http://localhost/api/movimientos', 'POST', '127.0.0.1', {
      productoId,
      tipo: 'entrada',
      cantidad: 5
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(201);
  });
});
