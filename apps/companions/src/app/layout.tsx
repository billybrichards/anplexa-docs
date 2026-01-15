// Root layout for Next.js app
import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anplexa Companions',
  description: 'AI companion platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
