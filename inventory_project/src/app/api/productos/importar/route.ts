import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { parsearCsv } from '@/lib/csv'
import { aplicarMapeo, mapearColumnas } from '@/lib/mapeoColumnas'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import {
  generarPrefijoSugerido,
  siguienteCodigoConsecutivoPorCategoria,
} from '@/lib/codigos'

interface ResultadoFila {
  linea: number
  codigo: string
  nombre: string
  estado: 'creado' | 'error'
  mensaje?: string
  productoId?: number
}

// Codigo deja de ser requerido: si no viene, se autogenera con el prefijo de
// la categoria (o de "Sin clasificar" si la fila tampoco trae categoria).
const CAMPOS_REQUERIDOS = ['nombre', 'precio']


async function leerXlsx(buffer: Buffer): Promise<{ encabezados: string[]; filas: Record<string, string>[] }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)
  const hoja = workbook.worksheets[0]
  if (!hoja) return { encabezados: [], filas: [] }

  const filas: Record<string, string>[] = []
  let encabezados: string[] = []
  hoja.eachRow((row, rowNumber) => {
    const valores: string[] = []
    const arr = Array.isArray(row.values) ? row.values : []
    for (let i = 1; i < arr.length; i++) {
      const v = arr[i]
      if (v === null || v === undefined) {
        valores.push('')
      } else if (typeof v === 'object' && v !== null && 'text' in v) {
        valores.push(String((v as { text: unknown }).text))
      } else if (v instanceof Date) {
        valores.push(v.toISOString())
      } else {
        valores.push(String(v))
      }
    }
    if (rowNumber === 1) {
      encabezados = valores.map((v) => v.trim())
    } else {
      const fila: Record<string, string> = {}
      encabezados.forEach((h, j) => {
        fila[h] = (valores[j] ?? '').toString().trim()
      })
      const tieneAlgo = Object.values(fila).some((v) => v !== '')
      if (tieneAlgo) filas.push(fila)
    }
  })
  return { encabezados, filas }
}


