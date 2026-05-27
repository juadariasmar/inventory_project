package com.juan.inventario.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.juan.inventario.viewmodel.InventarioViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MovimientosScreen(onVolver: () -> Unit) {
    val vm: InventarioViewModel = viewModel(factory = InventarioViewModel.Factory)
    val movimientos by vm.movimientos.collectAsState()
    val productos by vm.productos.collectAsState()

    var productoSeleccionado by remember { mutableStateOf<Long?>(null) }
    var productoNombre by remember { mutableStateOf("") }
    var menuAbierto by remember { mutableStateOf(false) }
    var tipo by remember { mutableStateOf("entrada") }
    var cantidad by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    val fmt = remember { SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("es")) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Movimientos") },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                ),
            )
        }
    ) { padding ->
        Column(modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(12.dp)) {

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Registrar movimiento", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))

                    androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = productoNombre.ifEmpty { "Selecciona un producto" },
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Producto") },
                            enabled = false,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { menuAbierto = true },
                        )
                        DropdownMenu(
                            expanded = menuAbierto,
                            onDismissRequest = { menuAbierto = false },
                        ) {
                            productos.forEach { p ->
                                DropdownMenuItem(
                                    text = { Text("${p.nombre} (stock: ${p.cantidad})") },
                                    onClick = {
                                        productoSeleccionado = p.id
                                        productoNombre = p.nombre
                                        menuAbierto = false
                                    },
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = tipo == "entrada",
                            onClick = { tipo = "entrada" },
                            label = { Text("Entrada") },
                            leadingIcon = { Icon(Icons.Default.ArrowUpward, null) },
                        )
                        FilterChip(
                            selected = tipo == "salida",
                            onClick = { tipo = "salida" },
                            label = { Text("Salida") },
                            leadingIcon = { Icon(Icons.Default.ArrowDownward, null) },
                        )
                    }
                    Spacer(Modifier.height(8.dp))

                    OutlinedTextField(
                        value = cantidad,
                        onValueChange = { cantidad = it.filter { c -> c.isDigit() } },
                        label = { Text("Cantidad") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = notas,
                        onValueChange = { notas = it },
                        label = { Text("Notas (opcional)") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    error?.let {
                        Spacer(Modifier.height(6.dp))
                        Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = {
                            val pid = productoSeleccionado
                            val cant = cantidad.toIntOrNull() ?: 0
                            when {
                                pid == null -> error = "Selecciona un producto"
                                cant <= 0 -> error = "La cantidad debe ser mayor a cero"
                                else -> vm.registrarMovimiento(
                                    productoId = pid, tipo = tipo, cantidad = cant,
                                    notas = notas.ifBlank { null },
                                    onOk = {
                                        error = null
                                        cantidad = ""
                                        notas = ""
                                    },
                                    onError = { error = it },
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Registrar") }
                }
            }

            Spacer(Modifier.height(12.dp))
            Text("Historial", fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))

            LazyColumn(
                contentPadding = PaddingValues(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(movimientos, key = { it.id }) { m ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (m.tipo == "entrada") Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
                        ),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(
                                imageVector = if (m.tipo == "entrada") Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                                contentDescription = null,
                                tint = if (m.tipo == "entrada") Color(0xFF2E7D32) else Color(0xFFC62828),
                            )
                            Spacer(Modifier.height(2.dp))
                            Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
                                Text(m.productoNombre, fontWeight = FontWeight.SemiBold)
                                Text("${m.tipo.replaceFirstChar { it.uppercase() }} de ${m.cantidad} unidades", fontSize = 12.sp)
                                m.notas?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                                Text(fmt.format(Date(m.creadoEn)), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}
