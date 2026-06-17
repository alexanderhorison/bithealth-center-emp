import type { Metadata, Viewport } from 'next';
import { Manrope, Noto_Sans_JP } from 'next/font/google';

import { Providers } from '@/app/providers';
import { RegisterServiceWorker } from '@/components/pwa/register-service-worker';
import '@/app/globals.css';

const notoSansJp = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700']
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'Bithealth Center',
  description: "Bithealth Center is your company's command center for daily operations.",
  applicationName: 'Bithealth Center',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f4f1ea'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${notoSansJp.variable} ${manrope.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
