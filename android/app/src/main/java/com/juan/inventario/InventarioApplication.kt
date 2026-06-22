package com.juan.inventario

import android.app.Application
import com.juan.inventario.data.InventarioRepository

class InventarioApplication : Application() {
    val repository: InventarioRepository by lazy { InventarioRepository(this) }
}
