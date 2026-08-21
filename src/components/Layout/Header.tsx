'use client';

import { Activity, LayoutDashboard, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* ロゴ・タイトル */}
        <Link href="/" className="flex items-center gap-2 min-w-0 group cursor-pointer">
          <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-xl flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent truncate tracking-tighter">
            イチの米経済指標
          </h1>
        </Link>

        {/* ページナビゲーション */}
        <nav className="flex items-center gap-1.5 sm:gap-2 bg-gray-900/90 p-1 rounded-xl border border-gray-800 flex-shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              pathname === '/'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ダッシュボード</span>
          </Link>

          <Link
            href="/news"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              pathname === '/news'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>マクロニュース</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
