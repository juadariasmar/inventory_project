package com.juan.inventario.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.juan.inventario.data.InventarioRepository
import com.juan.inventario.data.Usuario
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthState(
    val usuario: Usuario? = null,
    val error: String? = null,
    val cargando: Boolean = false,
)

class AuthViewModel(private val repo: InventarioRepository) : ViewModel() {

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    fun ingresar(usuario: String, contrasena: String, onExito: () -> Unit) {
        _state.value = _state.value.copy(cargando = true, error = null)
        viewModelScope.launch {
            val u = repo.autenticar(usuario.trim(), contrasena)
            if (u != null) {
                _state.value = AuthState(usuario = u, error = null, cargando = false)
                onExito()
            } else {
                _state.value = AuthState(
                    usuario = null,
                    error = "Credenciales incorrectas",
                    cargando = false,
                )
            }
        }
    }

    fun cerrarSesion() {
        _state.value = AuthState()
    }
}
