package com.juan.inventario.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.juan.inventario.viewmodel.InventarioViewModel

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun CategoriasScreen(onVolver: () -> Unit) {
    val vm: InventarioViewModel = viewModel(factory = InventarioViewModel.Factory)
    val categorias by vm.categorias.collectAsState()

    var nueva by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Categorías") },
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

            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = nueva,
                    onValueChange = { nueva = it },
                    label = { Text("Nueva categoría") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        if (nueva.trim().length < 2) {
                            error = "Mínimo 2 caracteres"
                        } else {
                            vm.guardarCategoria(
                                nueva,
                                onOk = { nueva = ""; error = null },
                                onError = { error = it },
                            )
                        }
                    },
                    modifier = Modifier.padding(start = 8.dp),
                ) { Text("Agregar") }
            }
            error?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }

            Spacer(Modifier.height(12.dp))
            LazyColumn(
                contentPadding = PaddingValues(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(categorias, key = { it.id }) { cat ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = cat.nombre,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f),
                            )
                            IconButton(onClick = { vm.eliminarCategoria(cat.id) }) {
                                Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = Color(0xFFD32F2F))
                            }
                        }
                    }
                }
            }
        }
    }
}
