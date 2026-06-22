import { AuthView } from '@neondatabase/auth-ui'
import { authViewPaths } from '@neondatabase/auth-ui/server'

export function generateStaticParams() {
  return authViewPaths()
}

export default function AuthPage() {
  return <AuthView />
}
