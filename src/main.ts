import { prisma } from './lib/db'

async function main() {
  const empresa = (await prisma.empresa.findFirst()) ?? (await prisma.empresa.create({ data: { nombre: 'Empresa Demo' } }))
  // CREATE (modelo `Usuario` requiere `email`, `nombre` y `empresaId`)
  const newUser = await prisma.usuario.create({
    data: {
      neonAuthId: `fake-id-${Date.now()}`,
      email: `alice_${Date.now()}`,
      nombre: 'Alice',
      empresaId: empresa.id,
    },
  })
  console.log('Created usuario:', newUser)

  // READ
  const foundUser = await prisma.usuario.findUnique({ where: { id: newUser.id } })
  console.log('Found usuario:', foundUser)

  // UPDATE
  const updatedUser = await prisma.usuario.update({
    where: { id: newUser.id },
    data: { nombre: 'Alice Smith' },
  })
  console.log('Updated usuario:', updatedUser)

  // DELETE
  await prisma.usuario.delete({ where: { id: newUser.id } })
  console.log('Deleted usuario.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
