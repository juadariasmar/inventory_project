import { NextResponse } from 'next/server';
import { CategoriasService } from '@/services/CategoriasService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';

export async function GET() {
  try {
    const session = await obtenerSesion();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const categorias = await CategoriasService.obtenerTodos();
    return NextResponse.json(categorias);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await obtenerSesion();
    const isAdmin = await esAdmin();
    if (!session || !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const categoria = await CategoriasService.crear(data);
    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
