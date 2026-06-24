import { GET, POST } from '../../app/api/empresas/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../../app/api/empresas/[id]/route';
import { createMockRequest } from '../utils/test-utils';
import { NextRequest } from 'next/server';
import { prisma } from '../../lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSesion: any = null;
let mockEsAdminValue = true;

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn(() => Promise.resolve(mockSesion)),
  esAdmin: jest.fn(() => Promise.resolve(mockEsAdminValue))
}));

jest.mock('../../lib/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
  extraerIp: jest.fn(() => '127.0.0.1')
}));

describe('Empresas API', () => {
  const createdEmpresaIds: string[] = [];
  const adminEmpresaId: string = 'api-test-admin-empresa';
  const otherEmpresaId: string = 'api-test-other-empresa';
  const adminUserId: string = 'api-test-admin-user';

  beforeAll(async () => {
    // Create admin company
    let adminEmp = await prisma.empresa.findUnique({ where: { id: adminEmpresaId } });
    if (!adminEmp) {
      adminEmp = await prisma.empresa.create({
        data: { id: adminEmpresaId, nombre: 'Admin Empresa Test' }
      });
    }
    createdEmpresaIds.push(adminEmpresaId);

    // Create other company
    let otherEmp = await prisma.empresa.findUnique({ where: { id: otherEmpresaId } });
    if (!otherEmp) {
      otherEmp = await prisma.empresa.create({
        data: { id: otherEmpresaId, nombre: 'Other Empresa Test' }
      });
    }
    createdEmpresaIds.push(otherEmpresaId);

    // Create admin user
    let adminUser = await prisma.usuario.findUnique({ where: { id: adminUserId } });
    if (!adminUser) {
      adminUser = await prisma.usuario.create({
        data: {
          id: adminUserId,
          neonAuthId: 'neon-auth-api-admin',
          nombre: 'Admin API User',
          email: 'adminapi@empresas.com',
          empresaId: adminEmpresaId,
          rol: 'ADMIN',
          estado: 'ACTIVO'
        }
      });
    }

    // Set default mock session to active admin
    mockSesion = {
      user: {
        id: adminUserId,
        nombre: 'Admin API User',
        email: 'adminapi@empresas.com',
        empresaId: adminEmpresaId,
        rol: 'ADMIN',
        estado: 'ACTIVO'
      }
    };
    mockEsAdminValue = true;
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.usuario.deleteMany({ where: { id: adminUserId } });
    // Clean up any companies
    for (const empId of createdEmpresaIds) {
      try {
        await prisma.auditoria.deleteMany({ where: { empresaId: empId } });
        await prisma.usuario.deleteMany({ where: { empresaId: empId } });
        await prisma.producto.deleteMany({ where: { empresaId: empId } });
        await prisma.categoria.deleteMany({ where: { empresaId: empId } });
        await prisma.empresa.deleteMany({ where: { id: empId } });
      } catch {
        // Ignore
      }
    }
  });

  beforeEach(() => {
    // Reset session to active admin
    mockSesion = {
      user: {
        id: adminUserId,
        nombre: 'Admin API User',
        email: 'adminapi@empresas.com',
        empresaId: adminEmpresaId,
        rol: 'ADMIN',
        estado: 'ACTIVO'
      }
    };
    mockEsAdminValue = true;
  });

  describe('GET /api/empresas', () => {
    it('returns list of companies for active ADMIN', async () => {
      const req = createMockRequest('http://localhost/api/empresas', 'GET');
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
    });

    it('returns 403 if user is not ADMIN', async () => {
      mockEsAdminValue = false;
      mockSesion.user.rol = 'USUARIO';

      const req = createMockRequest('http://localhost/api/empresas', 'GET');
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(403);
    });

    it('returns 403 if user is suspended/inactive admin', async () => {
      mockEsAdminValue = false;
      mockSesion.user.estado = 'SUSPENDIDO';

      const req = createMockRequest('http://localhost/api/empresas', 'GET');
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/empresas', () => {
    it('creates a new company for active ADMIN', async () => {
      const req = createMockRequest('http://localhost/api/empresas', 'POST', '127.0.0.1', {
        nombre: 'Nueva Empresa API'
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.nombre).toBe('Nueva Empresa API');
      createdEmpresaIds.push(data.id);
    });

    it('returns 400 if name is empty', async () => {
      const req = createMockRequest('http://localhost/api/empresas', 'POST', '127.0.0.1', {
        nombre: ''
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(400);
    });

    it('returns 403 if not ADMIN', async () => {
      mockEsAdminValue = false;
      const req = createMockRequest('http://localhost/api/empresas', 'POST', '127.0.0.1', {
        nombre: 'Intento de creacion'
      });
      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/empresas/[id]', () => {
    it('returns company details for active ADMIN', async () => {
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'GET');
      const res = await GET_BY_ID(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(otherEmpresaId);
    });

    it('returns 404 if company does not exist', async () => {
      const req = createMockRequest('http://localhost/api/empresas/inexistente', 'GET');
      const res = await GET_BY_ID(req as unknown as NextRequest, { params: Promise.resolve({ id: 'inexistente' }) });
      expect(res.status).toBe(404);
    });

    it('returns 403 if not ADMIN', async () => {
      mockEsAdminValue = false;
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'GET');
      const res = await GET_BY_ID(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/empresas/[id]', () => {
    it('updates company for active ADMIN', async () => {
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'PUT', '127.0.0.1', {
        nombre: 'Nombre Actualizado API'
      });
      const res = await PUT(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.nombre).toBe('Nombre Actualizado API');
    });

    it('returns 400 if updated name is empty', async () => {
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'PUT', '127.0.0.1', {
        nombre: ''
      });
      const res = await PUT(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(400);
    });

    it('returns 403 if not ADMIN', async () => {
      mockEsAdminValue = false;
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'PUT', '127.0.0.1', {
        nombre: 'Fallo admin'
      });
      const res = await PUT(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/empresas/[id]', () => {
    it('deletes company with no users or products', async () => {
      const emp = await prisma.empresa.create({ data: { nombre: 'Borrar API' } });
      createdEmpresaIds.push(emp.id);

      const req = createMockRequest(`http://localhost/api/empresas/${emp.id}`, 'DELETE', '127.0.0.1');
      const res = await DELETE(req as unknown as NextRequest, { params: Promise.resolve({ id: emp.id }) });
      expect(res.status).toBe(200);

      // Verify DB
      const check = await prisma.empresa.findUnique({ where: { id: emp.id } });
      expect(check).toBeNull();
    });

    it('returns 400 if user tries to delete their own company', async () => {
      const req = createMockRequest(`http://localhost/api/empresas/${adminEmpresaId}`, 'DELETE', '127.0.0.1');
      const res = await DELETE(req as unknown as NextRequest, { params: Promise.resolve({ id: adminEmpresaId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('No puedes eliminar tu propia empresa');
    });

    it('returns 400 if users are associated', async () => {
      const emp = await prisma.empresa.create({ data: { nombre: 'Con Usuario API' } });
      createdEmpresaIds.push(emp.id);

      const usr = await prisma.usuario.create({
        data: {
          id: 'test-user-api-asoc',
          neonAuthId: 'neon-auth-api-asoc',
          nombre: 'Usr Asoc',
          email: 'usr_asoc@emp.com',
          empresaId: emp.id
        }
      });

      const req = createMockRequest(`http://localhost/api/empresas/${emp.id}`, 'DELETE', '127.0.0.1');
      const res = await DELETE(req as unknown as NextRequest, { params: Promise.resolve({ id: emp.id }) });
      expect(res.status).toBe(400);

      // Clean up
      await prisma.usuario.delete({ where: { id: usr.id } });
    });

    it('returns 403 if not ADMIN', async () => {
      mockEsAdminValue = false;
      const req = createMockRequest(`http://localhost/api/empresas/${otherEmpresaId}`, 'DELETE', '127.0.0.1');
      const res = await DELETE(req as unknown as NextRequest, { params: Promise.resolve({ id: otherEmpresaId }) });
      expect(res.status).toBe(403);
    });
  });
});
