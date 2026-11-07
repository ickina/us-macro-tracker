import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';

export const viewport: Viewport = {
  themeColor: '#f1f5f9',
};

export const metadata: Metadata = {
  title: 'ichiの米国経済指標',
  description: 'FRED APIを通じて米国のマクロ経済指標を可視化します',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ichiの米国経済指標',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { document.documentElement.dataset.theme = localStorage.getItem('macro-theme') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.theme = 'light'; }` }} />
      </head>
      <body className="antialiased bg-canvas text-ink selection:bg-blue-500/30 font-sans">
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
