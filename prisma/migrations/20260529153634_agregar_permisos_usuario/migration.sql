-- CreateEnum
CREATE TYPE "Permiso" AS ENUM ('VER_ANALISIS', 'EXPORTAR_REPORTES');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "permisos" "Permiso"[] DEFAULT ARRAY[]::"Permiso"[];
