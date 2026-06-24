'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/componentes/comunes/Input'
import { Select } from '@/componentes/comunes/Select'
import { Button } from '@/componentes/comunes/Button'
import { AlertCircle } from 'lucide-react'

interface Categoria {
  id: number
  nombre: string
  prefijo: string
}

interface DatosProducto {
  id?: number
  nombre: string
  descripcion: string
  codigo: string
  precio: number
  cantidad: number
  stockMinimo: number
  categoriaId: number
}

interface PropiedadesFormulario {
  producto?: DatosProducto
  categorias: Categoria[]
}

export default function FormularioProducto({
  producto,
  categorias,
}: PropiedadesFormulario) {
  const router = useRouter()
  const esEdicion = !!producto?.id

  const categoriaInicial = producto?.categoriaId?.toString() || (categorias[0]?.id?.toString() ?? '')

  const [datos, setDatos] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    codigo: producto?.codigo || '',
    precio: producto?.precio?.toString() || '',
    cantidad: producto?.cantidad?.toString() || '0',
    stockMinimo: producto?.stockMinimo?.toString() || '1',
    categoriaId: categoriaInicial,
  })
  const [codigoAutoSugerido, setCodigoAutoSugerido] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (esEdicion) return
    const categoriaId = datos.categoriaId
    if (!categoriaId) return
    if (datos.codigo && !codigoAutoSugerido) return
    let cancelado = false
    fetch(`/api/productos/sugerir-codigo?categoria=${categoriaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado && d?.codigo) {
          setDatos((prev) => ({ ...prev, codigo: d.codigo }))
          setCodigoAutoSugerido(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos.categoriaId, esEdicion])

  const manejarCambio = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setDatos((prev) => ({ ...prev, [name]: value }))
    if (name === 'codigo') setCodigoAutoSugerido(false)
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)

    try {
      const url = esEdicion ? `/api/productos/${producto.id}` : '/api/productos'
      const metodo = esEdicion ? 'PUT' : 'POST'

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (respuesta.ok) {
        router.push('/productos')
        router.refresh()
      } else {
        const errorData = await respuesta.json()
        setError(errorData.error || 'Error al guardar el producto')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  const categoriasOptions = categorias.map((cat) => ({
    value: cat.id,
    label: `${cat.nombre} (${cat.prefijo})`,
  }))

  return (
    <form onSubmit={manejarEnvio} className="space-y-6" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Código"
          id="codigo"
          name="codigo"
          value={datos.codigo}
          onChange={manejarCambio}
          required
          hint={!esEdicion && codigoAutoSugerido ? 'Sugerido automáticamente según la categoría. Puedes editarlo si prefieres otro.' : undefined}
        />

        <Input
          label="Nombre"
          id="nombre"
          name="nombre"
          value={datos.nombre}
          onChange={manejarCambio}
          required
        />

        <div className="md:col-span-2">
          <Input
            label="Descripción"
            id="descripcion"
            name="descripcion"
            value={datos.descripcion}
            onChange={manejarCambio}
          />
        </div>

        <Select
          label="Categoría"
          id="categoriaId"
          name="categoriaId"
          value={datos.categoriaId}
          onChange={manejarCambio}
          options={categoriasOptions}
          required
        />

        <Input
          label="Precio"
          type="number"
          id="precio"
          name="precio"
          value={datos.precio}
          onChange={manejarCambio}
          step="0.01"
          min="0"
          required
        />

        <Input
          label={esEdicion ? 'Cantidad actual' : 'Cantidad inicial'}
          type="number"
          id="cantidad"
          name="cantidad"
          value={datos.cantidad}
          onChange={manejarCambio}
          min={esEdicion ? producto?.cantidad ?? 0 : 0}
          hint={
            esEdicion
              ? 'Aumentar genera un movimiento de entrada automático. Para reducir el stock, registra un movimiento de salida desde Movimientos.'
              : 'Si es mayor a 0, se registrará un movimiento de entrada como "Stock inicial".'
          }
        />

        <Input
          label="Stock Mínimo"
          type="number"
          id="stockMinimo"
          name="stockMinimo"
          value={datos.stockMinimo}
          onChange={manejarCambio}
          min="0"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={guardando} loadingText="Guardando...">
          {esEdicion ? 'Actualizar' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  )
}
