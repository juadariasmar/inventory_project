import { NextRequest, NextResponse } from 'next/server';
import { esSuperAdmin, obtenerSesion } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';
import { EmpresasService } from '@/services/EmpresasService';
import { AppError } from '@/lib/AppError';

interface Parametros {
  params: Promise<{ id: string }>;
}

// GET - Obtener detalle de una empresa (solo superadmin)
export async function GET(request: NextRequest, { params }: Parametros) {
  if (!(await esSuperAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const empresa = await EmpresasService.obtenerPorId(id);
    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error al obtener detalle de empresa:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al obtener detalle de empresa' }, { status: 500 });
  }
}

// PUT - Actualizar una empresa (solo superadmin)
export async function PUT(request: NextRequest, { params }: Parametros) {
  if (!(await esSuperAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const datos = await request.json();
    const ip = extraerIp(request) || '127.0.0.1';
    const sesion = await obtenerSesion();
    const usuarioId = sesion?.user?.id || '';

    const empresa = await EmpresasService.actualizar(id, datos, ip, usuarioId);
    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}

// DELETE - Eliminar una empresa (solo superadmin)
export async function DELETE(request: NextRequest, { params }: Parametros) {
  if (!(await esSuperAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const sesion = await obtenerSesion();
    const adminEmpresaId = sesion?.user?.empresaId;

    if (id === adminEmpresaId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia empresa' },
        { status: 400 }
      );
    }

    const ip = extraerIp(request) || '127.0.0.1';
    const usuarioId = sesion?.user?.id || '';

    const empresa = await EmpresasService.eliminar(id, ip, usuarioId);
    return NextResponse.json(empresa);
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al eliminar empresa' }, { status: 500 });
  }
}
