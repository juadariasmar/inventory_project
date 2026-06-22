// Convierte un registro de auditoria en una frase en espanol amigable.
// La logica de presentacion vive separada del helper de registro para que
// pueda usarse desde Client Components sin tocar prisma.

export interface RegistroParaDescribir {
  accion: string
  entidad: string
  entidadId: number | null
  datos: unknown
}

interface Datos {
  antes?: Record<string, unknown>
  despues?: Record<string, unknown>
  // campos especificos de algunas acciones:
  productoNuevaCantidad?: number
  contrasenaCambiada?: boolean
  email?: string
  motivo?: string
}

function precio(valor: unknown): string {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return String(valor ?? '')
  return `$${valor.toLocaleString('es-MX')}`
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  return String(v)
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(asString) : []
}

function diffArrays(antes: string[], despues: string[]): { agregados: string[]; quitados: string[] } {
  const setAntes = new Set(antes)
  const setDespues = new Set(despues)
  return {
    agregados: despues.filter((x) => !setAntes.has(x)),
    quitados: antes.filter((x) => !setDespues.has(x)),
  }
}

const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre: 'nombre',
  codigo: 'código',
  descripcion: 'descripción',
  precio: 'precio',
  cantidad: 'cantidad',
  stockMinimo: 'stock mínimo',
  categoriaId: 'categoría',
  email: 'usuario',
  rol: 'rol',
}

function describirCambio(campo: string, antes: unknown, despues: unknown): string {
  const etiqueta = ETIQUETAS_CAMPO[campo] ?? campo
  if (campo === 'precio') {
    return `${etiqueta} ${precio(antes)} → ${precio(despues)}`
  }
  return `${etiqueta} ${asString(antes) || '(vacío)'} → ${asString(despues) || '(vacío)'}`
}

function listarCambios(antes: Record<string, unknown>, despues: Record<string, unknown>, campos: string[]): string[] {
  const cambios: string[] = []
  for (const campo of campos) {
    if (antes[campo] !== despues[campo]) {
      cambios.push(describirCambio(campo, antes[campo], despues[campo]))
    }
  }
  return cambios
}


