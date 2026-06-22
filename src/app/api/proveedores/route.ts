import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ProveedoresService } from '@/services/ProveedoresService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

// GET - Obtener todos los proveedores
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
    const proveedores = await ProveedoresService.obtenerTodos(empresaId);
    return NextResponse.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear un nuevo proveedor (solo ADMIN)
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

    const proveedor = await ProveedoresService.crear(data, ip ?? '127.0.0.1', empresaId);

    revalidatePath('/proveedores');

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear el proveedor' }, { status: 500 });
  }
}
