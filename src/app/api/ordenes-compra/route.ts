import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { OrdenesCompraService } from '@/services/OrdenesCompraService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

// GET - Obtener todas las órdenes de compra
export async function GET() {
  const session = await obtenerSesion();
  if (!session?.user || session.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const empresaId = session.user.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
  }

  try {
    const ordenes = await OrdenesCompraService.obtenerTodos(empresaId);
    return NextResponse.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear una nueva orden de compra (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const session = await obtenerSesion();
  const empresaId = session?.user?.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const ip = extraerIp(request);

    const orden = await OrdenesCompraService.crear(data, ip ?? '127.0.0.1', empresaId);

    revalidatePath('/proveedores/ordenes');

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear la orden de compra' }, { status: 500 });
  }
}
