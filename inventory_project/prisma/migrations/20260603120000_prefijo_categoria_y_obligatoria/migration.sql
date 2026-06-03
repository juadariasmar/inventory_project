-- 1) Agregar columna prefijo (nullable temporal para hacer backfill)
ALTER TABLE "Categoria" ADD COLUMN "prefijo" TEXT;

-- 2) Asegurar que exista la categoria 'Sin clasificar' (para productos sin categoria)
INSERT INTO "Categoria" ("nombre", "prefijo")
SELECT 'Sin clasificar', 'SIN'
WHERE NOT EXISTS (SELECT 1 FROM "Categoria" WHERE "nombre" = 'Sin clasificar');

-- 3) Reasignar productos sin categoria a 'Sin clasificar'
UPDATE "Producto"
SET "categoriaId" = (SELECT "id" FROM "Categoria" WHERE "nombre" = 'Sin clasificar' LIMIT 1)
WHERE "categoriaId" IS NULL;

-- 4) Generar prefijo para categorias existentes que aun no lo tengan.
-- Se hace en PL/pgSQL para detectar colisiones y agregar letras adicionales.
DO $$
DECLARE
    cat RECORD;
    base TEXT;
    candidato TEXT;
    nombre_limpio TEXT;
    longitud_max INT;
    intento INT;
BEGIN
    FOR cat IN
        SELECT "id", "nombre" FROM "Categoria" WHERE "prefijo" IS NULL ORDER BY "id"
    LOOP
        -- Normalizar: quitar acentos, mayusculas, no-alfanumericos. Primeras 3 letras.
        nombre_limpio := upper(translate(cat."nombre",
            'áéíóúñÁÉÍÓÚÑ',
            'AEIOUNAEIOUN'));
        nombre_limpio := regexp_replace(nombre_limpio, '[^A-Z0-9]', '', 'g');
        IF length(nombre_limpio) = 0 THEN
            nombre_limpio := 'CAT';
        END IF;
        longitud_max := length(nombre_limpio);
        intento := 0;
        candidato := substring(nombre_limpio, 1, 3);

        -- Agregar letras si choca con un prefijo ya asignado.
        WHILE EXISTS (SELECT 1 FROM "Categoria" WHERE "prefijo" = candidato) LOOP
            intento := intento + 1;
            IF (3 + intento) <= longitud_max THEN
                candidato := substring(nombre_limpio, 1, 3 + intento);
            ELSE
                candidato := substring(nombre_limpio, 1, 3) || intento::TEXT;
            END IF;
            -- Salvaguarda contra bucle infinito
            EXIT WHEN intento > 1000;
        END LOOP;

        UPDATE "Categoria" SET "prefijo" = candidato WHERE "id" = cat."id";
    END LOOP;
END $$;

-- 5) Volver el prefijo NOT NULL y UNIQUE
ALTER TABLE "Categoria" ALTER COLUMN "prefijo" SET NOT NULL;
CREATE UNIQUE INDEX "Categoria_prefijo_key" ON "Categoria"("prefijo");

-- 6) Eliminar la FK actual de Producto.categoriaId (era opcional, hay que recrearla)
ALTER TABLE "Producto" DROP CONSTRAINT IF EXISTS "Producto_categoriaId_fkey";

-- 7) Volver categoriaId NOT NULL en Producto
ALTER TABLE "Producto" ALTER COLUMN "categoriaId" SET NOT NULL;

-- 8) Recrear la FK como NOT NULL (sin SET NULL en delete, ahora RESTRICT)
ALTER TABLE "Producto"
  ADD CONSTRAINT "Producto_categoriaId_fkey"
  FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
