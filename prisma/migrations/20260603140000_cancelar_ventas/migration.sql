-- Campos para cancelacion de ventas
ALTER TABLE "Venta" ADD COLUMN "canceladaEn" TIMESTAMP(3);
ALTER TABLE "Venta" ADD COLUMN "canceladaPorId" INTEGER;
ALTER TABLE "Venta" ADD COLUMN "motivoCancelacion" TEXT;

CREATE INDEX "Venta_canceladaEn_idx" ON "Venta"("canceladaEn");

ALTER TABLE "Venta"
  ADD CONSTRAINT "Venta_canceladaPorId_fkey"
  FOREIGN KEY ("canceladaPorId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
