import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { parsearCsv } from '@/lib/csv'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface ResultadoFila {
  linea: number
  codigo: string
  nombre: string
  estado: 'creado' | 'error'
  mensaje?: string
  productoId?: number
}

const CAMPOS_REQUERIDOS = ['codigo', 'nombre', 'precio']

export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json()
    const csv = typeof datos.csv === 'string' ? datos.csv : ''
    if (!csv.trim()) {
      return NextResponse.json(
        { error: 'El archivo está vacío.' },
        { status: 400 }
      )
    }

    const { encabezados, filas } = parsearCsv(csv)
    const faltantes = CAMPOS_REQUERIDOS.filter((c) => !encabezados.includes(c))
    if (faltantes.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan columnas requeridas en el CSV: ${faltantes.join(', ')}. Descarga la plantilla para ver el formato.`,
        },
        { status: 400 }
      )
    }

    const categorias = await prisma.categoria.findMany()
    const mapaCategorias = new Map(
      categorias.map((c) => [c.nombre.toLowerCase().trim(), c.id])
    )

    const resultados: ResultadoFila[] = []
    const ip = extraerIp(request)

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i]
      const numLinea = i + 2 // +1 por el encabezado, +1 por 1-based
      const codigo = (fila.codigo ?? '').trim()
      const nombre = (fila.nombre ?? '').trim()
      const descripcion = (fila.descripcion ?? '').trim() || null
      const precioStr = (fila.precio ?? '').trim()
      const cantidadStr = (fila.cantidad ?? '').trim()
      const stockMinimoStr = (fila.stockminimo ?? '').trim()
      const categoriaNombre = (fila.categoria ?? '').trim()

      if (!codigo) {
        resultados.push({
          linea: numLinea,
          codigo: '',
          nombre,
          estado: 'error',
          mensaje: 'Falta el código.',
        })
        continue
      }
      if (!nombre) {
        resultados.push({
          linea: numLinea,
          codigo,
          nombre: '',
          estado: 'error',
          mensaje: 'Falta el nombre.',
        })
        continue
      }
      const precio = parseFloat(precioStr)
      if (Number.isNaN(precio) || precio < 0) {
        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'error',
          mensaje: `Precio inválido: "${precioStr}".`,
        })
        continue
      }
      const cantidad = cantidadStr === '' ? 0 : parseInt(cantidadStr)
      if (Number.isNaN(cantidad) || cantidad < 0) {
        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'error',
          mensaje: `Cantidad inválida: "${cantidadStr}".`,
        })
        continue
      }
      const stockMinimo = stockMinimoStr === '' ? 1 : parseInt(stockMinimoStr)
      if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'error',
          mensaje: `Stock mínimo inválido: "${stockMinimoStr}".`,
        })
        continue
      }

      let categoriaId: number | null = null
      let mensajeCategoria = ''
      if (categoriaNombre) {
        const id = mapaCategorias.get(categoriaNombre.toLowerCase())
        if (id) {
          categoriaId = id
        } else {
          mensajeCategoria = ` Categoría "${categoriaNombre}" no existe; el producto se creó sin categoría.`
        }
      }

      // Verificar codigo duplicado
      const existente = await prisma.producto.findUnique({ where: { codigo } })
      if (existente) {
        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'error',
          mensaje: `Ya existe un producto con código "${codigo}".`,
        })
        continue
      }

      try {
        const producto = await prisma.$transaction(async (tx) => {
          const nuevo = await tx.producto.create({
            data: {
              nombre,
              descripcion,
              codigo,
              precio,
              cantidad,
              stockMinimo,
              categoriaId,
            },
          })
          if (cantidad > 0) {
            await tx.movimiento.create({
              data: {
                productoId: nuevo.id,
                tipo: 'entrada',
                cantidad,
                notas: 'Stock inicial (importación CSV)',
              },
            })
          }
          return nuevo
        })

        await registrarAuditoria({
          accion: 'CREAR',
          entidad: 'Producto',
          entidadId: producto.id,
          datos: { despues: producto, origen: 'importacion_csv' },
          ip,
        })

        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'creado',
          productoId: producto.id,
          mensaje: mensajeCategoria || undefined,
        })
      } catch (e) {
        console.error('Error importando línea', numLinea, e)
        resultados.push({
          linea: numLinea,
          codigo,
          nombre,
          estado: 'error',
          mensaje: 'Error interno al crear el producto.',
        })
      }
    }

    const creados = resultados.filter((r) => r.estado === 'creado').length
    const errores = resultados.filter((r) => r.estado === 'error').length

    if (creados > 0) {
      revalidatePath('/productos')
      revalidatePath('/movimientos')
      revalidatePath('/analisis')
      revalidatePath('/')
    }

    return NextResponse.json({
      total: resultados.length,
      creados,
      errores,
      resultados,
    })
  } catch (error) {
    console.error('Error en importación CSV:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo CSV.' },
      { status: 500 }
    )
  }
}
