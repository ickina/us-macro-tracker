import type { Metadata } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';

export const metadata: Metadata = {
  title: 'イチの米経済指標ダッシュボード',
  description: 'FRED APIを通じて米国のマクロ経済指標を可視化します',
  manifest: '/manifest.json',
  themeColor: '#030712',
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
    <html lang="ja">
      <body className="antialiased bg-[#030712] text-[#f3f4f6] selection:bg-blue-500/30 font-sans">
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
