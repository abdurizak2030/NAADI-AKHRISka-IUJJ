import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/theme/ThemeContext';
import { LanguageProvider } from '@/i18n/LanguageContext';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