export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    let encabezados: string[] = []
    let filas: Record<string, string>[] = []
    let formato: 'csv' | 'xlsx' = 'csv'

    const tipoContenido = request.headers.get('content-type') ?? ''

    if (tipoContenido.includes('multipart/form-data')) {
      const formData = await request.formData()
      const archivo = formData.get('archivo')
      if (!(archivo instanceof File) || archivo.size === 0) {
        return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
      }
      const nombre = archivo.name.toLowerCase()
      const buffer = Buffer.from(await archivo.arrayBuffer())
      if (nombre.endsWith('.xlsx') || nombre.endsWith('.xlsm')) {
        formato = 'xlsx'
        const parsed = await leerXlsx(buffer)
        encabezados = parsed.encabezados
        filas = parsed.filas
      } else {
        const texto = buffer.toString('utf-8')
        const parsed = parsearCsv(texto)
        encabezados = parsed.encabezados
        filas = parsed.filas
      }
    } else {
      // Compatibilidad hacia atras: JSON con { csv: "..." }
      const datos = await request.json()
      const csv = typeof datos.csv === 'string' ? datos.csv : ''
      if (!csv.trim()) {
        return NextResponse.json({ error: 'El archivo está vacío.' }, { status: 400 })
      }
      const parsed = parsearCsv(csv)
      encabezados = parsed.encabezados
      filas = parsed.filas
    }

    if (encabezados.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío.' }, { status: 400 })
    }

    const { mapeo, ignoradas, faltantes } = mapearColumnas(encabezados, CAMPOS_REQUERIDOS)
    if (faltantes.length > 0) {
      const ejemplos: Record<string, string> = {
        nombre: 'nombre, producto, articulo',
        precio: 'precio, valor, precio venta',
      }
      const detalle = faltantes
        .map((f) => `${f} (acepta: ${ejemplos[f] ?? f})`)
        .join('; ')
      return NextResponse.json(
        {
          error: `No se encontraron columnas para: ${detalle}. Verifica los encabezados del archivo.`,
          mapeo,
          ignoradas,
          faltantes,
        },
        { status: 400 }
      )
    }

    const categorias = await prisma.categoria.findMany()
    const mapaCategorias = new Map(
      categorias.map((c) => [c.nombre.toLowerCase().trim(), { id: c.id, prefijo: c.prefijo }])
    )
    let prefijosEnUso = new Set(categorias.map((c) => c.prefijo))

    // Garantizar que exista la categoria "Sin clasificar" para filas sin
    // categoria (Producto.categoriaId es NOT NULL desde la migracion).
    let sinClasificarId = mapaCategorias.get('sin clasificar')?.id
    if (!sinClasificarId) {
      const prefijoSC = generarPrefijoSugerido('Sin clasificar', prefijosEnUso)
      const sc = await prisma.categoria.create({
        data: { nombre: 'Sin clasificar', prefijo: prefijoSC },
      })
      sinClasificarId = sc.id
      mapaCategorias.set('sin clasificar', { id: sc.id, prefijo: sc.prefijo })
      prefijosEnUso = new Set([...prefijosEnUso, sc.prefijo])
    }

    const resultados: ResultadoFila[] = []
    const ip = extraerIp(request)

    for (let i = 0; i < filas.length; i++) {
      const filaCanonica = aplicarMapeo(filas[i], mapeo)
      const numLinea = i + 2
      let codigo = (filaCanonica.codigo ?? '').trim()
      const nombre = (filaCanonica.nombre ?? '').trim()
      const descripcion = (filaCanonica.descripcion ?? '').trim() || null
      // Aceptar precios con simbolo de moneda y separadores de miles ($1,250 -> 1250)
      const precioStr = (filaCanonica.precio ?? '').trim().replace(/[$\s]/g, '').replace(/,/g, '')
      const cantidadStr = (filaCanonica.cantidad ?? '').trim()
      const stockMinimoStr = (filaCanonica.stockMinimo ?? '').trim()
      const categoriaNombre = (filaCanonica.categoria ?? '').trim()

      if (!nombre) {
        resultados.push({ linea: numLinea, codigo, nombre: '', estado: 'error', mensaje: 'Falta el nombre.' })
        continue
      }
      const precio = parseFloat(precioStr)
      if (Number.isNaN(precio) || precio < 0) {
        resultados.push({ linea: numLinea, codigo, nombre, estado: 'error', mensaje: `Precio inválido: "${precioStr}".` })
        continue
      }
      const cantidad = cantidadStr === '' ? 0 : parseInt(cantidadStr)
      if (Number.isNaN(cantidad) || cantidad < 0) {
        resultados.push({ linea: numLinea, codigo, nombre, estado: 'error', mensaje: `Cantidad inválida: "${cantidadStr}".` })
        continue
      }
      const stockMinimo = stockMinimoStr === '' ? 1 : parseInt(stockMinimoStr)
      if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
        resultados.push({ linea: numLinea, codigo, nombre, estado: 'error', mensaje: `Stock mínimo inválido: "${stockMinimoStr}".` })
        continue
      }

      let categoriaId: number = sinClasificarId
      let mensajeCategoria = ''
      if (categoriaNombre) {
        const clave = categoriaNombre.toLowerCase()
        const existente = mapaCategorias.get(clave)
        if (existente) {
          categoriaId = existente.id
        } else {
          // Crear automaticamente la categoria nueva con prefijo autogenerado.
          try {
            const prefijo = generarPrefijoSugerido(categoriaNombre, prefijosEnUso)
            const nuevaCategoria = await prisma.categoria.create({
              data: { nombre: categoriaNombre, prefijo },
            })
            categoriaId = nuevaCategoria.id
            mapaCategorias.set(clave, { id: nuevaCategoria.id, prefijo: nuevaCategoria.prefijo })
            prefijosEnUso = new Set([...prefijosEnUso, nuevaCategoria.prefijo])
            await registrarAuditoria({
              accion: 'CREAR',
              entidad: 'Categoria',
              entidadId: nuevaCategoria.id,
              datos: { despues: nuevaCategoria, origen: 'importacion' },
              ip,
            })
            mensajeCategoria = ` Categoría "${categoriaNombre}" creada con prefijo ${nuevaCategoria.prefijo}.`
          } catch (e) {
            console.error('Error creando categoria en importacion', categoriaNombre, e)
            mensajeCategoria = ` Categoría "${categoriaNombre}" no se pudo crear; se asignó "Sin clasificar".`
          }
        }
      }

      // Si la fila no trae codigo, lo autogeneramos con el prefijo de la
      // categoria resuelta. Si trae codigo, se respeta y se intenta usar.
      if (!codigo) {
        try {
          codigo = await siguienteCodigoConsecutivoPorCategoria(categoriaId)
        } catch (e) {
          console.error('Error generando codigo en importacion', e)
          resultados.push({ linea: numLinea, codigo: '', nombre, estado: 'error', mensaje: 'No se pudo generar el código automáticamente.' })
          continue
        }
      }

      const existenteProd = await prisma.producto.findUnique({ where: { codigo } })
      if (existenteProd) {
        resultados.push({ linea: numLinea, codigo, nombre, estado: 'error', mensaje: `Ya existe un producto con código "${codigo}".` })
        continue
      }

      try {
        const producto = await prisma.$transaction(async (tx) => {
          const nuevo = await tx.producto.create({
            data: { nombre, descripcion, codigo, precio, cantidad, stockMinimo, categoriaId },
          })
          if (cantidad > 0) {
            await tx.movimiento.create({
              data: {
                productoId: nuevo.id,
                tipo: 'entrada',
                cantidad,
                notas: `Stock inicial (importación ${formato.toUpperCase()})`,
              },
            })
          }
          return nuevo
        })

        await registrarAuditoria({
          accion: 'CREAR',
          entidad: 'Producto',
          entidadId: producto.id,
          datos: { despues: producto, origen: `importacion_${formato}` },
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
        resultados.push({ linea: numLinea, codigo, nombre, estado: 'error', mensaje: 'Error interno al crear el producto.' })
      }
    }

    const creados = resultados.filter((r) => r.estado === 'creado').length
    const errores = resultados.filter((r) => r.estado === 'error').length

    if (creados > 0) {
      revalidatePath('/productos')
      revalidatePath('/productos/nuevo')
      revalidatePath('/categorias')
      revalidatePath('/movimientos')
      revalidatePath('/analisis')
      revalidatePath('/')
    }

    return NextResponse.json({
      formato,
      mapeo,
      ignoradas,
      total: resultados.length,
      creados,
      errores,
      resultados,
    })
  } catch (error) {
    console.error('Error en importación:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo.' },
      { status: 500 }
    )
  }
}
