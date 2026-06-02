import { parsearCsv } from '../src/lib/csv'

describe('parsearCsv', () => {
  test('CSV simple con encabezados y filas', () => {
    const csv = 'codigo,nombre,precio\nA-1,Producto A,1000\nB-2,Producto B,2000'
    const r = parsearCsv(csv)
    expect(r.encabezados).toEqual(['codigo', 'nombre', 'precio'])
    expect(r.filas).toHaveLength(2)
    expect(r.filas[0]).toEqual({ codigo: 'A-1', nombre: 'Producto A', precio: '1000' })
    expect(r.filas[1]).toEqual({ codigo: 'B-2', nombre: 'Producto B', precio: '2000' })
  })

  test('soporta valores entrecomillados con comas dentro', () => {
    const csv = 'codigo,nombre,descripcion\nA-1,"Lápiz HB","Caja por 12, color negro"'
    const r = parsearCsv(csv)
    expect(r.filas[0]).toEqual({
      codigo: 'A-1',
      nombre: 'Lápiz HB',
      descripcion: 'Caja por 12, color negro',
    })
  })

  test('soporta comillas dobles escapadas dentro de un valor', () => {
    const csv = 'nombre\n"Producto ""especial"" 1"'
    const r = parsearCsv(csv)
    expect(r.filas[0].nombre).toBe('Producto "especial" 1')
  })

  test('encabezados se devuelven en minúsculas', () => {
    const csv = 'Codigo,Nombre,Precio\nA-1,X,100'
    const r = parsearCsv(csv)
    expect(r.encabezados).toEqual(['codigo', 'nombre', 'precio'])
    expect(r.filas[0]).toEqual({ codigo: 'A-1', nombre: 'X', precio: '100' })
  })

  test('ignora líneas vacías', () => {
    const csv = 'a,b\n1,2\n\n3,4\n'
    const r = parsearCsv(csv)
    expect(r.filas).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })

  test('quita el BOM al inicio del archivo', () => {
    const csv = '﻿codigo,nombre\nA-1,X'
    const r = parsearCsv(csv)
    expect(r.encabezados).toEqual(['codigo', 'nombre'])
    expect(r.filas[0]).toEqual({ codigo: 'A-1', nombre: 'X' })
  })

  test('archivo vacío devuelve sin encabezados ni filas', () => {
    const r = parsearCsv('')
    expect(r.encabezados).toEqual([])
    expect(r.filas).toEqual([])
  })

  test('campos faltantes en una fila quedan como cadena vacía', () => {
    const csv = 'a,b,c\n1,2'
    const r = parsearCsv(csv)
    expect(r.filas[0]).toEqual({ a: '1', b: '2', c: '' })
  })

  test('soporta saltos de línea CRLF', () => {
    const csv = 'a,b\r\n1,2\r\n3,4'
    const r = parsearCsv(csv)
    expect(r.filas).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })

  test('quita comillas envolventes aunque haya espacios alrededor', () => {
    // El parser principal no entra al modo "comilla" cuando hay un espacio
    // antes de la comilla. limpiarComillasEnvolventes lo recupera al final.
    const csv = 'codigo,nombre,precio\nA-1, "Producto X" , "5000"'
    const r = parsearCsv(csv)
    expect(r.filas[0]).toEqual({ codigo: 'A-1', nombre: 'Producto X', precio: '5000' })
  })

  test('valores con comillas dobles internas se preservan', () => {
    const csv = 'nombre\n"Botella de 750 ""ml"" verde"'
    const r = parsearCsv(csv)
    expect(r.filas[0].nombre).toBe('Botella de 750 "ml" verde')
  })

  test('valor sin comillas pasa intacto', () => {
    const csv = 'nombre\nLápiz HB'
    const r = parsearCsv(csv)
    expect(r.filas[0].nombre).toBe('Lápiz HB')
  })

  test('comillas desbalanceadas no se quitan', () => {
    const csv = 'nombre\n"rota'
    const r = parsearCsv(csv)
    expect(r.filas[0].nombre).toContain('rota')
  })
})
