import { UsuariosService } from '../../services/UsuariosService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';

describe('UsuariosService', () => {
  let adminId: string;
  let testUserId: string;
  let empresaId: string;

  beforeAll(async () => {
    let emp = await prisma.empresa.findUnique({ where: { id: 'test-empresa-usrv-1' } });
    if (!emp) {
      emp = await prisma.empresa.create({ data: { id: 'test-empresa-usrv-1', nombre: 'Test Empresa USrv' } });
    }
    empresaId = emp.id;

    let u = await prisma.usuario.findFirst({ where: { email: 'adminUsuariosTest' } });
    if (!u) {
      u = await prisma.usuario.create({
        data: { neonAuthId: 'test-admin', nombre: 'Admin', email: 'adminUsuariosTest', empresaId }
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
    await prisma.empresa.delete({ where: { id: 'test-empresa-usrv-1' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('crearUsuario succeeds', async () => {
    const datos = { email: 'testuser1', nombre: 'Test 1' };
    const user = await UsuariosService.crearUsuario(datos, empresaId);
    expect(user).toBeDefined();
    expect(user.email).toBe('testuser1');
    testUserId = user.id;
  });

  it('actualizarUsuario throws error if user not found', async () => {
    await expect(UsuariosService.actualizarUsuario('-999', { nombre: 'Updated' }, empresaId)).rejects.toThrow(AppError);
  });

  it('actualizarUsuario succeeds', async () => {
    const updated = await UsuariosService.actualizarUsuario(testUserId, { nombre: 'Test 1 Updated' }, empresaId);
    expect(updated.nombre).toBe('Test 1 Updated');
  });

  it('eliminarUsuario prevents deleting oneself', async () => {
    await expect(UsuariosService.eliminarUsuario(testUserId, testUserId, empresaId)).rejects.toThrow(AppError);
  });

  it('eliminarUsuario succeeds', async () => {
    const success = await UsuariosService.eliminarUsuario(testUserId, adminId, empresaId);
    expect(success).toBe(true);
  });
});
