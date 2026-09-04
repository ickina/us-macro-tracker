'use client';

import { X, Calendar as CalIcon, Clock, AlertTriangle, Flame, Users, Building2, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { generateUpcomingEvents, EconomicEvent } from '@/lib/schedule';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ScheduleFilter = 'upcoming' | 'all' | 'policy' | 'inflation' | 'employment';

export function ScheduleModal({ isOpen, onClose }: Props) {
  const [filter, setFilter] = useState<ScheduleFilter>('upcoming');
  const [events, setEvents] = useState<EconomicEvent[]>([]);

  useEffect(() => {
    if (isOpen) {
      const allEvents = generateUpcomingEvents(new Date());
      setEvents(allEvents);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  // カウントダウン計算関数
  const getCountdownLabel = (eventDateStr: string) => {
    const today = new Date(todayStr);
    const eventDate = new Date(eventDateStr);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: '本日発表！', color: 'bg-red-500 text-white font-bold animate-pulse' };
    if (diffDays === 1) return { text: '明日発表', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
    if (diffDays > 1 && diffDays <= 7) return { text: `あと ${diffDays} 日`, color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' };
    if (diffDays > 7) return { text: `あと ${diffDays} 日`, color: 'bg-gray-800 text-gray-400' };
    return { text: '発表済み', color: 'bg-gray-800/40 text-gray-600' };
  };

  // フィルタリング処理
  const filteredEvents = useMemo(() => {
    const today = new Date(todayStr);

    return events.filter(e => {
      const eventDate = new Date(e.date);
      const isPast = eventDate < today;

      if (filter === 'upcoming') {
        // 今日から14日以内の未来イベント
        const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 21;
      }
      if (filter === 'policy') return e.category === 'policy';
      if (filter === 'inflation') return e.category === 'inflation';
      if (filter === 'employment') return e.category === 'employment';
      return true; // 'all'
    });
  }, [events, filter, todayStr]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors z-10 cursor-pointer"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* ヘッダー */}
        <div className="pr-10 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400">
              <CalIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-100">米国重要指標スケジュール</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                米マクロ経済指標・FOMC金利発表の最新日程 ＆ 日本時間
              </p>
            </div>
          </div>
        </div>

        {/* フィルタータブ */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ 直近の重要予定</span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <span>📅 すべての予定</span>
          </button>

          <button
            onClick={() => setFilter('policy')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === 'policy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>FOMC・金融政策</span>
          </button>

          <button
            onClick={() => setFilter('inflation')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === 'inflation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>物価・CPI</span>
          </button>

          <button
            onClick={() => setFilter('employment')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === 'employment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>雇用統計</span>
          </button>
        </div>
        
        {/* イベントリスト（スクロール領域） */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              該当するスケジュールはありません。
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const countdown = getCountdownLabel(ev.date);
              const isCritical = ev.impact === 'Critical';

              return (
                <div 
                  key={ev.id} 
                  className={`bg-gray-950/70 border rounded-xl p-3.5 sm:p-4 transition-all hover:border-gray-700 ${
                    countdown.text === '本日発表！'
                      ? 'border-red-500/50 bg-red-950/20'
                      : isCritical
                      ? 'border-gray-800 shadow-sm'
                      : 'border-gray-800/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${countdown.color}`}>
                        {countdown.text}
                      </span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-800/60 px-2 py-0.5 rounded">
                        {ev.period}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCritical ? (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
                          ★★★ 最重要
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          ★★ 重要
                        </span>
                      )}
                    </div>
                  </div>

                  {/* タイトル */}
                  <h4 className="text-base sm:text-lg font-bold text-gray-100 leading-snug">
                    {ev.title}
                  </h4>

                  {/* 説明 */}
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                    {ev.description}
                  </p>

                  {/* 日時 ＆ 日本時間 */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-gray-800/60 text-xs text-gray-300">
                    <span className="flex items-center gap-1.5 font-semibold text-blue-400">
                      <CalIcon className="w-3.5 h-3.5" />
                      {ev.date}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      日本時間 {ev.timeJST}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* フッター注意書き */}
        <div className="mt-3 pt-2 border-t border-gray-800 text-[11px] text-gray-500 text-center">
          ※ 発表日・時刻は日本時間(JST)基準です。米当局の都合等により一部前後する場合があります。
        </div>
      </div>
    </div>
  );
}
