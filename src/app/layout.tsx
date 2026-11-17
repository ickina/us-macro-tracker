import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';
import { AppBootSplash } from '@/components/Layout/AppBootSplash';

const bootSplashStyles = `
  #app-boot-splash{--boot-accent:#2563eb;position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f1f5f9;color:#15243b;opacity:1;visibility:visible;transition:opacity .32s ease,visibility .32s ease;font-family:"Helvetica Neue",Arial,"Hiragino Sans",Meiryo,sans-serif}
  html[data-theme="dark"] #app-boot-splash{background:#030712;color:#f3f4f6}
  html[data-accent="pink"] #app-boot-splash{--boot-accent:#ec4899}html[data-accent="green"] #app-boot-splash{--boot-accent:#10b981}html[data-accent="purple"] #app-boot-splash{--boot-accent:#a855f7}html[data-accent="orange"] #app-boot-splash{--boot-accent:#f97316}
  #app-boot-splash.app-boot-splash-leaving{opacity:0;visibility:hidden;pointer-events:none}
  .app-boot-mark{position:relative;width:76px;height:76px;display:grid;place-items:center;margin-bottom:17px}
  .app-boot-halo{position:absolute;inset:4px;border-radius:22px;background:color-mix(in srgb,var(--boot-accent) 12%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--boot-accent) 18%,transparent),0 14px 34px color-mix(in srgb,var(--boot-accent) 18%,transparent);animation:boot-breathe 1.8s ease-in-out infinite}
  .app-boot-icon{position:relative;width:64px;height:64px;border-radius:19px;background:color-mix(in srgb,var(--boot-accent) 9%,white);color:var(--boot-accent);filter:drop-shadow(0 8px 20px color-mix(in srgb,var(--boot-accent) 18%,transparent))}
  html[data-theme="dark"] .app-boot-icon{background:color-mix(in srgb,var(--boot-accent) 16%,#111827)}
  .app-boot-wave{fill:none;stroke:currentColor;stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:92;stroke-dashoffset:92;animation:boot-draw .42s cubic-bezier(.4,0,.2,1) .02s forwards}
  .app-boot-title{margin:0;font-size:25px;line-height:1.2;font-weight:750;letter-spacing:-.025em}
  .app-boot-copy{display:flex;align-items:center;min-height:20px;margin:9px 0 0;color:#526176;font-size:13px;font-weight:500;letter-spacing:.02em}
  html[data-theme="dark"] .app-boot-copy{color:#9ca3af}
  .app-boot-dots{display:inline-flex;align-items:center;gap:3px;width:23px;margin-left:5px}
  .app-boot-dots i{width:3px;height:3px;border-radius:999px;background:var(--boot-accent);animation:boot-dot 1.25s ease-in-out infinite}.app-boot-dots i:nth-child(2){animation-delay:.14s}.app-boot-dots i:nth-child(3){animation-delay:.28s}
  @keyframes boot-draw{0%{stroke-dashoffset:92;opacity:.35}70%,100%{stroke-dashoffset:0;opacity:1}}
  @keyframes boot-breathe{0%,100%{transform:scale(.94);opacity:.58}50%{transform:scale(1.06);opacity:1}}
  @keyframes boot-dot{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-3px);opacity:1}}
  @media(prefers-reduced-motion:reduce){.app-boot-halo,.app-boot-wave,.app-boot-dots i{animation:none}.app-boot-wave{stroke-dashoffset:0}}
`;

export const viewport: Viewport = {
  themeColor: '#f1f5f9',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://us-macro-tracker.vercel.app'),
  title: 'ichi Macro｜米国経済・マーケット・ニュース',
  description: '米国経済・マーケット・ニュースを、ひとつの画面で。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ichi Macro',
    title: 'ichi Macro｜米国経済・マーケット・ニュース',
    description: '米国経済・マーケット・ニュースを、ひとつの画面で。',
    images: [{
      url: '/share/ichi-macro-v1.png',
      width: 1200,
      height: 630,
      alt: 'ichi Macro：米国経済・マーケット・ニュース',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ichi Macro｜米国経済・マーケット・ニュース',
    description: '米国経済・マーケット・ニュースを、ひとつの画面で。',
    images: ['/share/ichi-macro-v1.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ichi Macro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="light" data-accent="blue" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: bootSplashStyles }} />
        <script dangerouslySetInnerHTML={{ __html: `try { const root = document.documentElement; root.dataset.theme = localStorage.getItem('macro-theme') === 'dark' ? 'dark' : 'light'; const saved = localStorage.getItem('macro-accent'); root.dataset.accent = ['blue','pink','green','purple','orange'].includes(saved || '') ? saved : 'blue'; } catch { document.documentElement.dataset.theme = 'light'; document.documentElement.dataset.accent = 'blue'; }` }} />
      </head>
      <body className="antialiased bg-canvas text-ink selection:bg-blue-500/30 font-sans">
        <AppBootSplash />
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
