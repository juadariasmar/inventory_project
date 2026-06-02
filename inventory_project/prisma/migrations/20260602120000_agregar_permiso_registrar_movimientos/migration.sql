-- AlterEnum: marcador para evitar drift entre las 3 ramas de evaluacion.
ALTER TYPE "Permiso" ADD VALUE IF NOT EXISTS 'REGISTRAR_MOVIMIENTOS';
