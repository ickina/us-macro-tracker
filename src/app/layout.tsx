import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';

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
        <script dangerouslySetInnerHTML={{ __html: `try { const root = document.documentElement; root.dataset.theme = localStorage.getItem('macro-theme') === 'dark' ? 'dark' : 'light'; const saved = localStorage.getItem('macro-accent'); root.dataset.accent = ['blue','pink','green','purple','orange'].includes(saved || '') ? saved : 'blue'; } catch { document.documentElement.dataset.theme = 'light'; document.documentElement.dataset.accent = 'blue'; }` }} />
      </head>
      <body className="antialiased bg-canvas text-ink selection:bg-blue-500/30 font-sans">
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
