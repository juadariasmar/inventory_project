# Dependabot Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver las vulnerabilidades de seguridad reportadas por Dependabot actualizando las dependencias en ambos archivos `package.json` (raíz e interno).

**Architecture:** Se ejecutarán comandos de actualización de dependencias (`npm audit fix` y actualizaciones manuales) para las librerías afectadas, asegurando que las pruebas existentes continúen pasando y el build sea exitoso.

**Tech Stack:** Node.js, npm, Next.js, Prisma

## Global Constraints

- Validar que después de cada actualización, el proyecto siga compilando (`npm run build`).
- No realizar "breaking changes" mayores a menos que sea estrictamente necesario para la seguridad.
- Ejecutar pruebas automatizadas tras las actualizaciones (`npm run test:e2e` y/o `npm test`).

---

### Task 1: Actualizar dependencias en el proyecto raíz

**Files:**
- Modify: `C:/Users/juan/Documents/ADSO/PROYECTO/inventory_project/package.json`
- Modify: `C:/Users/juan/Documents/ADSO/PROYECTO/inventory_project/package-lock.json`

**Interfaces:**
- Consumes: N/A
- Produces: Dependencias limpias de vulnerabilidades en la raíz.

- [ ] **Step 1: Ejecutar actualización automática y segura de dependencias**

Ejecutar en la terminal en la raíz (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`):

```bash
npm audit fix
```
Expected: Mensaje indicando que se actualizaron paquetes o que quedan vulnerabilidades que requieren `--force`.

- [ ] **Step 2: Actualizar @hono/node-server explícitamente (si es necesario)**

Ejecutar en la terminal en la raíz (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`):

```bash
npm install @hono/node-server@latest
```
Expected: Instalación exitosa de una versión segura (>=1.19.13).

- [ ] **Step 3: Actualizar Prisma explícitamente**

Ejecutar en la terminal en la raíz (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`):

```bash
npm install prisma@latest @prisma/dev@latest
```
Expected: Instalación exitosa sin romper la compatibilidad actual.

- [ ] **Step 4: Verificar vulnerabilidades en la raíz**

Ejecutar en la terminal en la raíz (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`):

```bash
npm audit
```
Expected: `found 0 vulnerabilities` (o solo dependencias que no tienen fix disponible seguro).

- [ ] **Step 5: Commit**

Ejecutar en la terminal en la raíz (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`):

```bash
git add package.json package-lock.json
git commit -m "chore: update root dependencies to fix dependabot alerts"
```

### Task 2: Actualizar dependencias en inventory_project (Frontend/Backend)

**Files:**
- Modify: `C:/Users/juan/Documents/ADSO/PROYECTO/inventory_project/inventory_project/package.json`
- Modify: `C:/Users/juan/Documents/ADSO/PROYECTO/inventory_project/inventory_project/package-lock.json`

**Interfaces:**
- Consumes: N/A
- Produces: Entorno seguro para la aplicación Next.js.

- [ ] **Step 1: Ejecutar actualización automática segura en el subproyecto**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
npm audit fix
```
Expected: Corrección de las vulnerabilidades que no rompan la compatibilidad de forma directa.

- [ ] **Step 2: Actualizar dependencias clave manualmente para vulnerabilidades altas/críticas**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
npm install next@latest next-auth@latest preact@latest exceljs@latest postcss@latest
```
Expected: Actualización a las últimas versiones, resolviendo los avisos de "Next Server Actions Source Code Exposure", "Preact JSON VNode Injection", y "uuid".

- [ ] **Step 3: Verificar vulnerabilidades en el subproyecto**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
npm audit
```
Expected: `found 0 vulnerabilities` o reducción significativa de severidad alta.

- [ ] **Step 4: Validar que el proyecto compila y los tests pasan**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
npm run build
```
Expected: Compilación exitosa sin errores de tipado o de Prisma.

- [ ] **Step 5: Ejecutar suite de testing**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
npm run test
```
Expected: Todos los tests pasando de forma exitosa.

- [ ] **Step 6: Commit**

Ejecutar en la terminal en el subproyecto (`C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`):

```bash
git add package.json package-lock.json
git commit -m "chore: update inventory_project dependencies to fix dependabot alerts"
```
