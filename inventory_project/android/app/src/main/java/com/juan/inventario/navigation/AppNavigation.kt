package com.juan.inventario.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.juan.inventario.ui.screens.CategoriasScreen
import com.juan.inventario.ui.screens.HomeScreen
import com.juan.inventario.ui.screens.LoginScreen
import com.juan.inventario.ui.screens.MovimientosScreen
import com.juan.inventario.ui.screens.ProductoFormScreen
import com.juan.inventario.ui.screens.ProductosScreen

object Rutas {
    const val LOGIN = "login"
    const val HOME = "home"
    const val PRODUCTOS = "productos"
    const val PRODUCTO_NUEVO = "producto_form"
    const val PRODUCTO_EDITAR = "producto_form/{id}"
    const val CATEGORIAS = "categorias"
    const val MOVIMIENTOS = "movimientos"
}

@Composable
fun AppNavigation() {
    val nav = rememberNavController()

    NavHost(navController = nav, startDestination = Rutas.LOGIN) {

        composable(Rutas.LOGIN) {
            LoginScreen(onLoginExitoso = {
                nav.navigate(Rutas.HOME) {
                    popUpTo(Rutas.LOGIN) { inclusive = true }
                }
            })
        }

        composable(Rutas.HOME) {
            HomeScreen(
                onProductos = { nav.navigate(Rutas.PRODUCTOS) },
                onCategorias = { nav.navigate(Rutas.CATEGORIAS) },
                onMovimientos = { nav.navigate(Rutas.MOVIMIENTOS) },
                onCerrarSesion = {
                    nav.navigate(Rutas.LOGIN) {
                        popUpTo(Rutas.HOME) { inclusive = true }
                    }
                },
            )
        }

        composable(Rutas.PRODUCTOS) {
            ProductosScreen(
                onNuevoProducto = { nav.navigate(Rutas.PRODUCTO_NUEVO) },
                onEditarProducto = { id -> nav.navigate("producto_form/$id") },
            )
        }

        composable(Rutas.PRODUCTO_NUEVO) {
            ProductoFormScreen(productoId = null, onVolver = { nav.popBackStack() })
        }

        composable(
            route = Rutas.PRODUCTO_EDITAR,
            arguments = listOf(navArgument("id") { type = NavType.LongType }),
        ) { backStack ->
            val id = backStack.arguments?.getLong("id") ?: 0L
            ProductoFormScreen(productoId = id, onVolver = { nav.popBackStack() })
        }

        composable(Rutas.CATEGORIAS) {
            CategoriasScreen(onVolver = { nav.popBackStack() })
        }

        composable(Rutas.MOVIMIENTOS) {
            MovimientosScreen(onVolver = { nav.popBackStack() })
        }
    }
}
