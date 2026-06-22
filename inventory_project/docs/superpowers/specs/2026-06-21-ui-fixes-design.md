# UI/UX & CI Fixes Design

## 1. Overview
This project addresses three specific issues found during the deployment and CI process:
1. CI pipeline failing due to an outdated import in the middleware tests.
2. Dashboard alerts failing to route to the correct sections on the Analysis page.
3. Product table layout overflowing due to wide action buttons.

## 2. Architecture & Components

### 2.1 CI Tests Fix
- **Target File**: `src/__tests__/middleware.test.ts`
- **Change**: Update the module import from `../../src/middleware` to `../../src/proxy` to reflect the Next.js 16 requirements implemented in a previous refactor.

### 2.2 Dashboard Alert Routing Fix
- **Target File**: `src/app/analisis/page.tsx`
- **Problem**: Next.js `<Suspense>` boundaries prevent the browser from naturally scrolling to a `#hash` identifier on initial load because the target DOM elements are not rendered yet.
- **Solution**: 
  - Create a new Client Component `AutoScroller` (or similar name) within the analysis page.
  - The component will use a `useEffect` hook to read `window.location.hash` on mount.
  - If a hash is present, it will query the DOM for the corresponding ID and call `.scrollIntoView({ behavior: 'smooth' })`.

### 2.3 Product Table Layout Refactor
- **Target File**: `src/componentes/ListaProductosFiltrable.tsx`
- **New Component**: `src/componentes/MenuDesplegableAcciones.tsx` (Dropdown Menu)
- **Problem**: Too many large text buttons in the "Acciones" column cause horizontal overflow and poor UX.
- **Solution**:
  - Maintain the primary **"Vender"** action as a visible, compact button.
  - Group secondary actions (**"Histórico"**, **"Editar"**, **"Eliminar"**) inside a new interactive `MenuDesplegableAcciones` component.
  - The dropdown menu will use a simple three-dots icon (`⋮`) as its trigger.
  - Update table column widths to take advantage of the newly freed horizontal space.

## 3. Data Flow & State
- No core business logic or database schemas are modified.
- The Dropdown Menu will manage its own local `isOpen` state.
- `BotonEliminarProducto`'s internal logic remains unchanged, merely its placement moves inside the dropdown container.

## 4. Testing Strategy
- Run the full test suite (`npm run test`) to ensure the CI test failure is resolved.
- Visually verify the table layout responsiveness.
- Manually test the dashboard alert links to confirm smooth scrolling occurs after Suspense resolves.
