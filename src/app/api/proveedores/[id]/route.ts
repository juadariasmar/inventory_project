import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ProveedoresService } from '@/services/ProveedoresService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

interface Parametros {
  params: Promise<{ id: string }>;
}

// PUT - Actualizar un proveedor (solo ADMIN)
export async function PUT(request: NextRequest, { params }: Parametros) {
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
    const proveedorId = parseInt(id, 10);
    if (Number.isNaN(proveedorId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const data = await request.json();
    const ip = extraerIp(request);

    const proveedor = await ProveedoresService.actualizar(proveedorId, data, ip ?? '127.0.0.1', empresaId);

    revalidatePath('/proveedores');

    return NextResponse.json(proveedor);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al actualizar el proveedor' }, { status: 500 });
  }
}

// DELETE - Eliminar un proveedor (solo ADMIN)
export async function DELETE(request: NextRequest, { params }: Parametros) {
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
    const proveedorId = parseInt(id, 10);
    if (Number.isNaN(proveedorId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
    }

    const ip = extraerIp(request);

    const resultado = await ProveedoresService.eliminar(proveedorId, ip ?? '127.0.0.1', empresaId);

    revalidatePath('/proveedores');

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al eliminar el proveedor' }, { status: 500 });
  }
}
