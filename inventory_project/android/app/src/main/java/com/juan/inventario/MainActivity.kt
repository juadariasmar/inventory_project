package com.juan.inventario

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.juan.inventario.navigation.AppNavigation
import com.juan.inventario.ui.theme.InventarioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            InventarioTheme {
                AppNavigation()
            }
        }
    }
}
