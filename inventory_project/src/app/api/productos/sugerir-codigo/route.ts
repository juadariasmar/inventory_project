import { NextRequest, NextResponse } from 'next/server'
import { esAdmin } from '@/lib/permisos'
import { siguienteCodigoConsecutivoPorCategoria } from '@/lib/codigos'

// GET /api/productos/sugerir-codigo?categoria=N
// Devuelve el proximo codigo libre para esa categoria (prefijo-NNNNN).
export async function GET(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const categoriaId = parseInt(request.nextUrl.searchParams.get('categoria') ?? '', 10)
  if (!categoriaId || Number.isNaN(categoriaId)) {
    return NextResponse.json({ error: 'Falta la categoría.' }, { status: 400 })
  }
  try {
    const codigo = await siguienteCodigoConsecutivoPorCategoria(categoriaId)
    return NextResponse.json({ codigo })
  } catch (e) {
    console.error('Error al sugerir código:', e)
    return NextResponse.json(
      { error: 'No se pudo sugerir el código.' },
      { status: 500 }
    )
  }
}
