'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/componentes/comunes/Button'
import { Input } from '@/componentes/comunes/Input'
import { useToast } from '@/componentes/comunes/ProveedorToast'
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!token) {
    return (
      <div className="text-center p-6 space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Enlace Inválido o Expirado</h2>
        <p className="text-sm text-gray-600">Este enlace de recuperación de contraseña no tiene un token válido o ha expirado. Por favor, solicita uno nuevo.</p>
        <Link href="/auth/forgot-password" className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500">
          Solicitar otro enlace
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      })

      if (error) {
        setErrorMsg(error.message || 'Error al intentar restablecer la contraseña.')
        toast({
          titulo: 'Error',
          descripcion: error.message || 'Ocurrió un error al restablecer la contraseña.',
          variant: 'error',
        })
      } else {
        setSuccess(true)
        toast({
          titulo: 'Contraseña Actualizada',
          descripcion: 'Tu contraseña ha sido restablecida exitosamente.',
          variant: 'success',
        })
      }
    } catch (err) {
      console.error('[Reset Password] Catch error:', err)
      setErrorMsg('Ocurrió un error de red o de servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center p-6 space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Contraseña restablecida!</h2>
        <p className="text-sm text-gray-600">Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <div className="pt-4">
          <Button
            onClick={() => router.push('/auth/sign-in')}
            className="w-full"
            variant="primary"
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Nueva Contraseña"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirmar Nueva Contraseña"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
        >
          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-start gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full mt-4"
        isLoading={loading}
        loadingText="Actualizando..."
      >
        Restablecer Contraseña
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col justify-center min-h-[400px]">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Restablecer Contraseña</h1>
        <p className="text-sm text-gray-500 mt-1">Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta</p>
      </div>
      <Suspense fallback={<div className="text-center py-8 text-sm text-gray-500">Cargando formulario...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
