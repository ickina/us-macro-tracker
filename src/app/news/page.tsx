'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Layout/Header';
import { MacroNewsItem } from '../api/news/route';
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
  const [news, setNews] = useState<MacroNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNews = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/news');
      const json = await res.json();
      if (json.success) {
        setNews(json.data);
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
    <div className="min-h-screen flex flex-col bg-[#030712]">
      <Header />
      
      <main className="flex-1 max-w-[1200px] w-full mx-auto py-4 md:py-8 px-3 md:px-6">
        
        {/* タイトル ＆ アクション */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tighter">
              米国マクロ経済ニュース ＆ リリース情報
            </h2>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              FRED公式リリース・FRB発表・主要経済指標の最新ファンダメンタルズ動向
            </p>
          </div>

          <button
            onClick={() => fetchNews(true)}
            disabled={loading || isRefreshing}
            className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            aria-label="ニュースを再取得"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '更新中...' : '最新ニュースを取得'}</span>
          </button>
        </div>

        {/* 検索バー ＆ カテゴリタブ */}
        <div className="space-y-3 mb-6">
          {/* 検索入力 */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="キーワードでニュースを検索 (例: CPI, FRB, 金利...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* カテゴリタブ */}
          <div className="w-full overflow-x-auto pb-1 scrollbar-none">
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
                        : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">最新マクロ経済ニュースを読み込み中...</p>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ニュース一覧 */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl">
                <p className="text-gray-400">該当するニュースが見つかりませんでした。</p>
              </div>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md font-medium">
                        {item.source}
                      </span>
                    </div>

                    {item.impact === 'High' && (
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-md">
                        重要指標
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-100 leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {item.summary}
                  </p>

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline"
                    >
                      <span>公式発表・詳細データを確認</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
