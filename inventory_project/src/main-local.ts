import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const newUser = await prisma.usuario.create({
    data: {
      nombreUsuario: `alice_local_${Date.now()}`,
      contrasena: 'test123',
      nombre: 'Alice Local',
    },
  })
  console.log('Created usuario:', newUser)

  const foundUser = await prisma.usuario.findUnique({ where: { id: newUser.id } })
  console.log('Found usuario:', foundUser)

  const updatedUser = await prisma.usuario.update({
    where: { id: newUser.id },
    data: { nombre: 'Alice Local Smith' },
  })
  console.log('Updated usuario:', updatedUser)

  await prisma.usuario.delete({ where: { id: newUser.id } })
  console.log('Deleted usuario.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
