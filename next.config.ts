import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Neon Auth (autenticación), Vercel Analytics/Speed Insights y Google OAuth
  // requieren peticiones salientes desde el cliente; 'self' a secas las bloquea
  // y rompe la hidratación de los componentes de auth-ui.
  "connect-src 'self' https://*.neon.tech wss://*.neon.tech https://*.vercel-insights.com https://vitals.vercel-insights.com https://accounts.google.com",
  "frame-src 'self' https://accounts.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Fuerza HTTPS por 2 años en el dominio y subdominios.
    // Activar 'preload' solo cuando el dominio esté listo para la lista HSTS preload.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
