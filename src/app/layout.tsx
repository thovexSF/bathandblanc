import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Ventas - Bath & Blanc',
  description: 'Dashboard de análisis de ventas para Bath & Blanc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
} 