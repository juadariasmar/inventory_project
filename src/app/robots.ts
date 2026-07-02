import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/auth/sign-in',
        '/auth/sign-up',
        '/auth/forgot-password',
        '/auth/reset-password',
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/analisis/',
        '/categorias/',
        '/clientes/',
        '/compras/',
        '/cotizaciones/',
        '/empresa/',
        '/invitacion/',
        '/movimientos/',
        '/notificaciones/',
        '/onboarding/',
        '/productos/',
        '/proveedores/',
        '/venta-rapida/',
        '/ventas/',
        '/account/',
      ],
    },
    sitemap: 'https://inventory-project-ten.vercel.app/sitemap.xml',
  }
}
