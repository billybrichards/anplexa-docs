// Root layout for Next.js app
import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';

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
        <style jsx global>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            background: #f5f5f5;
          }
          main {
            min-height: calc(100vh - 80px);
          }
        `}</style>
      </body>
    </html>
  );
}
