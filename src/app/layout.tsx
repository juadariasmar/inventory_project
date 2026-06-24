import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProveedorSesion from "@/componentes/comunes/ProveedorSesion";
import ProveedorToast from "@/componentes/comunes/ProveedorToast";
import { ProveedorTema } from "@/componentes/comunes/ProveedorTema";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Sistema de Inventarios",
  description: "Gestión de inventarios - Juan",
  robots: { index: false, follow: false },
};

const scriptAntiFOUC = `
  (function() {
    try {
      var t = localStorage.getItem('inventory-theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptAntiFOUC }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          Saltar al contenido principal
        </a>
        <ProveedorTema>
          <ProveedorSesion>
            <ProveedorToast>
              {children}
            </ProveedorToast>
          </ProveedorSesion>
        </ProveedorTema>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
