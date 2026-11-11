import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CalendarFAB } from '@/components/Dashboard/CalendarFAB';

export const viewport: Viewport = {
  themeColor: '#f1f5f9',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://us-macro-tracker.vercel.app'),
  title: 'ichiの米国経済指標',
  description: '米国の経済指標・ニュース・重要スケジュールを、ひとつの画面で。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ichiの米国経済指標',
    title: 'ichiの米国経済指標',
    description: '米国の経済指標・ニュース・重要スケジュールを、ひとつの画面で。',
    images: [{
      url: '/share/ichi-us-economy-v2.png',
      width: 1200,
      height: 630,
      alt: 'ichiの米国経済指標：経済指標・マクロニュース・スケジュールをひとつに',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ichiの米国経済指標',
    description: '米国の経済指標・ニュース・重要スケジュールを、ひとつの画面で。',
    images: ['/share/ichi-us-economy-v2.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ichiの米国経済指標',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { document.documentElement.dataset.theme = localStorage.getItem('macro-theme') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.theme = 'light'; }` }} />
      </head>
      <body className="antialiased bg-canvas text-ink selection:bg-blue-500/30 font-sans">
        {children}
        <CalendarFAB />
      </body>
    </html>
  );
}
