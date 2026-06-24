import { EmpresasService } from '../../services/EmpresasService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';
import { registrarAuditoria } from '../../lib/auditoria';

jest.mock('../../lib/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined)
}));

describe('EmpresasService', () => {
  const createdEmpresaIds: string[] = [];
  const testUsuarioId: string = 'test-user-empresas-service';

  beforeAll(async () => {
    // Ensure we have a test user to associate audits/actions
    const existingUser = await prisma.usuario.findUnique({ where: { id: testUsuarioId } });
    if (!existingUser) {
      const tempEmp = await prisma.empresa.create({
        data: { id: 'temp-emp-for-user', nombre: 'Temp Empresa' }
      });
      createdEmpresaIds.push(tempEmp.id);

      await prisma.usuario.create({
        data: {
          id: testUsuarioId,
          neonAuthId: 'neon-auth-empresas-service',
          nombre: 'Test User',
          email: 'testuser@empresasservice.com',
          empresaId: tempEmp.id,
          estado: 'ACTIVO',
          rol: 'ADMIN'
        }
      });
    }
  });

  afterAll(async () => {
    // Cleanup the test user
    await prisma.usuario.deleteMany({ where: { id: testUsuarioId } });
    // Cleanup any companies created during the test using deleteMany to avoid throwing if already deleted
    for (const empId of createdEmpresaIds) {
      try {
        await prisma.usuario.deleteMany({ where: { empresaId: empId } });
        await prisma.producto.deleteMany({ where: { empresaId: empId } });
        await prisma.categoria.deleteMany({ where: { empresaId: empId } });
        await prisma.empresa.deleteMany({ where: { id: empId } });
      } catch {
        // Ignore
      }
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerTodas', () => {
    it('should list all companies', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa Test Lista' }
      });
      createdEmpresaIds.push(emp.id);

      const todas = await EmpresasService.obtenerTodas();
      expect(todas.length).toBeGreaterThanOrEqual(1);
      const found = todas.find(e => e.id === emp.id);
      expect(found).toBeDefined();
      expect(found?.nombre).toBe('Empresa Test Lista');
    });
  });

  describe('obtenerPorId', () => {
    it('should return a company by id', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa Test Por Id' }
      });
      createdEmpresaIds.push(emp.id);

      const found = await EmpresasService.obtenerPorId(emp.id);
      expect(found).toBeDefined();
      expect(found.nombre).toBe('Empresa Test Por Id');
    });

    it('should throw a 404 AppError if company does not exist', async () => {
      await expect(EmpresasService.obtenerPorId('inexistente-id')).rejects.toThrow(
        new AppError('Empresa no encontrada', 404)
      );
    });
  });

  describe('crear', () => {
    it('should create a company with valid name and log audit', async () => {
      const nombre = 'Empresa Creada Test';
      const ip = '127.0.0.1';
      const result = await EmpresasService.crear({ nombre }, ip, testUsuarioId);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.nombre).toBe(nombre);
      createdEmpresaIds.push(result.id);

      // Verify audit call
      expect(registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CREAR',
          entidad: 'Empresa',
          entidadId: result.id,
          usuarioId: testUsuarioId,
          ip,
          empresaId: result.id
        })
      );
    });

    it('should throw a 400 AppError if name is empty or only whitespace', async () => {
      await expect(EmpresasService.crear({ nombre: '' }, '127.0.0.1', testUsuarioId)).rejects.toThrow(
        new AppError('El nombre de la empresa es obligatorio', 400)
      );
      await expect(EmpresasService.crear({ nombre: '   ' }, '127.0.0.1', testUsuarioId)).rejects.toThrow(
        new AppError('El nombre de la empresa es obligatorio', 400)
      );
    });
  });

  describe('actualizar', () => {
    it('should update a company and log audit', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa Antes' }
      });
      createdEmpresaIds.push(emp.id);

      const ip = '127.0.0.1';
      const updated = await EmpresasService.actualizar(
        emp.id,
        { nombre: 'Empresa Despues' },
        ip,
        testUsuarioId
      );
      expect(updated.nombre).toBe('Empresa Despues');

      // Verify audit call
      expect(registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ACTUALIZAR',
          entidad: 'Empresa',
          entidadId: emp.id,
          usuarioId: testUsuarioId,
          ip,
          empresaId: emp.id
        })
      );
    });

    it('should throw a 400 AppError if updated name is empty or whitespace', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa Valida' }
      });
      createdEmpresaIds.push(emp.id);

      await expect(
        EmpresasService.actualizar(emp.id, { nombre: '' }, '127.0.0.1', testUsuarioId)
      ).rejects.toThrow(new AppError('El nombre de la empresa es obligatorio', 400));

      await expect(
        EmpresasService.actualizar(emp.id, { nombre: '   ' }, '127.0.0.1', testUsuarioId)
      ).rejects.toThrow(new AppError('El nombre de la empresa es obligatorio', 400));
    });

    it('should throw a 404 AppError if company does not exist', async () => {
      await expect(
        EmpresasService.actualizar('inexistente', { nombre: 'Empresa Nueva' }, '127.0.0.1', testUsuarioId)
      ).rejects.toThrow(new AppError('Empresa no encontrada', 404));
    });
  });

  describe('eliminar', () => {
    it('should delete a company if no users or products are associated, and log audit', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa para Eliminar' }
      });
      createdEmpresaIds.push(emp.id);

      const ip = '127.0.0.1';
      const deleted = await EmpresasService.eliminar(emp.id, ip, testUsuarioId);
      expect(deleted.id).toBe(emp.id);

      // Verify deleted from db
      const dbEmp = await prisma.empresa.findUnique({ where: { id: emp.id } });
      expect(dbEmp).toBeNull();

      // Verify audit call
      expect(registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'ELIMINAR',
          entidad: 'Empresa',
          entidadId: emp.id,
          usuarioId: testUsuarioId,
          ip,
          empresaId: emp.id
        })
      );
    });

    it('should throw a 400 AppError if users are associated', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa con Usuario' }
      });
      createdEmpresaIds.push(emp.id);

      const user = await prisma.usuario.create({
        data: {
          id: 'test-user-asociado',
          neonAuthId: 'neon-auth-asociado',
          nombre: 'Asociado',
          email: 'asociado@test.com',
          empresaId: emp.id
        }
      });

      await expect(
        EmpresasService.eliminar(emp.id, '127.0.0.1', testUsuarioId)
      ).rejects.toThrow(AppError);

      // Cleanup user
      await prisma.usuario.delete({ where: { id: user.id } });
    });

    it('should throw a 400 AppError if products are associated', async () => {
      const emp = await prisma.empresa.create({
        data: { nombre: 'Empresa con Producto' }
      });
      createdEmpresaIds.push(emp.id);

      const cat = await prisma.categoria.create({
        data: { nombre: 'Cat Empresa', prefijo: 'CEMP', empresaId: emp.id }
      });

      const prod = await prisma.producto.create({
        data: {
          nombre: 'Prod Empresa',
          codigo: 'P-EMP',
          precio: 10,
          cantidad: 5,
          categoriaId: cat.id,
          empresaId: emp.id
        }
      });

      await expect(
        EmpresasService.eliminar(emp.id, '127.0.0.1', testUsuarioId)
      ).rejects.toThrow(AppError);

      // Cleanup
      await prisma.producto.delete({ where: { id: prod.id } });
      await prisma.categoria.delete({ where: { id: cat.id } });
    });
  });
});
