import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { OrdenesCompraService } from '@/services/OrdenesCompraService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

interface Parametros {
  params: Promise<{ id: string }>;
}

// POST - Cancelar una orden de compra en borrador (solo ADMIN)
export async function POST(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const session = await obtenerSesion();
  const empresaId = session?.user?.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const ordenId = parseInt(id, 10);
    if (Number.isNaN(ordenId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const ip = extraerIp(request);
    const orden = await OrdenesCompraService.cancelar(ordenId, ip ?? '127.0.0.1', empresaId);

    revalidatePath('/proveedores/ordenes');

    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al cancelar la orden de compra:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al cancelar la orden de compra' }, { status: 500 });
  }
}
