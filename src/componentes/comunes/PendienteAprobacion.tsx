export default function PendienteAprobacion() {
  return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-xl shadow-sm border border-border p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Cuenta Pendiente de Aprobación
        </h2>
        <p className="text-muted-foreground mb-6">
          Tu cuenta ha sido creada exitosamente pero requiere aprobación de un administrador para acceder al sistema.
        </p>
        <div className="p-4 bg-info/10 text-info rounded-lg text-sm border border-info/20">
          Por favor, contacta a tu administrador para que active tu cuenta.
        </div>
      </div>
    </div>
  )
}
