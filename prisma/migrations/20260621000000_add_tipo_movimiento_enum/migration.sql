-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('entrada', 'salida');

-- AlterTable
ALTER TABLE "Movimiento" ALTER COLUMN "tipo" TYPE "TipoMovimiento" USING "tipo"::"text"::"TipoMovimiento";
