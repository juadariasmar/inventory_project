import { ProveedoresService } from '../../services/ProveedoresService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';

// La auditoría es un efecto colateral de "fire and forget" que arrastra la
// cadena de Neon Auth (ESM no transpilable por Jest). Se aísla con un mock.
jest.mock('../../lib/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
}));

describe('ProveedoresService', () => {
  let empresaId: string;
  let otraEmpresaId: string;
  const creados: number[] = [];

  beforeAll(async () => {
    let emp = await prisma.empresa.findUnique({ where: { id: 'test-empresa-prov-1' } });
    if (!emp) {
      emp = await prisma.empresa.create({ data: { id: 'test-empresa-prov-1', nombre: 'Test Empresa Prov' } });
    }
    empresaId = emp.id;

    let otra = await prisma.empresa.findUnique({ where: { id: 'test-empresa-prov-2' } });
    if (!otra) {
      otra = await prisma.empresa.create({ data: { id: 'test-empresa-prov-2', nombre: 'Test Empresa Prov 2' } });
    }
    otraEmpresaId = otra.id;
  });

  afterAll(async () => {
    for (const id of creados) {
      await prisma.proveedor.deleteMany({ where: { id } });
    }
    await prisma.proveedor.deleteMany({ where: { empresaId } });
    await prisma.proveedor.deleteMany({ where: { empresaId: otraEmpresaId } });
    await prisma.empresa.delete({ where: { id: 'test-empresa-prov-1' } });
    await prisma.empresa.delete({ where: { id: 'test-empresa-prov-2' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('obtenerTodos requiere empresaId', async () => {
    await expect(ProveedoresService.obtenerTodos('')).rejects.toThrow(AppError);
  });

  it('crear sin nombre lanza AppError', async () => {
    await expect(ProveedoresService.crear({ nombre: '   ' }, 'test', empresaId)).rejects.toThrow(AppError);
    await expect(ProveedoresService.crear({}, 'test', empresaId)).rejects.toThrow(AppError);
  });

  it('crear con nombre válido devuelve el proveedor con id y empresaId correcto', async () => {
    const p = await ProveedoresService.crear(
      { nombre: '  Proveedor Uno  ', nit: '900123', contacto: 'Ana', telefono: '300', email: 'a@a.com', direccion: 'Calle 1' },
      'test',
      empresaId
    );
    creados.push(p.id);

    expect(p).toBeDefined();
    expect(p.id).toBeDefined();
    expect(p.empresaId).toBe(empresaId);
    expect(p.nombre).toBe('Proveedor Uno');
    expect(p.nit).toBe('900123');
  });

  it('obtenerPorId de otra empresa o inexistente lanza AppError 404', async () => {
    const ajeno = await ProveedoresService.crear({ nombre: 'Proveedor Ajeno' }, 'test', otraEmpresaId);
    creados.push(ajeno.id);

    await expect(ProveedoresService.obtenerPorId(ajeno.id, empresaId)).rejects.toThrow(AppError);
    await expect(ProveedoresService.obtenerPorId(999999, empresaId)).rejects.toThrow(AppError);
  });

  it('actualizar cambia el nombre y lo persiste', async () => {
    const p = await ProveedoresService.crear({ nombre: 'Antes' }, 'test', empresaId);
    creados.push(p.id);

    const actualizado = await ProveedoresService.actualizar(p.id, { nombre: 'Despues' }, 'test', empresaId);
    expect(actualizado.nombre).toBe('Despues');

    const recargado = await ProveedoresService.obtenerPorId(p.id, empresaId);
    expect(recargado.nombre).toBe('Despues');
  });

  it('eliminar borra un proveedor sin órdenes', async () => {
    const p = await ProveedoresService.crear({ nombre: 'Para borrar' }, 'test', empresaId);

    const resultado = await ProveedoresService.eliminar(p.id, 'test', empresaId);
    expect(resultado).toEqual({ ok: true });

    await expect(ProveedoresService.obtenerPorId(p.id, empresaId)).rejects.toThrow(AppError);
  });
});
