package com.juan.inventario.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class InventarioDbHelper(context: Context) :
    SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

    companion object {
        const val DB_NAME = "inventario.db"
        const val DB_VERSION = 1
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombreUsuario TEXT UNIQUE NOT NULL,
                contrasena TEXT NOT NULL,
                nombre TEXT NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL
            );
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                codigo TEXT UNIQUE NOT NULL,
                precio REAL NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 0,
                stockMinimo INTEGER NOT NULL DEFAULT 5,
                categoriaId INTEGER,
                FOREIGN KEY(categoriaId) REFERENCES categorias(id) ON DELETE SET NULL
            );
            """.trimIndent()
        )
        db.execSQL(
            """
            CREATE TABLE movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                productoId INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                notas TEXT,
                creadoEn INTEGER NOT NULL,
                FOREIGN KEY(productoId) REFERENCES productos(id) ON DELETE CASCADE
            );
            """.trimIndent()
        )

        // Seed: usuario admin + categorías de ejemplo
        val hash = SimpleHash.sha256("admin123")
        val cvUser = ContentValues().apply {
            put("nombreUsuario", "admin")
            put("contrasena", hash)
            put("nombre", "Administrador")
        }
        db.insert("usuarios", null, cvUser)

        listOf("Electrónicos", "Ropa", "Alimentos", "Herramientas", "Oficina")
            .forEach { nombre ->
                val cv = ContentValues().apply { put("nombre", nombre) }
                db.insert("categorias", null, cv)
            }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS movimientos")
        db.execSQL("DROP TABLE IF EXISTS productos")
        db.execSQL("DROP TABLE IF EXISTS categorias")
        db.execSQL("DROP TABLE IF EXISTS usuarios")
        onCreate(db)
    }

    override fun onConfigure(db: SQLiteDatabase) {
        db.setForeignKeyConstraintsEnabled(true)
    }
}
