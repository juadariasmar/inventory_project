import { NextResponse } from 'next/server';
import { OrdenesCompraService } from '@/services/OrdenesCompraService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion } from '@/lib/permisos';

interface Parametros {
  params: Promise<{ id: string }>;
}

// GET - Obtener una orden de compra por id
export async function GET(_request: Request, { params }: Parametros) {
  const session = await obtenerSesion();
  if (!session?.user || session.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const ordenId = parseInt(id, 10);
    if (Number.isNaN(ordenId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const orden = await OrdenesCompraService.obtenerPorId(ordenId, empresaId);
    return NextResponse.json(orden);
  } catch (error) {
    console.error('Error al obtener la orden de compra:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
