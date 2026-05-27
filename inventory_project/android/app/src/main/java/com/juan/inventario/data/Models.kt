package com.juan.inventario.data

data class Usuario(
    val id: Long = 0,
    val nombreUsuario: String,
    val contrasena: String,
    val nombre: String,
)

data class Categoria(
    val id: Long = 0,
    val nombre: String,
)

data class Producto(
    val id: Long = 0,
    val nombre: String,
    val descripcion: String? = null,
    val codigo: String,
    val precio: Double,
    val cantidad: Int = 0,
    val stockMinimo: Int = 5,
    val categoriaId: Long? = null,
)

data class ProductoConCategoria(
    val id: Long,
    val nombre: String,
    val descripcion: String?,
    val codigo: String,
    val precio: Double,
    val cantidad: Int,
    val stockMinimo: Int,
    val categoriaId: Long?,
    val categoriaNombre: String?,
)

data class Movimiento(
    val id: Long = 0,
    val productoId: Long,
    val tipo: String,
    val cantidad: Int,
    val notas: String? = null,
    val creadoEn: Long = System.currentTimeMillis(),
)

data class MovimientoConProducto(
    val id: Long,
    val tipo: String,
    val cantidad: Int,
    val notas: String?,
    val creadoEn: Long,
    val productoNombre: String,
)
