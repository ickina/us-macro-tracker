import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';

export const viewport: Viewport = {
  themeColor: '#030712',
};

export const metadata: Metadata = {
  title: 'イチの米経済指標ダッシュボード',
  description: 'FRED APIを通じて米国のマクロ経済指標を可視化します',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Macro Tracker',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { document.documentElement.dataset.theme = localStorage.getItem('macro-theme') === 'light' ? 'light' : 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }` }} />
      </head>
      <body className="antialiased bg-canvas text-ink selection:bg-blue-500/30 font-sans">
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
