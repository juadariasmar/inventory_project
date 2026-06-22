-- AlterEnum: marcador para evitar drift entre las 3 ramas de evaluacion.
ALTER TYPE "Permiso" ADD VALUE IF NOT EXISTS 'AGREGAR_STOCK';
ALTER TYPE "Permiso" ADD VALUE IF NOT EXISTS 'DESCONTAR_STOCK';
