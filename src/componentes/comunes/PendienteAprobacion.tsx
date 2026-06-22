export default function PendienteAprobacion() {
  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Cuenta Pendiente de Aprobación
        </h2>
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido creada exitosamente pero requiere aprobación de un administrador para acceder al sistema.
        </p>
        <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-sm">
          Por favor, contacta a tu administrador para que active tu cuenta.
        </div>
      </div>
    </div>
  )
}
