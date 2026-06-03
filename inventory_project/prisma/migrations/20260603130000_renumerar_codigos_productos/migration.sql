-- Renumera los codigos de TODOS los productos existentes al formato
-- PREFIJO-NNNNN, donde el numero es consecutivo por categoria ordenado
-- por id ASC (el producto mas antiguo de cada categoria queda en 00001).
--
-- Se hace en dos pasos para no chocar con la restriccion UNIQUE durante la
-- transicion: primero se asignan codigos temporales unicos, luego los finales.

BEGIN;

-- Paso 1: codigos temporales unicos para "liberar" los valores actuales y
-- evitar colisiones con los codigos finales.
UPDATE "Producto"
SET "codigo" = '__TMP_' || "id"::TEXT;

-- Paso 2: codigos finales PREFIJO-NNNNN, numerados por categoria.
WITH numerados AS (
    SELECT
        p."id" AS producto_id,
        c."prefijo" AS prefijo,
        ROW_NUMBER() OVER (
            PARTITION BY p."categoriaId"
            ORDER BY p."id" ASC
        ) AS posicion
    FROM "Producto" p
    JOIN "Categoria" c ON c."id" = p."categoriaId"
)
UPDATE "Producto" p
SET "codigo" = n.prefijo || '-' || LPAD(n.posicion::TEXT, 5, '0')
FROM numerados n
WHERE p."id" = n.producto_id;

COMMIT;
