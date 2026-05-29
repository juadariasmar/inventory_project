import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Usuario administrador
  const hashAdmin = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuario.upsert({
    where: { nombreUsuario: 'admin' },
    update: { rol: 'ADMIN' },
    create: {
      nombreUsuario: 'admin',
      contrasena: hashAdmin,
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  })

  console.log('Usuario creado:', admin.nombreUsuario, '(', admin.rol, ')')

  // Usuario regular de ejemplo
  const hashUsuario = await bcrypt.hash('usuario123', 10)
  const usuarioRegular = await prisma.usuario.upsert({
    where: { nombreUsuario: 'usuario' },
    update: { rol: 'USUARIO' },
    create: {
      nombreUsuario: 'usuario',
      contrasena: hashUsuario,
      nombre: 'Usuario de ejemplo',
      rol: 'USUARIO',
    },
  })

  console.log('Usuario creado:', usuarioRegular.nombreUsuario, '(', usuarioRegular.rol, ')')

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
