import { describirAuditoria } from '../src/lib/auditoriaDescripcion'

describe('describirAuditoria', () => {
  describe('Sesion', () => {
    test('LOGIN exitoso con nombre de usuario', () => {
      const txt = describirAuditoria({
        accion: 'LOGIN',
        entidad: 'Sesion',
        entidadId: null,
        datos: { nombreUsuario: 'admin' },
      })
      expect(txt).toBe("Inició sesión como 'admin'.")
    })

    test('LOGIN_FALLIDO por contraseña incorrecta', () => {
      const txt = describirAuditoria({
        accion: 'LOGIN_FALLIDO',
        entidad: 'Sesion',
        entidadId: null,
        datos: { nombreUsuario: 'admin', motivo: 'CONTRASENA_INCORRECTA' },
      })
      expect(txt).toContain("'admin'")
      expect(txt).toContain('contraseña incorrecta')
    })

    test('LOGIN_FALLIDO por usuario inexistente', () => {
      const txt = describirAuditoria({
        accion: 'LOGIN_FALLIDO',
        entidad: 'Sesion',
        entidadId: null,
        datos: { nombreUsuario: 'fantasma', motivo: 'USUARIO_NO_EXISTE' },
      })
      expect(txt).toContain('usuario no existe')
    })
  })

  describe('Movimiento', () => {
    test('Salida con nombre de producto y stock final', () => {
      const txt = describirAuditoria({
        accion: 'CREAR',
        entidad: 'Movimiento',
        entidadId: 64,
        datos: {
          despues: {
            tipo: 'salida',
            cantidad: 1,
            producto: { nombre: 'Pantalla', codigo: '00002' },
            productoId: 9,
          },
          productoNuevaCantidad: 12,
        },
      })
      expect(txt).toContain('Salida de 1 × Pantalla')
      expect(txt).toContain('(00002)')
      expect(txt).toContain('Stock pasó a 12 unidades')
    })

    test('Entrada sin producto cargado (caso defensivo)', () => {
      const txt = describirAuditoria({
        accion: 'CREAR',
        entidad: 'Movimiento',
        entidadId: 1,
        datos: { despues: { tipo: 'entrada', cantidad: 5, productoId: 3 } },
      })
      expect(txt).toContain('Entrada de 5')
      expect(txt).toContain('#3')
    })
  })

  describe('Producto', () => {
    test('CREAR muestra nombre, codigo, precio y stock inicial', () => {
      const txt = describirAuditoria({
        accion: 'CREAR',
        entidad: 'Producto',
        entidadId: 10,
        datos: {
          despues: { nombre: 'Lápiz HB', codigo: 'LAP-001', precio: 5000, cantidad: 100 },
        },
      })
      expect(txt).toContain('Lápiz HB (LAP-001)')
      expect(txt).toContain('$5,000')
      expect(txt).toContain('stock inicial 100')
    })

    test('ACTUALIZAR lista solo los campos que cambiaron', () => {
      const txt = describirAuditoria({
        accion: 'ACTUALIZAR',
        entidad: 'Producto',
        entidadId: 10,
        datos: {
          antes: { nombre: 'Lápiz HB', codigo: 'LAP-001', precio: 5000, cantidad: 100, stockMinimo: 20 },
          despues: { nombre: 'Lápiz HB', codigo: 'LAP-001', precio: 7500, cantidad: 100, stockMinimo: 20 },
        },
      })
      expect(txt).toContain('precio $5,000 → $7,500')
      expect(txt).not.toContain('nombre')
      expect(txt).not.toContain('código')
    })

    test('ELIMINAR muestra el producto antes de eliminar', () => {
      const txt = describirAuditoria({
        accion: 'ELIMINAR',
        entidad: 'Producto',
        entidadId: 10,
        datos: { antes: { nombre: 'Lápiz HB', codigo: 'LAP-001' } },
      })
      expect(txt).toBe('Eliminó el producto Lápiz HB (LAP-001).')
    })
  })

  describe('Categoria', () => {
    test('CREAR con nombre', () => {
      expect(
        describirAuditoria({
          accion: 'CREAR',
          entidad: 'Categoria',
          entidadId: 1,
          datos: { despues: { nombre: 'Bebidas' } },
        })
      ).toBe("Creó la categoría 'Bebidas'.")
    })

    test('ELIMINAR con nombre desde antes', () => {
      expect(
        describirAuditoria({
          accion: 'ELIMINAR',
          entidad: 'Categoria',
          entidadId: 1,
          datos: { antes: { nombre: 'Bebidas' } },
        })
      ).toBe("Eliminó la categoría 'Bebidas'.")
    })
  })

  describe('Usuario', () => {
    test('CREAR muestra el rol legible', () => {
      const txt = describirAuditoria({
        accion: 'CREAR',
        entidad: 'Usuario',
        entidadId: 5,
        datos: { despues: { nombre: 'María Pérez', nombreUsuario: 'maria', rol: 'USUARIO' } },
      })
      expect(txt).toContain('@maria')
      expect(txt).toContain('María Pérez')
      expect(txt).toContain('Usuario')
    })

    test('ACTUALIZAR detecta permisos agregados y retirados', () => {
      const txt = describirAuditoria({
        accion: 'ACTUALIZAR',
        entidad: 'Usuario',
        entidadId: 5,
        datos: {
          antes: { nombreUsuario: 'maria', rol: 'USUARIO', permisos: ['VER_ANALISIS'] },
          despues: { nombreUsuario: 'maria', rol: 'USUARIO', permisos: ['REALIZAR_VENTAS'] },
        },
      })
      expect(txt).toContain('permisos agregados: REALIZAR_VENTAS')
      expect(txt).toContain('permisos retirados: VER_ANALISIS')
    })

    test('ACTUALIZAR detecta cambio de contraseña', () => {
      const txt = describirAuditoria({
        accion: 'ACTUALIZAR',
        entidad: 'Usuario',
        entidadId: 5,
        datos: {
          antes: { nombreUsuario: 'maria', rol: 'USUARIO', permisos: [] },
          despues: { nombreUsuario: 'maria', rol: 'USUARIO', permisos: [] },
          contrasenaCambiada: true,
        },
      })
      expect(txt).toContain('contraseña cambiada')
    })

    test('ELIMINAR muestra el usuario eliminado', () => {
      const txt = describirAuditoria({
        accion: 'ELIMINAR',
        entidad: 'Usuario',
        entidadId: 5,
        datos: { antes: { nombreUsuario: 'maria', nombre: 'María Pérez' } },
      })
      expect(txt).toBe('Eliminó el usuario @maria (María Pérez).')
    })
  })

  test('fallback genérico para acciones desconocidas', () => {
    const txt = describirAuditoria({
      accion: 'OTRO',
      entidad: 'Algo',
      entidadId: 7,
      datos: null,
    })
    expect(txt).toBe('OTRO sobre Algo #7.')
  })
})
