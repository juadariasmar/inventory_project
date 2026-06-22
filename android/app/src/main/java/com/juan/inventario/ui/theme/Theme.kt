package com.juan.inventario.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Azul = Color(0xFF1F4E79)
private val AzulOscuro = Color(0xFF0F2D4A)
private val AzulClaro = Color(0xFFD9E2F3)
private val Naranja = Color(0xFFE07A1F)

private val LightColors = lightColorScheme(
    primary = Azul,
    onPrimary = Color.White,
    secondary = Naranja,
    onSecondary = Color.White,
    surface = Color.White,
    background = Color(0xFFF7F9FC),
)

private val DarkColors = darkColorScheme(
    primary = AzulClaro,
    onPrimary = AzulOscuro,
    secondary = Naranja,
    onSecondary = Color.Black,
)

@Composable
fun InventarioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
