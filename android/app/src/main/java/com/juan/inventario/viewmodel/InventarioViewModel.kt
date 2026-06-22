package com.juan.inventario.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.juan.inventario.InventarioApplication
import com.juan.inventario.data.Categoria
import com.juan.inventario.data.InventarioRepository
import com.juan.inventario.data.MovimientoConProducto
import com.juan.inventario.data.Producto
import com.juan.inventario.data.ProductoConCategoria
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class InventarioViewModel(private val repo: InventarioRepository) : ViewModel() {

    val productos: StateFlow<List<ProductoConCategoria>> = repo.productos
    val categorias: StateFlow<List<Categoria>> = repo.categorias
    val movimientos: StateFlow<List<MovimientoConProducto>> = repo.movimientos

    fun guardarProducto(producto: Producto, onError: (String) -> Unit = {}, onOk: () -> Unit = {}) {
        viewModelScope.launch {
            repo.guardarProducto(producto).fold(
                onSuccess = { onOk() },
                onFailure = { onError(it.message ?: "Error al guardar") },
            )
        }
    }

    fun eliminarProducto(id: Long) {
        viewModelScope.launch { repo.eliminarProducto(id) }
    }

    fun guardarCategoria(nombre: String, onError: (String) -> Unit = {}, onOk: () -> Unit = {}) {
        viewModelScope.launch {
            repo.guardarCategoria(nombre).fold(
                onSuccess = { onOk() },
                onFailure = { onError(it.message ?: "Error al guardar") },
            )
        }
    }

    fun eliminarCategoria(id: Long) {
        viewModelScope.launch { repo.eliminarCategoria(id) }
    }

    fun registrarMovimiento(
        productoId: Long, tipo: String, cantidad: Int, notas: String?,
        onError: (String) -> Unit = {}, onOk: () -> Unit = {},
    ) {
        viewModelScope.launch {
            repo.registrarMovimiento(productoId, tipo, cantidad, notas).fold(
                onSuccess = { onOk() },
                onFailure = { onError(it.message ?: "Error") },
            )
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as InventarioApplication
                InventarioViewModel(app.repository)
            }
        }

        val AuthFactory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as InventarioApplication
                AuthViewModel(app.repository)
            }
        }
    }
}
