'use client'

import dynamic from 'next/dynamic'

const UserButtonCliente = dynamic(
  () => import('@neondatabase/auth-ui').then((mod) => mod.UserButton),
  { ssr: false }
)

export default UserButtonCliente