export function describirAuditoria(r: RegistroParaDescribir): string {
  const d = (r.datos ?? {}) as Datos
  const antes = (d.antes ?? {}) as Record<string, unknown>
  const despues = (d.despues ?? {}) as Record<string, unknown>

  // ----- SESION (LOGIN / LOGIN_FALLIDO) -----
  if (r.entidad === 'Sesion') {
    const usuario = asString(d.email || despues.email || antes.email)
    if (r.accion === 'LOGIN') {
      return usuario
        ? `Inició sesión como '${usuario}'.`
        : 'Inició sesión correctamente.'
    }
    if (r.accion === 'LOGIN_FALLIDO') {
      const motivo =
        d.motivo === 'CONTRASENA_INCORRECTA'
          ? 'contraseña incorrecta'
          : d.motivo === 'USUARIO_NO_EXISTE'
          ? 'usuario no existe'
          : 'credenciales inválidas'
      return usuario
        ? `Intento de inicio de sesión fallido para '${usuario}' (${motivo}).`
        : `Intento de inicio de sesión fallido (${motivo}).`
    }
  }

  // ----- MOVIMIENTO -----
  if (r.entidad === 'Movimiento' && r.accion === 'CREAR') {
    const tipo = asString(despues.tipo)
    const cantidad = asString(despues.cantidad)
    const producto = (despues.producto ?? {}) as Record<string, unknown>
    const nombre = asString(producto.nombre) || `producto #${asString(despues.productoId)}`
    const codigo = asString(producto.codigo)
    const stockFinal = d.productoNuevaCantidad
    const tipoTexto = tipo === 'entrada' ? 'Entrada' : tipo === 'salida' ? 'Salida' : 'Movimiento'
    const partes = [`${tipoTexto} de ${cantidad} × ${nombre}`]
    if (codigo) partes[0] += ` (${codigo})`
    if (typeof stockFinal === 'number') partes.push(`Stock pasó a ${stockFinal} unidades.`)
    else partes[0] += '.'
    return partes.join(' ')
  }

  // ----- PRODUCTO -----
  if (r.entidad === 'Producto') {
    const ref = (despues.nombre || antes.nombre) as string | undefined
    const codigo = (despues.codigo || antes.codigo) as string | undefined
    const sufijo = ref ? `${ref}${codigo ? ` (${codigo})` : ''}` : `producto #${r.entidadId ?? ''}`
    if (r.accion === 'CREAR') {
      const partes: string[] = [`Creó el producto ${sufijo}`]
      if (despues.precio !== undefined) partes.push(`con precio ${precio(despues.precio)}`)
      if (despues.cantidad !== undefined) partes.push(`stock inicial ${asString(despues.cantidad)}`)
      return partes.join(', ') + '.'
    }
    if (r.accion === 'ACTUALIZAR') {
      const cambios = listarCambios(antes, despues, [
        'nombre', 'codigo', 'descripcion', 'precio', 'cantidad', 'stockMinimo', 'categoriaId',
      ])
      if (cambios.length === 0) return `Editó el producto ${sufijo} (sin cambios visibles).`
      return `Editó el producto ${sufijo}. Cambios: ${cambios.join('; ')}.`
    }
    if (r.accion === 'ELIMINAR') {
      return `Eliminó el producto ${sufijo}.`
    }
  }

  // ----- CATEGORIA -----
  if (r.entidad === 'Categoria') {
    const ref = asString(despues.nombre || antes.nombre) || `categoría #${r.entidadId ?? ''}`
    if (r.accion === 'CREAR') return `Creó la categoría '${ref}'.`
    if (r.accion === 'ELIMINAR') return `Eliminó la categoría '${ref}'.`
    if (r.accion === 'ACTUALIZAR') return `Editó la categoría '${ref}'.`
  }

  // ----- USUARIO -----
  if (r.entidad === 'Usuario') {
    const usuario =
      asString(despues.email || antes.email) ||
      `usuario #${r.entidadId ?? ''}`
    const rol = asString(despues.rol || antes.rol)
    const rolTexto = rol === 'ADMIN' ? 'Administrador' : rol === 'USUARIO' ? 'Usuario' : rol
    if (r.accion === 'CREAR') {
      const nombre = asString(despues.nombre)
      const base = nombre
        ? `Creó el usuario @${usuario} (${nombre})`
        : `Creó el usuario @${usuario}`
      return rolTexto ? `${base} con rol ${rolTexto}.` : `${base}.`
    }
    if (r.accion === 'ACTUALIZAR') {
      const cambios = listarCambios(antes, despues, ['nombre', 'email', 'rol'])
      // permisos: comparar arrays
      const permAntes = arr(antes.permisos)
      const permDespues = arr(despues.permisos)
      const { agregados, quitados } = diffArrays(permAntes, permDespues)
      if (agregados.length > 0) cambios.push(`permisos agregados: ${agregados.join(', ')}`)
      if (quitados.length > 0) cambios.push(`permisos retirados: ${quitados.join(', ')}`)
      if (d.contrasenaCambiada) cambios.push('contraseña cambiada')
      if (cambios.length === 0) return `Editó el usuario @${usuario} (sin cambios visibles).`
      return `Editó el usuario @${usuario}. Cambios: ${cambios.join('; ')}.`
    }
    if (r.accion === 'ELIMINAR') {
      const nombre = asString(antes.nombre)
      return nombre
        ? `Eliminó el usuario @${usuario} (${nombre}).`
        : `Eliminó el usuario @${usuario}.`
    }
  }

  // ----- VENTA -----
  if (r.entidad === 'Venta' && r.accion === 'CREAR') {
    const total = despues.total
    const totalItems = despues.totalItems
    const totalUnidades = despues.totalUnidades
    const items = Array.isArray(despues.items) ? (despues.items as Array<Record<string, unknown>>) : []
    const detalleItems = items.slice(0, 3).map((it) => {
      const nombre = asString(it.nombre)
      const cant = asString(it.cantidad)
      return `${cant}× ${nombre}`
    }).join(', ')
    const masItems = items.length > 3 ? ` y ${items.length - 3} más` : ''
    const totalStr = typeof total === 'number' ? precio(total) : asString(total)
    return `Registró venta #${r.entidadId ?? ''} por ${totalStr} (${totalItems ?? items.length} producto(s), ${totalUnidades ?? '?'} unidades): ${detalleItems}${masItems}.`
  }

  // Fallback generico
  return `${r.accion} sobre ${r.entidad}${r.entidadId ? ` #${r.entidadId}` : ''}.`
}
