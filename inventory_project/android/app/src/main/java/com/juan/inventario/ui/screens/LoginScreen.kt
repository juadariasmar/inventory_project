package com.juan.inventario.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.juan.inventario.viewmodel.AuthViewModel
import com.juan.inventario.viewmodel.InventarioViewModel

@Composable
fun LoginScreen(onLoginExitoso: () -> Unit) {
    val auth: AuthViewModel = viewModel(factory = InventarioViewModel.AuthFactory)
    val state by auth.state.collectAsState()

    var usuario by remember { mutableStateOf("admin") }
    var contrasena by remember { mutableStateOf("") }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Sistema de Inventario",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center,
            )
            Text(
                text = "SENA – ADSO",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.secondary,
            )

            Spacer(modifier = Modifier.height(32.dp))

            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(20.dp)) {
                    OutlinedTextField(
                        value = usuario,
                        onValueChange = { usuario = it },
                        label = { Text("Usuario") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = contrasena,
                        onValueChange = { contrasena = it },
                        label = { Text("Contraseña") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        modifier = Modifier.fillMaxWidth(),
                    )

                    state.error?.let { msg ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = msg, color = MaterialTheme.colorScheme.error)
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { auth.ingresar(usuario, contrasena, onLoginExitoso) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.cargando,
                    ) {
                        if (state.cargando) {
                            CircularProgressIndicator(modifier = Modifier.height(20.dp))
                        } else {
                            Text("Ingresar")
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Credenciales de prueba: admin / admin123",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}
