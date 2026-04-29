import { X, Calendar as CalIcon, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// 実際にはFRED APIや専用の経済カレンダーAPIから取得しますが、
// ここでは無料枠での安定稼働を優先し、直近の重要イベントのモックデータを表示します。
const UPCOMING_RELEASES = [
  { id: '1', title: '米国雇用統計 (NFP)', date: '2026-05-08', impact: 'High' },
  { id: '2', title: '消費者物価指数 (CPI)', date: '2026-05-13', impact: 'High' },
  { id: '3', title: '実質GDP (改定値)', date: '2026-05-28', impact: 'Medium' },
  { id: '4', title: 'PCEデフレーター', date: '2026-05-29', impact: 'High' },
  { id: '5', title: 'FOMC 政策金利発表', date: '2026-06-17', impact: 'High' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleModal({ isOpen, onClose }: Props) {
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 mb-6 pr-8">
          <CalIcon className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-100">重要指標スケジュール</h3>
        </div>
        
        <div className="space-y-3">
          {UPCOMING_RELEASES.map((release) => (
            <div key={release.id} className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-200 font-medium">{release.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{release.date}</p>
              </div>
              {release.impact === 'High' && (
                <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">
                  <AlertCircle className="w-3 h-3" />
                  重要
                </div>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 mt-6 text-center">
          ※日程は米国東部時間(EST)ベースの予定日です。<br/>実際の発表日は変動する可能性があります。
        </p>
      </div>
    </div>
  );
}
