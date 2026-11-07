'use client';

import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = theme;
    try { localStorage.setItem('macro-theme', theme); } catch { /* Switching still works without storage. */ }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="ライト・ダークを切り替え"
      title="ライト・ダークを切り替え"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-divider bg-surface text-accent hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <Sun className="theme-sun h-5 w-5" aria-hidden="true" />
      <Moon className="theme-moon h-5 w-5" aria-hidden="true" />
    </button>
  );
}
