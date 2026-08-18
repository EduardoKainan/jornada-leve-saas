import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@/styles/globals.css';
import { getAppUrl } from '@/lib/app-url';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
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

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '4813458388881392';

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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
