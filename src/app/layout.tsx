import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'イチの米経済指標ダッシュボード',
  description: 'FRED APIを通じて米国のマクロ経済指標を可視化します',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased bg-[#030712] text-[#f3f4f6] selection:bg-blue-500/30 font-sans">
        {children}
      </body>
    </html>
  );
}
