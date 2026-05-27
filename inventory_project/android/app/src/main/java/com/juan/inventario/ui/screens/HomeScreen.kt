package com.juan.inventario.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.juan.inventario.data.InventarioUtils
import com.juan.inventario.viewmodel.InventarioViewModel

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onProductos: () -> Unit,
    onCategorias: () -> Unit,
    onMovimientos: () -> Unit,
    onCerrarSesion: () -> Unit,
) {
    val vm: InventarioViewModel = viewModel(factory = InventarioViewModel.Factory)
    val productos by vm.productos.collectAsState()

    val totalProductos = productos.size
    val totalUnidades = productos.sumOf { it.cantidad }
    val bajoStock = productos.count { InventarioUtils.tieneStockBajo(it) }
    val valorTotal = productos.sumOf { it.precio * it.cantidad }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inventario SENA") },
                actions = {
                    IconButton(onClick = onCerrarSesion) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Cerrar sesión", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                ),
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Resumen",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StatCard("Productos", totalProductos.toString(), modifier = Modifier.weight(1f))
                StatCard("Unidades", totalUnidades.toString(), modifier = Modifier.weight(1f))
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StatCard(
                    titulo = "Bajo stock",
                    valor = bajoStock.toString(),
                    color = if (bajoStock > 0) Color(0xFFD32F2F) else MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    titulo = "Valor total",
                    valor = InventarioUtils.formatearPrecio(valorTotal),
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Módulos",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )

            MenuItem(Icons.Default.Inventory, "Productos", "Gestionar el catálogo", onProductos)
            MenuItem(Icons.Default.Category, "Categorías", "Organizar el inventario", onCategorias)
            MenuItem(Icons.Default.SwapVert, "Movimientos", "Entradas y salidas", onMovimientos)
        }
    }
}

@Composable
private fun StatCard(
    titulo: String,
    valor: String,
    color: Color = MaterialTheme.colorScheme.primary,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(text = titulo, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = valor, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
private fun MenuItem(
    icono: ImageVector,
    titulo: String,
    subtitulo: String,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = icono,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(36.dp),
            )
            Spacer(modifier = Modifier.size(12.dp))
            Column {
                Text(titulo, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                Text(subtitulo, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
