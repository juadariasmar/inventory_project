import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Crear usuario administrador
  const contrasenaHash = await bcrypt.hash('admin123', 10)

  const usuario = await prisma.usuario.upsert({
    where: { nombreUsuario: 'admin' },
    update: {},
    create: {
      nombreUsuario: 'admin',
      contrasena: contrasenaHash,
      nombre: 'Administrador',
    },
  })

  console.log('Usuario creado:', usuario.nombreUsuario)

  // Crear algunas categorías de ejemplo
  const categorias = [
    'Electrónicos',
    'Ropa',
    'Alimentos',
    'Herramientas',
    'Oficina',
  ]

  for (const nombre of categorias) {
    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }

  console.log('Categorías creadas:', categorias.length)

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
