'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Header } from '@/components/Layout/Header';
import { TodayHighlights } from '@/components/Dashboard/TodayHighlights';
import { MacroNewsItem } from '../api/news/route';
import { enrichNewsWithLatestInsights } from '@/lib/clientNews';
import macroData from '@/data/macroData.json';
import { 
  Calendar, 
  ExternalLink, 
  Flame, 
  Users, 
  Building2, 
  TrendingUp, 
  Activity, 
  LayoutGrid,
  Search,
  X,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

type NewsCategory = 'all' | 'inflation' | 'employment' | 'policy' | 'market' | 'growth';

const CATEGORIES: { key: NewsCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'すべて', icon: LayoutGrid },
  { key: 'policy', label: '金融政策・FRB', icon: Building2 },
  { key: 'inflation', label: 'インフレ・物価', icon: Flame },
  { key: 'employment', label: '雇用・労働', icon: Users },
  { key: 'market', label: '金利・市場動向', icon: TrendingUp },
  { key: 'growth', label: '景気・消費', icon: Activity },
];

export default function MacroNewsPage() {
  const [news, setNews] = useState<MacroNewsItem[]>(() => {
    return enrichNewsWithLatestInsights((macroData as any).news || []);
  });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    searchButtonRef.current?.focus();
  };

  const fetchNews = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        const enriched = enrichNewsWithLatestInsights(json.data);
        setNews(enriched);
        if (isManual) {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 2000);
        }
      } else {
        setError('ニュースデータの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラー：データの取得に失敗しました');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // フィルタリング処理
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [news, selectedCategory, searchQuery]);

  return (
    <div className="h-dvh min-h-0 flex flex-col overflow-hidden bg-canvas">
      <Header />
      
      <main className="min-h-0 flex-1 w-full overflow-y-auto py-4 md:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-3 md:px-6">
        
        {/* タイトル ＆ アクション */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tighter">
              米国マクロ経済ニュース ＆ リリース情報
            </h2>
          </div>

          <button
            onClick={() => fetchNews(true)}
            disabled={loading || isRefreshing}
            className={`self-start sm:self-center flex items-center gap-2 px-3.5 py-2 border rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
              justUpdated
                ? 'bg-green-600/20 border-green-500/40 text-positive'
                : 'bg-surface hover:bg-raised border-divider text-body hover:text-ink'
            }`}
            aria-label="ニュースを再取得"
          >
            <RefreshCw className={`w-4 h-4 ${justUpdated ? 'text-positive' : 'text-accent'} ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '更新中...' : justUpdated ? '✅ 最新に更新完了' : '最新ニュースを取得'}</span>
          </button>
        </div>

        </div>

        <TodayHighlights />

        <div className="mx-auto w-full max-w-[1200px] px-3 md:px-6">

        {/* 検索バー ＆ カテゴリタブ */}
        <div className="space-y-3 mb-6">
          {/* 検索ボタンは固定し、カテゴリだけ横にスクロール */}
          <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500 scale-[1.02]'
                        : 'bg-surface text-muted hover:text-ink hover:bg-raised border border-divider'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button ref={searchButtonRef} type="button"
            onClick={() => isSearchOpen ? closeSearch() : setIsSearchOpen(true)}
            aria-label={isSearchOpen ? 'ニュース検索を閉じる' : 'ニュース検索を開く'}
            aria-expanded={isSearchOpen} aria-controls="news-search-panel"
            title={isSearchOpen ? '検索を閉じて全件に戻す' : 'ニュースを検索'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-divider bg-surface text-accent hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            {isSearchOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Search aria-hidden="true" className="h-4 w-4" />}
          </button>
          </div>
          {isSearchOpen && (
            <div id="news-search-panel" className="relative max-w-md">
              <label htmlFor="news-search-input" className="sr-only">ニュースのキーワード検索</label>
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input ref={searchInputRef} id="news-search-input" type="search"
                placeholder="ニュースを検索（CPI・FRB・金利など）"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closeSearch(); } }}
                className="min-h-11 w-full rounded-xl border border-divider bg-surface py-2 pl-10 pr-4 text-sm text-ink placeholder-muted focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm">最新マクロ経済ニュースを読み込み中...</p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-negative flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ニュース一覧 */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="text-center py-16 bg-surface/50 border border-divider rounded-2xl">
                <p className="text-muted">該当するニュースが見つかりませんでした。</p>
              </div>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-divider hover:border-strong rounded-2xl p-4 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-accent font-semibold bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      <span className="text-xs text-muted bg-raised px-2 py-0.5 rounded-md font-medium">
                        {item.source}
                      </span>
                      {item.badge && (
                        <span className="text-xs text-purple-ink bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {item.impact === 'High' && (
                      <span className="text-xs font-bold text-negative bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-md">
                        重要指標
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-ink leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-body text-sm leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  {/* 要点・市場への影響（箇条書きボックス） */}
                  {item.points && item.points.length > 0 && (
                    <div className="bg-canvas/70 border border-divider/80 rounded-xl p-3 sm:p-4 mb-4">
                      <div className="text-xs font-semibold text-accent mb-2 flex items-center gap-1.5">
                        <span>📌 要点と市場への影響</span>
                      </div>
                      <ul className="space-y-1.5">
                        {item.points.map((pt, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-body flex items-start gap-2 leading-relaxed">
                            <span className="text-accent font-bold select-none">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.link && (
                    <div className="flex items-center justify-between pt-3 border-t border-divider/60">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-raised hover:bg-raised-hover text-body hover:text-ink rounded-lg text-xs font-medium transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                      >
                        <span>📊 公式元データ・記事を開く</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </main>
      <div aria-hidden="true" className="schedule-space shrink-0 border-t border-divider bg-canvas" />
    </div>
  );
}
