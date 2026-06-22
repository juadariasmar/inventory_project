# Handoff Report - teamwork_preview_explorer

## 1. Observation

During static analysis of the target authentication configuration files and build outputs, the following details were observed:

1. **File `src/lib/auth/server.ts`** (Lines 3-8):
   ```typescript
   export const auth = createNeonAuth({
     baseUrl: process.env.NEON_AUTH_BASE_URL!,
     cookies: {
       secret: process.env.NEON_AUTH_COOKIE_SECRET || 'secret-for-build-only-change-in-prod',
     },
   })
   ```
   - Observed that `baseUrl` depends strictly on `process.env.NEON_AUTH_BASE_URL` with no fallback string or validation guard on initialization.
   - Observed that `cookies.sameSite` is not configured, which defaults to `'strict'` inside `@neondatabase/auth` (as seen in `node_modules/@neondatabase/auth/dist/next/server/index.mjs` line 1506: `const effectiveSameSite = sameSite ?? "strict"`).

2. **File `node_modules/@neondatabase/auth/dist/next/server/index.mjs`** (Lines 1076-1081, 1128-1134):
   ```javascript
   const upstreamURL = getUpstreamURL(baseUrl, path, { originalUrl: new URL(request.url) });
   const response = await fetch(upstreamURL.toString(), { ... });
   ...
   log?.error("[neon-auth] Unexpected proxy error", { ... });
   return Response.json({
       error: classified.clientMessage,
       code: "INTERNAL_ERROR"
   }, {
       status: 500,
       headers: { "Content-Type": "application/json" }
   });
   ```
   - In `handleAuthRequest`, any exception thrown when constructing the upstream URL is caught and returns an HTTP 500 response (`INTERNAL_ERROR`).

3. **File `next.config.ts`** (Line 9):
   ```typescript
   "connect-src 'self'",
   ```
   - The CSP connect directive strictly allows `'self'` only, blocking client-side fetch requests to any external host, including the Neon Auth server.

4. **Next.js Build Output Warning** (Observed in `task-95` logs):
   ```
   ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
   ✓ Compiled successfully in 13.6s
   ```
   - Next.js compilation succeeds, but it flags that `middleware.ts` is deprecated in Next.js 16 in favor of `proxy.ts`.

---

## 2. Logic Chain

1. **Missing Vercel Env Variables:**
   - Locally, environment variables (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`) are appended to `.env.local` via `append-env.js`.
   - On Vercel, `.env.local` is gitignored and not uploaded. If these variables are not configured in Vercel's console, `process.env.NEON_AUTH_BASE_URL` resolves to `undefined` in production.
   - In `getUpstreamURL`, executing `new URL("undefined/<path>")` throws a `TypeError: Failed to parse URL` because the input is not a valid absolute URL.
   - `handleAuthRequest` catches this error and returns an HTTP 500 response with status code 500 and body containing `code: "INTERNAL_ERROR"`. This directly explains the HTTP 500 login error on Vercel.

2. **Google OAuth Callback Failures via SameSite Policy:**
   - Because `sameSite` defaults to `strict`, cookies like the session challenge (`neon-auth.session-challenge`) are written with `SameSite=Strict`.
   - When the user is redirected back from Google to the Vercel site, it is a cross-site top-level navigation. The browser blocks `SameSite=Strict` cookies from being sent in the redirect request.
   - Without the challenge cookie, `needsSessionVerification` returns `false`, preventing the server from exchanging the verifier token for the session token.

3. **CSP Blocking Client Requests:**
   - The CSP directive `connect-src 'self'` prevents client components from querying the Neon Auth database domain directly, which blocks interactive user actions.

4. **Next.js Deprecation Warning:**
   - Next.js 16 expects `middleware.ts` to be renamed to `proxy.ts`. Keeping `src/middleware.ts` triggers deprecation warnings.

---

## 3. Caveats

- Since no HTTP access to external domains is permitted under the current network constraints (`CODE_ONLY`), we could not test connections to a live Neon Auth instance.
- We did not manually set environment variables on Vercel because we only have read-only access to the local codebase.

---

## 4. Conclusion

The HTTP 500 errors on Vercel are caused by:
1. **Missing `NEON_AUTH_BASE_URL` in Vercel dashboard environment variables**, causing `new URL("undefined/...")` to throw a `TypeError`, which is converted by the Neon Auth SDK to an HTTP 500 response.
2. **Missing `NEON_AUTH_COOKIE_SECRET` on Vercel**, which defaults to a development fallback.
3. **SameSite default set to `strict`**, preventing session verification challenge cookies from being transmitted upon returning from the Google OAuth redirect.
4. **Strict CSP configuration** blocking client-side network connections to the Neon Auth server.

Additionally, Next.js 16 emits a deprecation warning because `src/middleware.ts` should be renamed to `src/proxy.ts`.

---

## 5. Verification Method

To independently verify these findings:
1. Check the Vercel Dashboard for the deployment. Verify if `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (at least 32 characters) are listed under environment variables. If missing, this validates the diagnosis.
2. Check the browser console during a login attempt. If there is a CSP violation regarding `connect-src` pointing to `*.neonauth.us-east-1.aws.neon.tech`, it validates the CSP block.
3. Inspect `src/lib/auth/server.ts` to check if `cookies.sameSite` is missing. Adding `sameSite: 'lax'` to the cookie configuration and renaming `src/middleware.ts` to `src/proxy.ts` should remove the deprecation warning and permit the transmission of cookies upon Google redirect.
4. Run `npx next build` to verify the build completes successfully (as shown in the task-95 logs).
