'use client';

import { Activity, LayoutDashboard, Newspaper, ChartNoAxesCombined } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname().replace(/\/+$/, '') || '/';

  return (
    <header className="border-b border-divider bg-canvas/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* 画面幅に合わせて文字を大きくし、切替ボタンとの余白を保つ */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 min-w-0 group cursor-pointer">
            <div className="bg-blue-500/10 p-1 sm:p-1.5 md:p-2 rounded-xl flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-accent" />
            </div>
            <h1 className="text-[22px] min-[360px]:text-2xl sm:text-[28px] lg:text-[32px] xl:text-4xl font-bold bg-gradient-to-r from-ink to-muted bg-clip-text text-transparent min-w-0 truncate leading-tight tracking-tight min-[360px]:tracking-normal lg:tracking-[0.025em]">
              ichi Macro
            </h1>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {/* PC・タブレット用ナビゲーション */}
            <nav className="hidden lg:flex items-center gap-2 bg-surface/90 p-1 rounded-xl border border-divider flex-shrink-0">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-muted hover:text-ink hover:bg-raised'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>経済指標</span>
              </Link>

<Link href="/markets" aria-current={pathname === '/markets' ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium ${pathname === '/markets' ? 'bg-blue-600 text-white border-blue-600' : 'text-muted bg-surface/60 border-divider hover:text-ink'}`}>
                <ChartNoAxesCombined className="h-4 w-4 shrink-0" /><span>マーケット</span>
              </Link>

              <Link
                href="/news"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/news'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-muted hover:text-ink hover:bg-raised'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>マクロニュース</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* スマホ用サブナビゲーションバー（タイトルを邪魔せず押しやすい位置に配置） */}
        <div className="flex lg:hidden items-center justify-around pb-2.5 pt-0.5 gap-1 border-t border-divider/40">
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-1 min-h-10 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-blue-600/20 border border-blue-500/40 text-accent font-bold'
                : 'text-muted hover:text-ink bg-surface/60 border border-divider'
            }`}
          >
            <LayoutDashboard className="hidden h-3.5 w-3.5 min-[360px]:block" />
            <span>経済指標</span>
          </Link>

<Link href="/markets" aria-current={pathname === '/markets' ? 'page' : undefined}
                className={`flex-1 flex min-w-0 items-center justify-center gap-1 min-h-10 py-2 rounded-lg text-xs font-semibold border ${pathname === '/markets' ? 'bg-blue-600 text-white border-blue-600' : 'text-muted bg-surface/60 border-divider hover:text-ink'}`}>
                <ChartNoAxesCombined className="hidden h-3.5 w-3.5 shrink-0 min-[360px]:block" /><span>マーケット</span>
              </Link>

          <Link
            href="/news"
            className={`flex-1 flex items-center justify-center gap-1 min-h-10 py-2 rounded-lg text-xs font-semibold transition-all ${
              pathname === '/news'
                ? 'bg-blue-600/20 border border-blue-500/40 text-accent font-bold'
                : 'text-muted hover:text-ink bg-surface/60 border border-divider'
            }`}
          >
            <Newspaper className="hidden h-3.5 w-3.5 min-[360px]:block" />
            <span>マクロニュース</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
