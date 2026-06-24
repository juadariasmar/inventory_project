'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChangePasswordCard, TwoFactorCard, PasskeysCard } from '@neondatabase/auth-ui'
import { ChevronDown, Shield, Key, Fingerprint, Monitor, Lock } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

export default function SeguridadColapsable() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Seguridad</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-border p-4">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">Seguridad</h1>
      </div>

      <Accordion.Root type="multiple" defaultValue={['sesiones']} className="space-y-3">
        <Accordion.Item value="contrasena" className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Cambiar contraseña</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="text-sm text-gray-600 mb-4">
              Actualiza tu contraseña periódicamente para mantener tu cuenta segura.
            </div>
            <ChangePasswordCard />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="sesiones" className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-gray-500" />
                <div>
                  <span className="text-sm font-semibold text-gray-900">Sesiones activas</span>
                  <p className="text-xs text-gray-500 mt-0.5">Solo ves tu sesión actual</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <SesionActual />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="twofactor" className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Autenticación de dos factores</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="text-sm text-gray-600 mb-4">
              Añade una capa extra de seguridad a tu cuenta.
            </div>
            <TwoFactorCard />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="passkeys" className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Passkeys</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="text-sm text-gray-600 mb-4">
              Usa tu huella digital, rostro o PIN para iniciar sesión rápidamente.
            </div>
            <PasskeysCard />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>

      <style jsx global>{`
        @keyframes accordion-down {
          from { height: 0; }
          to { height: var(--radix-accordion-content-height); }
        }
        @keyframes accordion-up {
          from { height: var(--radix-accordion-content-height); }
          to { height: 0; }
        }
        .animate-accordion-down {
          animation: accordion-down 200ms ease-out;
        }
        .animate-accordion-up {
          animation: accordion-up 200ms ease-out;
        }
      `}</style>
    </div>
  )
}

function SesionActual() {
  const [sesion, setSesion] = useState<{ user?: { email?: string } } | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setSesion(data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  if (cargando) {
    return <div className="h-12 bg-gray-50 rounded-lg animate-pulse" />
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-gray-900">Sesión actual</span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Activa
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {sesion?.user?.email || 'Sesión activa'} · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
