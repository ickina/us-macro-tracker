import { X } from 'lucide-react';
import { Observation } from '@/lib/fred';
import { LineChartComponent } from '../Charts/LineChart';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Observation[];
  color: string;
}

export function ChartModal({ isOpen, onClose, title, data, color }: Props) {
  // ESCキーで閉じる処理、背景スクロール防止
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
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full transition-colors z-10"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="pr-10 mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-100 leading-snug">{title}</h3>
          <p className="text-gray-400 mt-1 text-sm">詳細トレンドチャート（過去10年分）</p>
        </div>
        
        <div className="h-[40vh] sm:h-[50vh] w-full -ml-4 mt-4">
          <LineChartComponent data={data} color={color} showXAxis={true} />
        </div>
      </div>
    </div>
  );
}
