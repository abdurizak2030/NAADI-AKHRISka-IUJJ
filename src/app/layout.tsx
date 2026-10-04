import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/theme/ThemeContext';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { AppProvider } from '@/components/AppProvider';
import SiteShell from '@/components/SiteShell';
import { getPublicSettings } from '@/lib/server/public-data';
import { SITE_NAME } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'IUJ Reading Club — Islamic University of Jigjiga',
    template: '%s | IUJ Reading Club',
  },
  description:
    'Naadiga Akhriska ee Jaamacadda Islaamiga Jigjiga — a reading club community for articles, a digital library, media, events, and scholarly discussion at the Islamic University of Jigjiga.',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'IUJ Reading Club — Islamic University of Jigjiga',
    description:
      'Articles, a digital library, media, events, and scholarly discussion for the Reading Club of the Islamic University of Jigjiga.',
    type: 'website',
    siteName: SITE_NAME,
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'IUJ Reading Club — Islamic University of Jigjiga',
    description: 'A reading club community for articles, a digital library, media, and events.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F1FDF6' },
    { media: '(prefers-color-scheme: dark)', color: '#06140c' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AppProvider initialSettings={settings}>
              <SiteShell>{children}</SiteShell>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
