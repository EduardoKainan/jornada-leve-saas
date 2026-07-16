import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://jornadaleve.com.br'),
  title: {
    default: 'Jornada Leve',
    template: '%s | Jornada Leve',
  },
  description:
    'Sua jornada de emagrecimento organizada em um só lugar: acompanhe sua evolução, registre sua rotina e gere relatórios para suas consultas.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Jornada Leve',
    title: 'Jornada Leve — sua evolução organizada',
    description: 'Registre sua rotina, acompanhe sua evolução e prepare relatórios para suas consultas com privacidade.',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Jornada Leve' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jornada Leve — sua evolução organizada',
    description: 'Acompanhe sua jornada com registros simples, gráficos e privacidade.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jornada Leve',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
