# Design Spec: API & Middleware Testing

## 1. Overview
This design implements integration and security testing for the Next.js API routes (Movimientos and Cotizaciones) and the auth middleware, as recommended by the ECC Tools analysis report. 

## 2. Approach
We will use unit testing over Route Handlers and Middleware functions by directly passing Web API `Request` and `NextRequest` objects using Jest in a Node environment. This approach was chosen for its execution speed and flexibility for isolated security testing, avoiding the overhead of spinning up an actual HTTP server.

## 3. Architecture & Components

### 3.1. Test Utilities
Location: `src/__tests__/utils/test-utils.ts`
- Provide functions to generate mock `NextRequest` objects using the standard Web Fetch API (`new Request(...)`) to ensure compatibility with Next.js App Router.
- Provide a mechanism to mock the `obtenerSesion` functionality exported by NextAuth/auth utilities so protected routes bypass the authentication check during integration tests.

### 3.2. Middleware Security Tests
Location: `src/__tests__/middleware.test.ts`
Scenarios to cover:
- **Rate Limiting:** Simulate consecutive POST requests to `/api/auth/callback/credentials` using a consistent `x-forwarded-for` header (IP). Ensure requests 1 through 5 pass and the 6th returns HTTP 429.
- **Window Expiration:** Use `jest.useFakeTimers()` to fast-forward time by 60 seconds and verify that the rate limit resets, allowing the 7th request to pass.
- **Normal Flow:** Verify that non-auth routes are entirely unaffected by the rate limiting mechanism.

### 3.3. Movimientos API Integration
Location: `src/__tests__/api/movimientos.test.ts`
Scenarios to cover (POST handler):
- Validate successful entry ('entrada').
- Validate successful exit ('salida') with sufficient stock.
- Validate failed exit ('salida') with insufficient stock (ensure it returns HTTP 400).

### 3.4. Cotizaciones API Integration
Location: `src/__tests__/api/cotizaciones.test.ts`
Scenarios to cover (POST handler):
- Validate successful creation of a quote.
- Validate that a quote reserving stock correctly prevents a second conflicting quote from exceeding available inventory, testing our TOCTOU fixes.

## 4. Dependencies
- Node standard `Request` API for mocks (native to Node 18+).
- `jest` and `ts-jest` (already configured in the project).
- Testing Database: Existing Prisma setup (using `DATABASE_URL` or an SQLite test db if preferred later, though existing integration tests seem to run sequentially using `--runInBand` on the primary DB).

## 5. Scope
This spec explicitly targets integration testing for the API routes mentioned above and the middleware rate-limiting. UI component tests and full end-to-end browser tests (e.g. Playwright) are out of scope for this spec.
