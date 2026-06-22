import { POST } from '../../app/api/movimientos/route';
import { createMockRequest } from '../utils/test-utils';
import { NextRequest } from 'next/server';
import { prisma } from '../../lib/db';

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 'test-user-mov-1', role: 'admin', empresaId: 'test-empresa-mov-api' } }),
  tienePermiso: jest.fn().mockResolvedValue(true)
}));



jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Movimientos API', () => {
  let productoId: number;
  let categoriaId: number;
  let usuarioId: string;
  let empresaId: string;

  beforeAll(async () => {
    let emp = await prisma.empresa.findUnique({ where: { id: 'test-empresa-mov-api' } });
    if (!emp) {
      emp = await prisma.empresa.create({ data: { id: 'test-empresa-mov-api', nombre: 'Test Empresa Mov API' } });
    }
    empresaId = emp.id;

    let u = await prisma.usuario.findUnique({ where: { id: 'test-user-mov-1' } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { id: 'test-user-mov-1', neonAuthId: 'test-neon-auth-mov', nombre: 'Admin Mov', email: 'adminMovTest@example.com', empresaId }
      });
    }
    usuarioId = u.id;

    let c = await prisma.categoria.findFirst({ where: { nombre: 'Test Cat Mov' } });
    if (!c) {
      c = await prisma.categoria.create({
        data: { nombre: 'Test Cat Mov', prefijo: 'TCM', empresaId }
      });
    }
    categoriaId = c.id;

    let p = await prisma.producto.findFirst({ where: { codigo: 'TEST-MOV' } });
    if (!p) {
      p = await prisma.producto.create({
        data: { nombre: 'Test Prod Mov', codigo: 'TEST-MOV', cantidad: 10, precio: 100, categoriaId, empresaId }
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
      await prisma.usuario.deleteMany({ where: { id: usuarioId } });
    }
    await prisma.empresa.delete({ where: { id: 'test-empresa-mov-api' } });
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
