import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Usuario administrador
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@ejemplo.com' },
    update: { rol: 'ADMIN', neonAuthId: 'admin-neon-id-placeholder', estado: 'ACTIVO' },
    create: {
      neonAuthId: 'admin-neon-id-placeholder',
      email: 'admin@ejemplo.com',
      nombre: 'Administrador',
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
  })

  console.log('Usuario creado:', admin.email, '(', admin.rol, ')')

  // Usuario regular de ejemplo
  const usuarioRegular = await prisma.usuario.upsert({
    where: { email: 'usuario@ejemplo.com' },
    update: { rol: 'USUARIO', neonAuthId: 'usuario-neon-id-placeholder', estado: 'ACTIVO' },
    create: {
      neonAuthId: 'usuario-neon-id-placeholder',
      email: 'usuario@ejemplo.com',
      nombre: 'Usuario de ejemplo',
      rol: 'USUARIO',
      estado: 'ACTIVO',
    },
  })

  console.log('Usuario creado:', usuarioRegular.email, '(', usuarioRegular.rol, ')')

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
