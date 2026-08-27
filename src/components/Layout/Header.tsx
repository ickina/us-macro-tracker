'use client';

import { Activity, LayoutDashboard, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* ロゴ・フルタイトル（元の美しいレイアウトを完全保持） */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 group cursor-pointer">
            <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-xl flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent truncate tracking-tighter">
              イチの米経済指標ダッシュボード
            </h1>
          </Link>

          {/* PC・タブレット用ナビゲーション */}
          <nav className="hidden md:flex items-center gap-2 bg-gray-900/90 p-1 rounded-xl border border-gray-800 flex-shrink-0">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ダッシュボード</span>
            </Link>

            <Link
              href="/news"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/news'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>マクロニュース</span>
            </Link>
          </nav>
        </div>

        {/* スマホ用サブナビゲーションバー（タイトルを邪魔せず押しやすい位置に配置） */}
        <div className="flex md:hidden items-center justify-around pb-2.5 pt-0.5 gap-2 border-t border-gray-800/40">
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold'
                : 'text-gray-400 hover:text-gray-200 bg-gray-900/60 border border-gray-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>ダッシュボード</span>
          </Link>

          <Link
            href="/news"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/news'
                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold'
                : 'text-gray-400 hover:text-gray-200 bg-gray-900/60 border border-gray-800'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>マクロニュース</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
