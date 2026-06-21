import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CategoriasService } from '@/services/CategoriasService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

// GET - Obtener todas las categorías
export async function GET() {
  const session = await obtenerSesion();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const categorias = await CategoriasService.obtenerTodos();
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear una nueva categoría (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const ip = extraerIp(request);
    
    const categoria = await CategoriasService.crear(data, ip);

    revalidatePath('/categorias');
    revalidatePath('/productos/categorias');
    revalidatePath('/productos/nuevo');
    revalidatePath('/productos', 'layout');

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
