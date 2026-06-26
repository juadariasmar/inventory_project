-- DropIndex
DROP INDEX IF EXISTS "Categoria_nombre_key";

-- DropIndex
DROP INDEX IF EXISTS "Categoria_prefijo_key";

-- DropIndex
DROP INDEX IF EXISTS "Producto_codigo_key";

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_empresaId_nombre_key" ON "Categoria"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_empresaId_prefijo_key" ON "Categoria"("empresaId", "prefijo");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresaId_codigo_key" ON "Producto"("empresaId", "codigo");
