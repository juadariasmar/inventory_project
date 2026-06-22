# Plan: Investigate and Resolve Login HTTP 500 Errors and Audit Application Integrity

## Objective
Assess, reproduce, and fix the HTTP 500 errors occurring on Vercel during login (Google OAuth and OTP codes) for the `inventory_project` application, and perform an integrity and performance audit.

## Steps
1. **Phase 1: Exploration & Diagnostics**
   - Spawn an **Explorer** agent to search the codebase for Neon Auth configuration, middleware logic, package versions, and Vercel-specific serverless configuration.
   - The Explorer will identify potential causes for the HTTP 500 errors, such as:
     - Missing headers, proxy setup issues, cookie domain mismatches, or serialization issues in serverless functions.
     - Vercel deployment constraints regarding `Next.js 16` and `@neondatabase/auth` integrations.
     - Rate-limiting (Redis vs fallback map on Edge/Node runtime).
     - Component-level mutations or side-effects in React 19/Next 16.
2. **Phase 2: Reproduction Strategy**
   - Create a test script/simulation harness (`simulacion/`) to run under restrictive edge/node environments to reproduce the 500 error.
   - Verify if headers are missing or mutated in the middleware.
3. **Phase 3: Implementation**
   - Spawn a **Worker** agent to apply the fixes recommended by the Explorer.
   - The Worker will implement configuration or code changes, align Next.js/Vercel cookies and proxy setup, and optimize Next.js best practices and performance.
4. **Phase 4: Verification & Challenger Verification**
   - Run unit and integration tests to verify the fix works.
   - Spawn a **Reviewer/Challenger** to review correctness, performance, and code layout.
5. **Phase 5: Integrity Auditing**
   - Spawn a **Forensic Auditor** to run integrity checks, verifying that no test results or behaviors are hardcoded.
6. **Phase 6: Final Synthesis & Victory Claim**
   - Compile results, check all acceptance criteria, and send the completion handoff to the parent.
