import { GET } from '../../app/api/pdf/orden-compra/[id]/route';
import { OrdenesCompraService } from '../../services/OrdenesCompraService';
import { AppError } from '../../lib/AppError';

jest.mock('../../lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({
    user: { id: 'test-user-pdf-1', estado: 'ACTIVO', empresaId: 'test-empresa-pdf' },
  }),
  esAdmin: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/OrdenesCompraService', () => ({
  OrdenesCompraService: {
    obtenerPorId: jest.fn(),
  },
}));

const ordenEjemplo = {
  id: 7,
  estado: 'BORRADOR',
  total: 350,
  notas: null,
  creadoEn: new Date('2026-06-22T10:00:00Z'),
  empresaId: 'test-empresa-pdf',
  proveedor: { id: 1, nombre: 'Proveedor PDF', nit: '900123', contacto: 'Ana', telefono: '300' },
  items: [
    {
      id: 1,
      productoId: 10,
      cantidad: 5,
      costoUnitario: 50,
      subtotal: 250,
      producto: { nombre: 'Producto A', codigo: 'PA-1' },
    },
    {
      id: 2,
      productoId: 11,
      cantidad: 2,
      costoUnitario: 50,
      subtotal: 100,
      producto: { nombre: 'Producto B', codigo: 'PB-1' },
    },
  ],
};

describe('PDF Orden de Compra API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET con orden válida devuelve 200 y Content-Type application/pdf', async () => {
    (OrdenesCompraService.obtenerPorId as jest.Mock).mockResolvedValue(ordenEjemplo);

    const res = await GET(new Request('http://localhost/api/pdf/orden-compra/7'), {
      params: Promise.resolve({ id: '7' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('GET con orden inexistente o de otra empresa devuelve 404', async () => {
    (OrdenesCompraService.obtenerPorId as jest.Mock).mockRejectedValue(
      new AppError('Orden de compra no encontrada', 404)
    );

    const res = await GET(new Request('http://localhost/api/pdf/orden-compra/999'), {
      params: Promise.resolve({ id: '999' }),
    });

    expect(res.status).toBe(404);
  });
});
