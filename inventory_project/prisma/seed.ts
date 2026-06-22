import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Usuario administrador
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin2024!'
  const hashAdmin = await bcrypt.hash(adminPass, 10)
  const admin = await prisma.usuario.upsert({
    where: { nombreUsuario: 'admin' },
    update: { rol: 'ADMIN', contrasena: hashAdmin },
    create: {
      nombreUsuario: 'admin',
      contrasena: hashAdmin,
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  })

  console.log('Usuario creado:', admin.nombreUsuario, '(', admin.rol, ')')

  // Usuario regular de ejemplo
  const userPass = process.env.USER_PASSWORD || 'Usuario2024!'
  const hashUsuario = await bcrypt.hash(userPass, 10)
  const usuarioRegular = await prisma.usuario.upsert({
    where: { nombreUsuario: 'usuario' },
    update: { rol: 'USUARIO', contrasena: hashUsuario },
    create: {
      nombreUsuario: 'usuario',
      contrasena: hashUsuario,
      nombre: 'Usuario de ejemplo',
      rol: 'USUARIO',
    },
  })

  console.log('Usuario creado:', usuarioRegular.nombreUsuario, '(', usuarioRegular.rol, ')')

  // Crear algunas categorías de ejemplo con su prefijo (las 3 primeras letras).
  const categorias: Array<{ nombre: string; prefijo: string }> = [
    { nombre: 'Electrónicos', prefijo: 'ELE' },
    { nombre: 'Ropa', prefijo: 'ROP' },
    { nombre: 'Alimentos', prefijo: 'ALI' },
    { nombre: 'Herramientas', prefijo: 'HER' },
    { nombre: 'Oficina', prefijo: 'OFI' },
  ]

  for (const { nombre, prefijo } of categorias) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre, prefijo },
    })
  }

  console.log('Categorías creadas:', categorias.length)

  // Crear un producto de ejemplo para que los tests E2E de venta no fallen si la BD está vacía.
  const categoriaEjemplo = await prisma.categoria.findFirst()
  if (categoriaEjemplo) {
    await prisma.producto.upsert({
      where: { codigo: 'E2E-TEST-001' },
      update: {},
      create: {
        codigo: 'E2E-TEST-001',
        nombre: 'Producto de Prueba E2E',
        precio: 15000,
        cantidad: 100,
        categoriaId: categoriaEjemplo.id,
      },
    })
    console.log('Producto de prueba E2E asegurado.')
  }

  console.log('Seed completado!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
