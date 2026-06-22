'use client'

import { NeonAuthUIProvider } from '@neondatabase/auth-ui'
import { authClient } from '@/lib/auth/client'
import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface PropiedadesProveedor {
  children: ReactNode
}

export default function ProveedorSesion({ children }: PropiedadesProveedor) {
  const router = useRouter()

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      basePath="/auth"
      social={{ providers: ['google'] }}
      credentials={{ forgotPassword: true }}
      emailVerification={true}
      emailOTP={true}
      navigate={(path: string) => router.push(path)}
      onSessionChange={() => router.refresh()}
      redirectTo="/"
      localization={{
        SIGN_IN: "Iniciar sesión",
        SIGN_UP: "Registrarse",
        FORGOT_PASSWORD: "Recuperar contraseña",
        FORGOT_PASSWORD_DESCRIPTION: "Ingresa tu correo para restablecer tu contraseña",
        FORGOT_PASSWORD_ACTION: "Enviar código de recuperación",
        FORGOT_PASSWORD_EMAIL: "Revisa tu correo para el enlace de recuperación.",
        FORGOT_PASSWORD_LINK: "¿Olvidaste tu contraseña?",
        RESET_PASSWORD: "Restablecer contraseña",
        RESET_PASSWORD_DESCRIPTION: "Ingresa tu nueva contraseña",
        RESET_PASSWORD_ACTION: "Guardar nueva contraseña",
        RESET_PASSWORD_SUCCESS: "Contraseña restablecida exitosamente",
        EMAIL_VERIFICATION: "Revisa tu correo para el enlace de verificación.",
        EMAIL_OTP: "Código de verificación",
        EMAIL_OTP_DESCRIPTION: "Ingresa tu correo para recibir un código",
        EMAIL_OTP_SEND_ACTION: "Enviar código",
        EMAIL_OTP_VERIFY_ACTION: "Verificar código",
        EMAIL_OTP_VERIFICATION_SENT: "Revisa tu correo para el código de verificación.",
        VERIFY_YOUR_EMAIL: "Verifica tu correo electrónico",
        VERIFY_YOUR_EMAIL_DESCRIPTION: "Por favor verifica tu correo electrónico. Revisa tu bandeja de entrada para el correo de verificación. Si no lo has recibido, haz clic en el botón para reenviarlo.",
        EMAIL: "Correo electrónico",
        EMAIL_PLACEHOLDER: "correo@ejemplo.com",
        PASSWORD: "Contraseña",
        PASSWORD_PLACEHOLDER: "Contraseña",
        NEW_PASSWORD: "Nueva contraseña",
        NEW_PASSWORD_PLACEHOLDER: "Nueva contraseña",
        CONFIRM_PASSWORD: "Confirmar contraseña",
        CONFIRM_PASSWORD_PLACEHOLDER: "Confirmar contraseña",
        SIGN_IN_ACTION: "Iniciar sesión",
        SIGN_UP_ACTION: "Crear cuenta",
        SIGN_IN_DESCRIPTION: "Ingresa tu correo para iniciar sesión",
        SIGN_UP_DESCRIPTION: "Ingresa tu información para crear una cuenta",
        DONT_HAVE_AN_ACCOUNT: "¿No tienes cuenta?",
        ALREADY_HAVE_AN_ACCOUNT: "¿Ya tienes cuenta?",
        OR_CONTINUE_WITH: "O continuar con",
        SIGN_IN_WITH: "Iniciar sesión con",
        RESEND_VERIFICATION_EMAIL: "Reenviar correo de verificación",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
