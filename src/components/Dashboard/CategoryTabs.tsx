'use client';

import React from 'react';
import { 
  LayoutGrid, 
  TrendingUp, 
  Flame, 
  Users, 
  BarChart3, 
  Activity,
  Star,
  Eye
} from 'lucide-react';

export type CategoryKey = 'today' | 'all' | 'favorites' | 'rates_fx' | 'inflation' | 'employment' | 'markets' | 'growth_liquidity';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'all', label: 'すべて', icon: LayoutGrid },
  { key: 'today', label: '直近の注目', icon: Eye },
  { key: 'favorites', label: 'お気に入り', icon: Star },
  { key: 'rates_fx', label: '為替・金利', icon: TrendingUp },
  { key: 'inflation', label: 'インフレ', icon: Flame },
  { key: 'employment', label: '雇用', icon: Users },
  { key: 'markets', label: '株・暗号資産・商品', icon: BarChart3 },
  { key: 'growth_liquidity', label: '景気・流動性', icon: Activity },
];

interface Props {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
  counts: Record<CategoryKey, number>;
  todayHasUpdate?: boolean;
}

export function CategoryTabs({ selectedCategory, onSelectCategory, counts, todayHasUpdate = false }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none">
      <div className="flex min-w-max items-center gap-1.5 px-2 sm:gap-2 md:px-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          const isToday = cat.key === 'today';
          const count = counts[cat.key] || 0;

          return (
            <button
              key={cat.key}
              type="button"
              data-category-key={cat.key}
              aria-pressed={isActive}
              aria-label={isToday && todayHasUpdate ? `${cat.label}、新しい読み解きがあります` : undefined}
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer sm:px-3.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(var(--accent-shadow-rgb),0.4)] border border-blue-500 scale-[1.02]'
                  : 'bg-surface/90 text-muted hover:text-ink hover:bg-raised border border-divider/80'
              }`}
            >
              <span className="relative grid h-4 w-4 shrink-0 place-items-center">
                {isToday && !isActive && <span aria-hidden="true" className={`attention-glow ${todayHasUpdate ? 'attention-glow-new' : ''}`} />}
                <Icon className={`relative h-4 w-4 ${isActive ? 'text-white' : isToday ? 'text-accent' : 'text-muted'}`} />
              </span>
              <span>{cat.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isToday && todayHasUpdate
                      ? 'attention-update-badge bg-blue-600 text-white font-semibold'
                      : 'bg-raised text-muted'
                }`}
              >
                {isToday && todayHasUpdate ? '更新' : count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
