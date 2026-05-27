package com.juan.inventario.data

import java.text.NumberFormat
import java.util.Locale

object InventarioUtils {

    fun tieneStockBajo(producto: ProductoConCategoria): Boolean =
        producto.cantidad < producto.stockMinimo

    fun calcularDelta(tipo: String, cantidad: Int): Int =
        if (tipo == "entrada") cantidad else -cantidad

    fun puedeAplicarSalida(stockActual: Int, cantidad: Int): Boolean =
        cantidad in 1..stockActual

    fun formatearPrecio(valor: Double): String {
        val formatter = NumberFormat.getCurrencyInstance(Locale("es", "CO"))
        formatter.maximumFractionDigits = 0
        return formatter.format(valor)
    }

    fun validarProducto(
        nombre: String,
        codigo: String,
        precio: Double,
        cantidad: Int,
        stockMinimo: Int,
    ): List<String> {
        val errores = mutableListOf<String>()
        if (nombre.trim().length < 2) errores += "El nombre debe tener al menos 2 caracteres"
        if (codigo.trim().isEmpty()) errores += "El código es obligatorio"
        if (precio < 0) errores += "El precio no puede ser negativo"
        if (cantidad < 0) errores += "La cantidad no puede ser negativa"
        if (stockMinimo < 0) errores += "El stock mínimo no puede ser negativo"
        return errores
    }
}
