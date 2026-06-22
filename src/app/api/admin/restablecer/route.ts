import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

// POST /api/admin/restablecer
//   body: { confirmacion: "RESTABLECER" }
//
// Restablece la BD al estado de "empresa nueva":
//   BORRA en transaccion: cotizaciones + items, ventas + items,
//     movimientos, productos, categorias, auditoria
//   CONSERVA: usuarios y sus permisos
//
// Solo ADMIN. La frase de confirmacion debe ser exactamente "RESTABLECER".
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'Solo un administrador puede restablecer.' }, { status: 403 })
  }

  try {
    const datos = await request.json().catch(() => ({}))
    const expectedToken = process.env.RESET_TOKEN

    if (!expectedToken || datos.token !== expectedToken) {
      return NextResponse.json(
        { error: 'Token de seguridad inválido o faltante.' },
        { status: 403 }
      )
    }

    if (datos.confirmacion !== 'RESTABLECER') {
      return NextResponse.json(
        { error: 'Confirmación inválida. Escribe exactamente "RESTABLECER".' },
        { status: 400 }
      )
    }

    // Conteo previo para reportar al usuario.
    const [productos, categorias, movimientos, ventas, cotizaciones, auditorias] =
      await Promise.all([
        prisma.producto.count({ where: { empresaId } }),
        prisma.categoria.count({ where: { empresaId } }),
        prisma.movimiento.count({ where: { empresaId } }),
        prisma.venta.count({ where: { empresaId } }),
        prisma.cotizacion.count({ where: { empresaId } }),
        prisma.auditoria.count({ where: { empresaId } }),
      ])

    // Orden: hijos antes que padres por las FK.
    await prisma.$transaction(async (tx) => {
      await tx.itemCotizacion.deleteMany({ where: { cotizacion: { empresaId } } })
      await tx.cotizacion.deleteMany({ where: { empresaId } })
      await tx.itemVenta.deleteMany({ where: { venta: { empresaId } } })
      // Movimientos antes de ventas: tienen FK opcional a venta pero el
      // cascade es SetNull; igual los borramos para limpieza total.
      await tx.movimiento.deleteMany({ where: { empresaId } })
      await tx.venta.deleteMany({ where: { empresaId } })
      await tx.producto.deleteMany({ where: { empresaId } })
      await tx.categoria.deleteMany({ where: { empresaId } })
      // Auditoria al final: si algun paso anterior falla, el registro
      // historico se conserva.
      await tx.auditoria.deleteMany({ where: { empresaId } })
    })

    // Invalidar todas las paginas que dependen de estos datos.
    revalidatePath('/', 'layout')

    return NextResponse.json({
      ok: true,
      borrados: {
        productos,
        categorias,
        movimientos,
        ventas,
        cotizaciones,
        auditorias,
      },
    })
  } catch (error) {
    console.error('Error al restablecer datos:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la base de datos.' },
      { status: 500 }
    )
  }
}
