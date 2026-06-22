package com.juan.inventario.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.juan.inventario.data.InventarioUtils
import com.juan.inventario.data.Producto
import com.juan.inventario.viewmodel.InventarioViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductoFormScreen(
    productoId: Long?,
    onVolver: () -> Unit,
) {
    val vm: InventarioViewModel = viewModel(factory = InventarioViewModel.Factory)
    val categorias by vm.categorias.collectAsState()

    var nombre by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var codigo by remember { mutableStateOf("") }
    var precio by remember { mutableStateOf("0") }
    var cantidad by remember { mutableStateOf("0") }
    var stockMinimo by remember { mutableStateOf("5") }
    var categoriaId by remember { mutableStateOf<Long?>(null) }
    var categoriaNombre by remember { mutableStateOf("") }
    var menuAbierto by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(productoId) {
        if (productoId != null && productoId > 0) {
            vm.productos.value.firstOrNull { it.id == productoId }?.let { p ->
                nombre = p.nombre
                descripcion = p.descripcion ?: ""
                codigo = p.codigo
                precio = p.precio.toInt().toString()
                cantidad = p.cantidad.toString()
                stockMinimo = p.stockMinimo.toString()
                categoriaId = p.categoriaId
                categoriaNombre = p.categoriaNombre ?: ""
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (productoId != null && productoId > 0) "Editar producto" else "Nuevo producto") },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                ),
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            OutlinedTextField(
                value = nombre, onValueChange = { nombre = it },
                label = { Text("Nombre") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = codigo, onValueChange = { codigo = it },
                label = { Text("Código") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = descripcion, onValueChange = { descripcion = it },
                label = { Text("Descripción") },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = precio, onValueChange = { precio = it.filter { c -> c.isDigit() || c == '.' } },
                label = { Text("Precio (COP)") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = cantidad, onValueChange = { cantidad = it.filter { c -> c.isDigit() } },
                label = { Text("Cantidad") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = stockMinimo, onValueChange = { stockMinimo = it.filter { c -> c.isDigit() } },
                label = { Text("Stock mínimo") }, singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))

            androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = categoriaNombre.ifEmpty { "(sin categoría)" },
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Categoría") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { menuAbierto = true },
                    enabled = false,
                )
                DropdownMenu(
                    expanded = menuAbierto,
                    onDismissRequest = { menuAbierto = false },
                ) {
                    DropdownMenuItem(
                        text = { Text("(sin categoría)") },
                        onClick = {
                            categoriaId = null
                            categoriaNombre = ""
                            menuAbierto = false
                        },
                    )
                    categorias.forEach { cat ->
                        DropdownMenuItem(
                            text = { Text(cat.nombre) },
                            onClick = {
                                categoriaId = cat.id
                                categoriaNombre = cat.nombre
                                menuAbierto = false
                            },
                        )
                    }
                }
            }

            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(text = it, color = MaterialTheme.colorScheme.error)
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    val precioD = precio.toDoubleOrNull() ?: 0.0
                    val cantI = cantidad.toIntOrNull() ?: 0
                    val stockI = stockMinimo.toIntOrNull() ?: 5
                    val errores = InventarioUtils.validarProducto(nombre, codigo, precioD, cantI, stockI)
                    if (errores.isNotEmpty()) {
                        error = errores.joinToString(", ")
                        return@Button
                    }
                    vm.guardarProducto(
                        Producto(
                            id = productoId ?: 0,
                            nombre = nombre.trim(),
                            descripcion = descripcion.ifBlank { null },
                            codigo = codigo.trim(),
                            precio = precioD,
                            cantidad = cantI,
                            stockMinimo = stockI,
                            categoriaId = categoriaId,
                        ),
                        onError = { error = it },
                        onOk = onVolver,
                    )
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Guardar") }
        }
    }
}
