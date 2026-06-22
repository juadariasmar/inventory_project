import { UsuariosService } from '../../services/UsuariosService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';
import bcrypt from 'bcryptjs';

describe('UsuariosService', () => {
  let adminId: number;
  let testUserId: number;

  beforeAll(async () => {
    let u = await prisma.usuario.findFirst({ where: { email: 'adminUsuariosTest' } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { nombre: 'Admin', email: 'adminUsuariosTest' }
      });
    }
    adminId = u.id;
  });

  afterAll(async () => {
    if (adminId) {
      await prisma.usuario.delete({ where: { id: adminId } });
    }
    if (testUserId) {
      const exists = await prisma.usuario.findUnique({ where: { id: testUserId } });
      if (exists) {
        await prisma.usuario.delete({ where: { id: testUserId } });
      }
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crearUsuario throws error if password is too weak', async () => {
    const datos = { email: 'testuser', nombre: 'Test' };
    await expect(UsuariosService.crearUsuario(datos)).rejects.toThrow(AppError);
  });

  it('crearUsuario succeeds with strong password', async () => {
    const datos = { email: 'testuser1', nombre: 'Test 1' };
    const user = await UsuariosService.crearUsuario(datos);
    expect(user).toBeDefined();
    expect(user.email).toBe('testuser1');
    testUserId = user.id;
  });

  it('actualizarUsuario throws error if user not found', async () => {
    await expect(UsuariosService.actualizarUsuario(-999, { nombre: 'Updated' })).rejects.toThrow(AppError);
  });

  it('actualizarUsuario succeeds', async () => {
    const updated = await UsuariosService.actualizarUsuario(testUserId, { nombre: 'Test 1 Updated' });
    expect(updated.nombre).toBe('Test 1 Updated');
  });

  it('eliminarUsuario prevents deleting oneself', async () => {
    await expect(UsuariosService.eliminarUsuario(testUserId, testUserId)).rejects.toThrow(AppError);
  });

  it('eliminarUsuario succeeds', async () => {
    const success = await UsuariosService.eliminarUsuario(testUserId, adminId);
    expect(success).toBe(true);
  });
});
