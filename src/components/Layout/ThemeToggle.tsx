'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Moon, Palette, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
type Accent = 'blue' | 'pink' | 'green' | 'purple' | 'orange';

const colors: readonly { id: Accent; label: string; swatch: string }[] = [
  { id: 'blue', label: 'ブルー', swatch: '#2563eb' },
  { id: 'pink', label: 'ピンク', swatch: '#db2777' },
  { id: 'green', label: 'グリーン', swatch: '#047857' },
  { id: 'purple', label: 'パープル', swatch: '#7e22ce' },
  { id: 'orange', label: 'オレンジ', swatch: '#c2410c' },
] as const;

export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>('light');
  const [accent, setAccentState] = useState<Accent>('blue');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = document.documentElement;
      setThemeState(root.dataset.theme === 'dark' ? 'dark' : 'light');
      const current = root.dataset.accent;
      if (colors.some(color => color.id === current)) setAccentState(current as Accent);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  const setTheme = (next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    setThemeState(next);
    try { localStorage.setItem('macro-theme', next); } catch { /* The current view still changes. */ }
  };

  const setAccent = (next: Accent) => {
    document.documentElement.setAttribute('data-accent', next);
    setAccentState(next);
    try { localStorage.setItem('macro-accent', next); } catch { /* The current view still changes. */ }
  };

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" onClick={() => setOpen(value => !value)} aria-label="表示設定を開く" aria-haspopup="dialog" aria-expanded={open}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-divider bg-surface text-accent hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
        <Palette className="h-5 w-5" aria-hidden="true" />
        <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-blue-600" />
      </button>
      {open && <div role="dialog" aria-label="表示設定" className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(300px,calc(100vw-24px))] rounded-2xl border border-divider bg-surface p-4 text-body shadow-2xl">
        <p className="text-sm font-bold text-ink">表示設定</p>
        <p className="mt-3 text-xs font-medium text-muted">明るさ</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([['light', 'ライト', Sun], ['dark', 'ダーク', Moon]] as const).map(([id, label, Icon]) => <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${theme === id ? 'border-blue-600 bg-blue-500/10 text-accent' : 'border-divider bg-canvas text-muted hover:text-ink'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>)}
        </div>
        <p className="mt-4 text-xs font-medium text-muted">テーマカラー</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {colors.map(color => <button key={color.id} type="button" aria-label={color.label} aria-pressed={accent === color.id} title={color.label} onClick={() => setAccent(color.id)}
            className={`relative flex aspect-square min-h-10 items-center justify-center rounded-xl border bg-canvas ${accent === color.id ? 'border-strong ring-2 ring-accent ring-offset-2 ring-offset-surface' : 'border-divider hover:border-emphasis'}`}>
            <span aria-hidden="true" className="h-6 w-6 rounded-full" style={{ backgroundColor: color.swatch }} />
            {accent === color.id && <Check aria-hidden="true" className="absolute h-4 w-4 text-white drop-shadow" />}
          </button>)}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-muted">背景と選択中のボタンが、選んだ色に変わります。</p>
      </div>}
    </div>
  );
}
