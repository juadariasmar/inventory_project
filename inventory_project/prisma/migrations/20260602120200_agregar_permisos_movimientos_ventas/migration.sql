-- AlterEnum: idempotente para que las 3 ramas de evaluacion coexistan en la
-- misma base de datos sin conflicto.
ALTER TYPE "Permiso" ADD VALUE IF NOT EXISTS 'REGISTRAR_MOVIMIENTOS';
ALTER TYPE "Permiso" ADD VALUE IF NOT EXISTS 'REALIZAR_VENTAS';
