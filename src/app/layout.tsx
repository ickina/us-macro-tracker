import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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

import { ThemeProvider } from '@/components/Layout/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
