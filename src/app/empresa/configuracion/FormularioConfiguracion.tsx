'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toast from '@radix-ui/react-toast'
import {
  ChevronDown,
  Save,
  Building2,
  Percent,
  Phone,
  MapPin,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react'

interface Configuracion {
  moneda: string
  simboloMoneda: string
  impuestos: number
  logoUrl: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  nombrePersonalizado: string | null
}

const MONEDAS = [
  { valor: 'COP', etiqueta: 'COP - Peso colombiano', simbolo: '$' },
  { valor: 'USD', etiqueta: 'USD - Dólar estadounidense', simbolo: 'US$' },
  { valor: 'EUR', etiqueta: 'EUR - Euro', simbolo: '€' },
  { valor: 'MXN', etiqueta: 'MXN - Peso mexicano', simbolo: 'MX$' },
  { valor: 'ARS', etiqueta: 'ARS - Peso argentino', simbolo: 'AR$' },
  { valor: 'CLP', etiqueta: 'CLP - Peso chileno', simbolo: 'CLP$' },
]

export default function FormularioConfiguracion() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [toastAbierto, setToastAbierto] = useState(false)
  const [toastMensaje, setToastMensaje] = useState('')

  const [config, setConfig] = useState<Configuracion>({
    moneda: 'COP',
    simboloMoneda: '$',
    impuestos: 19,
    logoUrl: null,
    direccion: null,
    telefono: null,
    email: null,
    nombrePersonalizado: null,
  })

  useEffect(() => {
    fetch('/api/empresa/configuracion')
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar configuración')
        return r.json()
      })
      .then((data) => {
        setConfig({
          moneda: data.moneda || 'COP',
          simboloMoneda: data.simboloMoneda || '$',
          impuestos: data.impuestos ?? 19,
          logoUrl: data.logoUrl || null,
          direccion: data.direccion || null,
          telefono: data.telefono || null,
          email: data.email || null,
          nombrePersonalizado: data.nombrePersonalizado || null,
        })
        setCargando(false)
      })
      .catch((e) => {
        console.error(e)
        setError('Error al cargar la configuración')
        setCargando(false)
      })
  }, [])

  const monedaActual = MONEDAS.find((m) => m.valor === config.moneda) ?? MONEDAS[0]

  const handleMonedaChange = (valor: string) => {
    const moneda = MONEDAS.find((m) => m.valor === valor) ?? MONEDAS[0]
    setConfig((prev) => ({ ...prev, moneda: moneda.valor, simboloMoneda: moneda.simbolo }))
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      const r = await fetch('/api/empresa/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (r.ok) {
        setToastMensaje('Configuración guardada correctamente')
        setToastAbierto(true)
        router.refresh()
      } else {
        const err = await r.json()
        setError(err.error || 'Error al guardar')
      }
    } catch {
      setError('Error al guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <p className="text-gray-500 text-center py-12">Cargando configuración...</p>
  }

  return (
    <Tooltip.Provider delayDuration={300}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Configuración de la empresa</h1>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Tabs.Root defaultValue="general" className="bg-white rounded-xl shadow-sm border border-border">
              <Tabs.List className="flex border-b border-border px-6">
                <Tabs.Trigger
                  value="general"
                  className="px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary hover:text-gray-700 transition-colors"
                >
                  General
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="impuestos"
                  className="px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary hover:text-gray-700 transition-colors"
                >
                  Impuestos
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="contacto"
                  className="px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary hover:text-gray-700 transition-colors"
                >
                  Contacto
                </Tabs.Trigger>
              </Tabs.List>

              <div className="p-6 space-y-6">
                <Tabs.Content value="general" className="space-y-5 focus:outline-none">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre personalizado
                    </label>
                    <input
                      type="text"
                      value={config.nombrePersonalizado ?? ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, nombrePersonalizado: e.target.value || null }))}
                      placeholder="Ej: Mi Empresa S.A.S."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si se deja vacío, se usará el nombre asignado al registrarse.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Moneda
                    </label>
                    <Select.Root value={config.moneda} onValueChange={handleMonedaChange}>
                      <Select.Trigger className="w-full inline-flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <Select.Value>
                          {monedaActual.etiqueta}
                        </Select.Value>
                        <Select.Icon>
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-md shadow-lg border border-border py-1">
                          <Select.Viewport>
                            {MONEDAS.map((m) => (
                              <Select.Item
                                key={m.valor}
                                value={m.valor}
                                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer data-[state=checked]:bg-blue-50 data-[state=checked]:text-primary focus:outline-none"
                              >
                                <Select.ItemText>{m.etiqueta}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Símbolo de moneda
                    </label>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <input
                          type="text"
                          value={config.simboloMoneda}
                          onChange={(e) => setConfig((prev) => ({ ...prev, simboloMoneda: e.target.value }))}
                          maxLength={5}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 px-3 py-1.5 text-xs text-white bg-gray-800 rounded-md"
                          side="top"
                        >
                          Se actualiza automáticamente al cambiar la moneda
                          <Tooltip.Arrow className="fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="impuestos" className="space-y-5 focus:outline-none">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impuesto por defecto (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={config.impuestos}
                        onChange={(e) => setConfig((prev) => ({ ...prev, impuestos: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <Percent className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      IVA, ITBMS, GST, etc. según tu país. Usa 0 si no aplica.
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Incluir impuesto en precios</p>
                      <p className="text-xs text-gray-500">Los precios se muestran con impuesto incluido</p>
                    </div>
                    <Switch.Root
                      checked={config.impuestos > 0}
                      onCheckedChange={(checked) => {
                        if (checked && config.impuestos === 0) {
                          setConfig((prev) => ({ ...prev, impuestos: 19 }))
                        }
                      }}
                      className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-primary relative cursor-pointer"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                    </Switch.Root>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="contacto" className="space-y-5 focus:outline-none">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={config.direccion ?? ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, direccion: e.target.value || null }))}
                        placeholder="Calle 123 # 45-67"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={config.telefono ?? ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, telefono: e.target.value || null }))}
                        placeholder="+57 300 123 4567"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de contacto
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={config.email ?? ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value || null }))}
                        placeholder="contacto@miempresa.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </Tabs.Content>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </Tabs.Root>
        </div>

        <Toast.Root
          open={toastAbierto}
          onOpenChange={setToastAbierto}
          className="fixed bottom-4 right-4 z-[100] w-[90vw] max-w-sm bg-white rounded-lg shadow-2xl p-4 border-l-4 border-emerald-500 data-[state=open]:animate-in data-[state=closed]:animate-out"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <Toast.Title className="text-sm font-semibold text-emerald-800">
                {toastMensaje}
              </Toast.Title>
            </div>
            <Toast.Close asChild>
              <button type="button" className="shrink-0 text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </Toast.Close>
          </div>
        </Toast.Root>

        <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col p-6 gap-2 w-full max-w-sm outline-none" />
      </Toast.Provider>
    </Tooltip.Provider>
  )
}
