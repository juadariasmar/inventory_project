package com.juan.inventario.data

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class InventarioRepository(context: Context) {

    private val helper = InventarioDbHelper(context.applicationContext)

    private val _productos = MutableStateFlow<List<ProductoConCategoria>>(emptyList())
    val productos: StateFlow<List<ProductoConCategoria>> = _productos.asStateFlow()

    private val _categorias = MutableStateFlow<List<Categoria>>(emptyList())
    val categorias: StateFlow<List<Categoria>> = _categorias.asStateFlow()

    private val _movimientos = MutableStateFlow<List<MovimientoConProducto>>(emptyList())
    val movimientos: StateFlow<List<MovimientoConProducto>> = _movimientos.asStateFlow()

    init {
        recargarTodo()
    }

    private fun recargarTodo() {
        _productos.value = listarProductos()
        _categorias.value = listarCategorias()
        _movimientos.value = listarMovimientos()
    }

    // ---- Autenticación ----
    suspend fun autenticar(nombreUsuario: String, contrasena: String): Usuario? =
        withContext(Dispatchers.IO) {
            val db = helper.readableDatabase
            db.rawQuery(
                "SELECT id, nombreUsuario, contrasena, nombre FROM usuarios WHERE nombreUsuario = ? LIMIT 1",
                arrayOf(nombreUsuario)
            ).use { c ->
                if (!c.moveToFirst()) return@withContext null
                val u = Usuario(
                    id = c.getLong(0),
                    nombreUsuario = c.getString(1),
                    contrasena = c.getString(2),
                    nombre = c.getString(3),
                )
                if (u.contrasena == SimpleHash.sha256(contrasena)) u else null
            }
        }

    // ---- Categorías ----
    private fun listarCategorias(): List<Categoria> {
        val out = mutableListOf<Categoria>()
        helper.readableDatabase.rawQuery(
            "SELECT id, nombre FROM categorias ORDER BY nombre ASC", null
        ).use { c ->
            while (c.moveToNext()) {
                out += Categoria(id = c.getLong(0), nombre = c.getString(1))
            }
        }
        return out
    }

    suspend fun guardarCategoria(nombre: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val cv = ContentValues().apply { put("nombre", nombre.trim()) }
            val id = helper.writableDatabase.insertOrThrow("categorias", null, cv)
            if (id < 0) Result.failure(IllegalStateException("No se pudo guardar"))
            else {
                _categorias.value = listarCategorias()
                Result.success(Unit)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun eliminarCategoria(id: Long) = withContext(Dispatchers.IO) {
        helper.writableDatabase.delete("categorias", "id = ?", arrayOf(id.toString()))
        _categorias.value = listarCategorias()
        _productos.value = listarProductos()
    }

    // ---- Productos ----
    private fun listarProductos(): List<ProductoConCategoria> {
        val out = mutableListOf<ProductoConCategoria>()
        helper.readableDatabase.rawQuery(
            """
            SELECT p.id, p.nombre, p.descripcion, p.codigo, p.precio,
                   p.cantidad, p.stockMinimo, p.categoriaId, c.nombre
              FROM productos p
              LEFT JOIN categorias c ON c.id = p.categoriaId
             ORDER BY p.nombre ASC
            """.trimIndent(),
            null
        ).use { c ->
            while (c.moveToNext()) {
                out += ProductoConCategoria(
                    id = c.getLong(0),
                    nombre = c.getString(1),
                    descripcion = if (c.isNull(2)) null else c.getString(2),
                    codigo = c.getString(3),
                    precio = c.getDouble(4),
                    cantidad = c.getInt(5),
                    stockMinimo = c.getInt(6),
                    categoriaId = if (c.isNull(7)) null else c.getLong(7),
                    categoriaNombre = if (c.isNull(8)) null else c.getString(8),
                )
            }
        }
        return out
    }

    suspend fun obtenerProducto(id: Long): Producto? = withContext(Dispatchers.IO) {
        helper.readableDatabase.rawQuery(
            "SELECT id, nombre, descripcion, codigo, precio, cantidad, stockMinimo, categoriaId FROM productos WHERE id = ?",
            arrayOf(id.toString())
        ).use { c ->
            if (!c.moveToFirst()) return@withContext null
            Producto(
                id = c.getLong(0),
                nombre = c.getString(1),
                descripcion = if (c.isNull(2)) null else c.getString(2),
                codigo = c.getString(3),
                precio = c.getDouble(4),
                cantidad = c.getInt(5),
                stockMinimo = c.getInt(6),
                categoriaId = if (c.isNull(7)) null else c.getLong(7),
            )
        }
    }

    suspend fun guardarProducto(p: Producto): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val cv = ContentValues().apply {
                put("nombre", p.nombre)
                put("descripcion", p.descripcion)
                put("codigo", p.codigo)
                put("precio", p.precio)
                put("cantidad", p.cantidad)
                put("stockMinimo", p.stockMinimo)
                if (p.categoriaId == null) putNull("categoriaId") else put("categoriaId", p.categoriaId)
            }
            val db = helper.writableDatabase
            if (p.id == 0L) {
                db.insertOrThrow("productos", null, cv)
            } else {
                db.update("productos", cv, "id = ?", arrayOf(p.id.toString()))
            }
            _productos.value = listarProductos()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun eliminarProducto(id: Long) = withContext(Dispatchers.IO) {
        helper.writableDatabase.delete("productos", "id = ?", arrayOf(id.toString()))
        _productos.value = listarProductos()
        _movimientos.value = listarMovimientos()
    }

    // ---- Movimientos ----
    private fun listarMovimientos(): List<MovimientoConProducto> {
        val out = mutableListOf<MovimientoConProducto>()
        helper.readableDatabase.rawQuery(
            """
            SELECT m.id, m.tipo, m.cantidad, m.notas, m.creadoEn, p.nombre
              FROM movimientos m
              JOIN productos p ON p.id = m.productoId
             ORDER BY m.creadoEn DESC
            """.trimIndent(),
            null
        ).use { c ->
            while (c.moveToNext()) {
                out += MovimientoConProducto(
                    id = c.getLong(0),
                    tipo = c.getString(1),
                    cantidad = c.getInt(2),
                    notas = if (c.isNull(3)) null else c.getString(3),
                    creadoEn = c.getLong(4),
                    productoNombre = c.getString(5),
                )
            }
        }
        return out
    }

    suspend fun registrarMovimiento(
        productoId: Long, tipo: String, cantidad: Int, notas: String?,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val producto = obtenerProducto(productoId)
            ?: return@withContext Result.failure(IllegalArgumentException("Producto no encontrado"))
        if (cantidad <= 0) return@withContext Result.failure(IllegalArgumentException("La cantidad debe ser mayor a cero"))
        if (tipo == "salida" && !InventarioUtils.puedeAplicarSalida(producto.cantidad, cantidad)) {
            return@withContext Result.failure(IllegalStateException("Stock insuficiente para realizar la salida"))
        }

        val delta = InventarioUtils.calcularDelta(tipo, cantidad)
        val db = helper.writableDatabase
        db.beginTransaction()
        try {
            db.execSQL("UPDATE productos SET cantidad = cantidad + ? WHERE id = ?", arrayOf(delta, productoId))
            val cv = ContentValues().apply {
                put("productoId", productoId)
                put("tipo", tipo)
                put("cantidad", cantidad)
                put("notas", notas)
                put("creadoEn", System.currentTimeMillis())
            }
            db.insertOrThrow("movimientos", null, cv)
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }

        _productos.value = listarProductos()
        _movimientos.value = listarMovimientos()
        Result.success(Unit)
    }
}
