import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Divulgacam',
  description: 'Central de conteúdos de campanha — Tayrone Films',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-brand-light font-sans">{children}</body>
    </html>
  );
}
