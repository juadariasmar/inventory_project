import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { OrdenesCompraService } from '@/services/OrdenesCompraService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion } from '@/lib/permisos';

interface Parametros {
  params: Promise<{ id: string }>;
}

const A4 = { width: 595.28, height: 841.89 };
const MARGEN = 50;

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);
}

// GET - Generar el PDF de una orden de compra en memoria
export async function GET(_request: Request, { params }: Parametros) {
  const session = await obtenerSesion();
  if (!session?.user || session.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
  }

  let ordenId: number;
  try {
    const { id } = await params;
    ordenId = parseInt(id, 10);
    if (Number.isNaN(ordenId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  try {
    // obtenerPorId lanza 404 si la orden no existe o pertenece a otra empresa;
    // no se revela la existencia cross-tenant.
    const orden = await OrdenesCompraService.obtenerPorId(ordenId, empresaId);

    const pdf = await PDFDocument.create();
    let page = pdf.addPage([A4.width, A4.height]);
    const fontNormal = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const negro = rgb(0, 0, 0);
    const gris = rgb(0.4, 0.4, 0.4);

    let y = A4.height - MARGEN;

    const linea = (
      texto: string,
      opciones: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}
    ) => {
      const size = opciones.size ?? 11;
      // Si no queda espacio, se crea una nueva página.
      if (y < MARGEN + size) {
        page = pdf.addPage([A4.width, A4.height]);
        y = A4.height - MARGEN;
      }
      page.drawText(texto, {
        x: opciones.x ?? MARGEN,
        y,
        size,
        font: opciones.bold ? fontBold : fontNormal,
        color: opciones.color ?? negro,
      });
      y -= size + 6;
    };

    // Título
    linea(`Orden de Compra #${orden.id}`, { size: 20, bold: true });
    y -= 4;

    // Datos del proveedor
    linea('Proveedor', { size: 13, bold: true });
    linea(orden.proveedor?.nombre ?? '-');
    if (orden.proveedor?.nit) linea(`NIT: ${orden.proveedor.nit}`, { color: gris });
    if (orden.proveedor?.contacto) linea(`Contacto: ${orden.proveedor.contacto}`, { color: gris });
    if (orden.proveedor?.telefono) linea(`Teléfono: ${orden.proveedor.telefono}`, { color: gris });
    y -= 4;

    // Datos de la orden
    linea(`Fecha: ${new Date(orden.creadoEn).toLocaleDateString('es-CO')}`, { color: gris });
    linea(`Estado: ${orden.estado}`, { color: gris });
    y -= 8;

    // Encabezado de la tabla de ítems
    linea('Ítems', { size: 13, bold: true });
    const colProducto = MARGEN;
    const colCantidad = 330;
    const colCosto = 400;
    const colSubtotal = 490;

    const filaTabla = (
      producto: string,
      cantidad: string,
      costo: string,
      subtotal: string,
      bold = false
    ) => {
      const size = 10;
      if (y < MARGEN + size) {
        page = pdf.addPage([A4.width, A4.height]);
        y = A4.height - MARGEN;
      }
      const font = bold ? fontBold : fontNormal;
      page.drawText(producto, { x: colProducto, y, size, font, color: negro });
      page.drawText(cantidad, { x: colCantidad, y, size, font, color: negro });
      page.drawText(costo, { x: colCosto, y, size, font, color: negro });
      page.drawText(subtotal, { x: colSubtotal, y, size, font, color: negro });
      y -= size + 6;
    };

    filaTabla('Producto', 'Cant.', 'Costo', 'Subtotal', true);

    for (const item of orden.items) {
      const nombre = item.producto
        ? `${item.producto.codigo} - ${item.producto.nombre}`
        : `Producto #${item.productoId}`;
      const nombreCorto = nombre.length > 45 ? `${nombre.slice(0, 42)}...` : nombre;
      filaTabla(
        nombreCorto,
        String(item.cantidad),
        formatearMoneda(item.costoUnitario),
        formatearMoneda(item.subtotal)
      );
    }

    y -= 8;
    linea(`Total: ${formatearMoneda(orden.total)}`, { x: colCosto - 30, size: 13, bold: true });

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="orden-compra-${orden.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error al generar el PDF de la orden de compra:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
