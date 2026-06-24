import { NextRequest, NextResponse } from 'next/server';
import { esAdmin, obtenerSesion } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';
import { EmpresasService } from '@/services/EmpresasService';
import { AppError } from '@/lib/AppError';

// GET - Listar todas las empresas (solo ADMIN activo)
export async function GET(_request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const empresas = await EmpresasService.obtenerTodas();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

// POST - Crear una nueva empresa (solo ADMIN activo)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const datos = await request.json();
    const ip = extraerIp(request) || '127.0.0.1';
    const sesion = await obtenerSesion();
    const usuarioId = sesion?.user?.id || '';

    const empresa = await EmpresasService.crear(datos, ip, usuarioId);
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear empresa' }, { status: 500 });
  }
}
