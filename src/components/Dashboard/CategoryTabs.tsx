'use client';

import React from 'react';
import { 
  LayoutGrid, 
  TrendingUp, 
  Flame, 
  Users, 
  BarChart3, 
  Activity 
} from 'lucide-react';

export type CategoryKey = 'all' | 'rates_fx' | 'inflation' | 'employment' | 'markets' | 'growth_liquidity';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'all', label: 'すべて', icon: LayoutGrid },
  { key: 'rates_fx', label: '為替・金利', icon: TrendingUp },
  { key: 'inflation', label: 'インフレ', icon: Flame },
  { key: 'employment', label: '雇用', icon: Users },
  { key: 'markets', label: '株式・商品', icon: BarChart3 },
  { key: 'growth_liquidity', label: '景気・流動性', icon: Activity },
];

interface Props {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
  counts: Record<CategoryKey, number>;
}

export function CategoryTabs({ selectedCategory, onSelectCategory, counts }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max px-2 md:px-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          const count = counts[cat.key] || 0;

          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500 scale-[1.02]'
                  : 'bg-gray-900/90 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{cat.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
