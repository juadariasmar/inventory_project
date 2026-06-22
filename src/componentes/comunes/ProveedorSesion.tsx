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
        // Cuenta y menú
        APP: "Aplicación",
        ACCOUNT: "Cuenta",
        ACCOUNTS: "Cuentas",
        ACCOUNTS_DESCRIPTION: "Administra las cuentas con las que tienes la sesión iniciada.",
        ACCOUNTS_INSTRUCTIONS: "Inicia sesión en una cuenta adicional.",
        ADD_ACCOUNT: "Añadir cuenta",
        SWITCH_ACCOUNT: "Cambiar de cuenta",
        SIGN_OUT: "Cerrar sesión",
        PERSONAL_ACCOUNT: "Cuenta personal",
        SETTINGS: "Ajustes",
        USER: "Usuario",
        // Acciones genéricas
        SAVE: "Guardar",
        CANCEL: "Cancelar",
        UPDATE: "Actualizar",
        DELETE: "Eliminar",
        CONTINUE: "Continuar",
        DONE: "Hecho",
        GO_BACK: "Volver",
        LINK: "Enlazar",
        UNLINK: "Desenlazar",
        REVOKE: "Revocar",
        UPLOAD: "Subir",
        RESEND_CODE: "Reenviar código",
        REQUEST_FAILED: "La solicitud falló",
        UPDATED_SUCCESSFULLY: "Actualizado correctamente",
        COPIED_TO_CLIPBOARD: "Copiado al portapapeles",
        COPY_TO_CLIPBOARD: "Copiar al portapapeles",
        // Perfil
        NAME: "Nombre",
        NAME_DESCRIPTION: "Ingresa tu nombre completo o un nombre para mostrar.",
        NAME_INSTRUCTIONS: "Usa un máximo de 32 caracteres.",
        NAME_PLACEHOLDER: "Nombre",
        AVATAR: "Avatar",
        AVATAR_DESCRIPTION: "Haz clic en el avatar para subir uno personalizado desde tus archivos.",
        AVATAR_INSTRUCTIONS: "El avatar es opcional, pero muy recomendable.",
        UPLOAD_AVATAR: "Subir avatar",
        DELETE_AVATAR: "Eliminar avatar",
        // Seguridad
        SECURITY: "Seguridad",
        CHANGE_PASSWORD: "Cambiar contraseña",
        CHANGE_PASSWORD_DESCRIPTION: "Ingresa tu contraseña actual y una nueva contraseña.",
        CHANGE_PASSWORD_INSTRUCTIONS: "Usa al menos 8 caracteres.",
        CHANGE_PASSWORD_SUCCESS: "Tu contraseña ha sido cambiada.",
        CURRENT_PASSWORD: "Contraseña actual",
        CURRENT_PASSWORD_PLACEHOLDER: "Contraseña actual",
        SET_PASSWORD: "Establecer contraseña",
        SET_PASSWORD_DESCRIPTION: "Haz clic en el botón de abajo para recibir un correo que te permita establecer una contraseña para tu cuenta.",
        PASSWORD_REQUIRED: "La contraseña es obligatoria",
        PASSWORDS_DO_NOT_MATCH: "Las contraseñas no coinciden",
        NEW_PASSWORD_REQUIRED: "La nueva contraseña es obligatoria",
        CONFIRM_PASSWORD_REQUIRED: "Debes confirmar la contraseña",
        PROVIDERS: "Proveedores",
        PROVIDERS_DESCRIPTION: "Conecta tu cuenta con un servicio externo.",
        PASSKEY: "Llave de acceso",
        PASSKEYS: "Llaves de acceso",
        PASSKEYS_DESCRIPTION: "Administra tus llaves de acceso para un acceso seguro.",
        PASSKEYS_INSTRUCTIONS: "Accede a tu cuenta de forma segura sin contraseña.",
        ADD_PASSKEY: "Añadir llave de acceso",
        // Sesiones
        SESSIONS: "Sesiones",
        SESSIONS_DESCRIPTION: "Administra tus sesiones activas y revoca el acceso.",
        CURRENT_SESSION: "Sesión actual",
        SESSION_EXPIRED: "La sesión ha expirado",
        SESSION_NOT_FRESH: "Tu sesión no es reciente. Por favor, inicia sesión de nuevo.",
        // Correo
        EMAIL_DESCRIPTION: "Ingresa la dirección de correo que quieres usar para iniciar sesión.",
        EMAIL_INSTRUCTIONS: "Por favor, ingresa una dirección de correo válida.",
        EMAIL_IS_THE_SAME: "El correo es el mismo",
        EMAIL_REQUIRED: "La dirección de correo es obligatoria",
        EMAIL_VERIFY_CHANGE: "Revisa tu correo para verificar el cambio.",
        // Eliminar cuenta
        DELETE_ACCOUNT: "Eliminar cuenta",
        DELETE_ACCOUNT_DESCRIPTION: "Elimina permanentemente tu cuenta y todo su contenido. Esta acción no se puede deshacer, así que continúa con precaución.",
        DELETE_ACCOUNT_INSTRUCTIONS: "Confirma la eliminación de tu cuenta. Esta acción no se puede deshacer, así que continúa con precaución.",
        DELETE_ACCOUNT_VERIFY: "Revisa tu correo para verificar la eliminación de tu cuenta.",
        DELETE_ACCOUNT_SUCCESS: "Tu cuenta ha sido eliminada.",
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
