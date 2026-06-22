-- Enum del estado de cotizacion
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'CONVERTIDA', 'CANCELADA');

-- Tabla principal Cotizacion
CREATE TABLE "Cotizacion" (
    "id" SERIAL PRIMARY KEY,
    "vendedorId" INTEGER,
    "cliente" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "validaHasta" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ventaId" INTEGER,
    "convertidaEn" TIMESTAMP(3),
    "canceladaEn" TIMESTAMP(3),
    "canceladaPorId" INTEGER,
    "motivoCancelacion" TEXT
);

CREATE UNIQUE INDEX "Cotizacion_ventaId_key" ON "Cotizacion"("ventaId");
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");
CREATE INDEX "Cotizacion_validaHasta_idx" ON "Cotizacion"("validaHasta");
CREATE INDEX "Cotizacion_creadoEn_idx" ON "Cotizacion"("creadoEn" DESC);
CREATE INDEX "Cotizacion_vendedorId_idx" ON "Cotizacion"("vendedorId");

ALTER TABLE "Cotizacion"
  ADD CONSTRAINT "Cotizacion_vendedorId_fkey"
  FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cotizacion"
  ADD CONSTRAINT "Cotizacion_ventaId_fkey"
  FOREIGN KEY ("ventaId") REFERENCES "Venta"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cotizacion"
  ADD CONSTRAINT "Cotizacion_canceladaPorId_fkey"
  FOREIGN KEY ("canceladaPorId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabla de items
CREATE TABLE "ItemCotizacion" (
    "id" SERIAL PRIMARY KEY,
    "cotizacionId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL
);

CREATE INDEX "ItemCotizacion_cotizacionId_idx" ON "ItemCotizacion"("cotizacionId");
CREATE INDEX "ItemCotizacion_productoId_idx" ON "ItemCotizacion"("productoId");

ALTER TABLE "ItemCotizacion"
  ADD CONSTRAINT "ItemCotizacion_cotizacionId_fkey"
  FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ItemCotizacion"
  ADD CONSTRAINT "ItemCotizacion_productoId_fkey"
  FOREIGN KEY ("productoId") REFERENCES "Producto"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
