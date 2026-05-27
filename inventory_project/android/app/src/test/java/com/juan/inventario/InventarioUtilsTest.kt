package com.juan.inventario

import com.juan.inventario.data.InventarioUtils
import com.juan.inventario.data.ProductoConCategoria
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InventarioUtilsTest {

    private fun producto(cantidad: Int, stockMinimo: Int = 5) = ProductoConCategoria(
        id = 1, nombre = "X", descripcion = null, codigo = "X",
        precio = 100.0, cantidad = cantidad, stockMinimo = stockMinimo,
        categoriaId = null, categoriaNombre = null,
    )

    @Test
    fun stock_bajo_cuando_cantidad_menor_a_minimo() {
        assertTrue(InventarioUtils.tieneStockBajo(producto(cantidad = 2, stockMinimo = 5)))
    }

    @Test
    fun no_es_stock_bajo_si_es_igual_al_minimo() {
        assertFalse(InventarioUtils.tieneStockBajo(producto(cantidad = 5, stockMinimo = 5)))
    }

    @Test
    fun delta_de_entrada_es_positivo() {
        assertEquals(5, InventarioUtils.calcularDelta("entrada", 5))
    }

    @Test
    fun delta_de_salida_es_negativo() {
        assertEquals(-3, InventarioUtils.calcularDelta("salida", 3))
    }

    @Test
    fun puede_aplicar_salida_si_hay_stock() {
        assertTrue(InventarioUtils.puedeAplicarSalida(stockActual = 10, cantidad = 5))
    }

    @Test
    fun no_puede_aplicar_salida_si_supera_stock() {
        assertFalse(InventarioUtils.puedeAplicarSalida(stockActual = 5, cantidad = 10))
    }

    @Test
    fun no_puede_aplicar_salida_con_cero() {
        assertFalse(InventarioUtils.puedeAplicarSalida(stockActual = 5, cantidad = 0))
    }

    @Test
    fun validar_producto_valido_no_genera_errores() {
        val errores = InventarioUtils.validarProducto(
            nombre = "Teclado", codigo = "TEC-001", precio = 100.0,
            cantidad = 10, stockMinimo = 5,
        )
        assertTrue(errores.isEmpty())
    }

    @Test
    fun validar_producto_detecta_nombre_corto() {
        val errores = InventarioUtils.validarProducto(
            nombre = "x", codigo = "C", precio = 100.0,
            cantidad = 0, stockMinimo = 0,
        )
        assertTrue(errores.any { it.contains("nombre", ignoreCase = true) })
    }

    @Test
    fun validar_producto_detecta_precio_negativo() {
        val errores = InventarioUtils.validarProducto(
            nombre = "Producto", codigo = "C", precio = -1.0,
            cantidad = 0, stockMinimo = 0,
        )
        assertTrue(errores.any { it.contains("precio", ignoreCase = true) })
    }
}
