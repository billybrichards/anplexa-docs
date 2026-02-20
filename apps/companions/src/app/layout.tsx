// Root layout for Next.js app
import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit, Cinzel, Crimson_Pro } from 'next/font/google';
import { ConditionalNavbar } from '@/components/ConditionalNavbar';
import './globals.css';
import '../styles/cosmic-theme.css';

// Configure fonts
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-crimson',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Anplexa | AI That Knows Your Stars',
  description: 'Your complete birth chart powers every conversation. Personalized AI companion based on your astrological profile.',
  keywords: ['AI', 'astrology', 'birth chart', 'natal chart', 'personalized AI', 'AI companion'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${outfit.variable} ${cinzel.variable} ${crimsonPro.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        <ConditionalNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
