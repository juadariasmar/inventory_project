import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const empresa = (await prisma.empresa.findFirst()) ?? (await prisma.empresa.create({ data: { nombre: 'Empresa Demo' } }))
  const newUser = await prisma.usuario.create({
    data: {
      neonAuthId: `fake-id-${Date.now()}`,
      email: `alice_local_${Date.now()}`,
      nombre: 'Alice Local',
      empresaId: empresa.id,
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
