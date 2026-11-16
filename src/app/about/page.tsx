import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Database,
  ExternalLink,
  Info,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { PageHeading } from '@/components/Layout/PageHeading';

export const metadata: Metadata = {
  title: 'データと利用について｜ichi Macro',
  description: 'ichi Macroのデータ提供元、更新、プライバシー、利用上の注意をご案内します。',
};

const externalLinkClass = 'inline-flex items-center gap-1 font-semibold text-accent underline decoration-blue-500/30 underline-offset-4 hover:decoration-current';

export default function AboutPage() {
  return (
    <div className="mobile-browser-scroll-shell flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas">
      <Header />
      <main className="mobile-browser-scroll-main min-h-0 flex-1 overflow-y-auto pb-4 md:pb-8">
        <PageHeading title="アプリ情報" icon={Info}>
          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-divider bg-surface px-3 text-sm font-semibold text-body shadow-sm hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />戻る
          </Link>
        </PageHeading>

        <div className="mx-auto w-full max-w-4xl space-y-4 px-3 sm:px-6">
          <section className="rounded-2xl border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold tracking-wide text-accent">ABOUT ICHI MACRO</p>
            <h3 className="mt-1 text-xl font-bold text-ink sm:text-2xl">数字を、日々の景気の流れとして見るために</h3>
            <p className="mt-3 text-sm leading-7 text-body">
              ichi Macroは、米国の経済指標・マーケット・ニュースを一つの画面で見やすくする個人運営の情報アプリです。専門的な数字を短時間で確認できるよう整理しています。
            </p>
          </section>

          <section aria-labelledby="source-heading" className="rounded-2xl border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Database aria-hidden="true" className="h-5 w-5 text-accent" />
              <h3 id="source-heading" className="text-lg font-bold text-ink">データの提供元</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-divider bg-canvas p-4">
                <Database aria-hidden="true" className="h-5 w-5 text-accent" />
                <h4 className="mt-2 font-bold text-ink">経済指標</h4>
                <p className="mt-1 text-sm leading-6 text-muted">FREDに収録された米政府機関・各提供元の系列を使用します。更新日は指標ごとに異なり、改定される場合があります。</p>
              </div>
              <div className="rounded-xl border border-divider bg-canvas p-4">
                <ChartNoAxesCombined aria-hidden="true" className="h-5 w-5 text-accent" />
                <h4 className="mt-2 font-bold text-ink">マーケット</h4>
                <p className="mt-1 text-sm leading-6 text-muted">TradingView公式ウィジェットを使用します。価格・市場状態・遅延は銘柄と提供元の仕様に従います。</p>
              </div>
              <div className="rounded-xl border border-divider bg-canvas p-4">
                <Newspaper aria-hidden="true" className="h-5 w-5 text-accent" />
                <h4 className="mt-2 font-bold text-ink">ニュース</h4>
                <p className="mt-1 text-sm leading-6 text-muted">Federal Reserve BoardとCNBCの公開情報をもとに整理し、元記事へのリンクを表示します。</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm leading-6 text-body">
              <p>
                <a className={externalLinkClass} href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">FRED<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>
                <span className="text-muted"> ／ </span>
                <a className={externalLinkClass} href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>
                <span className="text-muted"> ／ </span>
                <a className={externalLinkClass} href="https://www.federalreserve.gov/" target="_blank" rel="noopener noreferrer">Federal Reserve Board<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>
              </p>
              <p>
                為替の補完値には
                <a className={`${externalLinkClass} ml-1`} href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>
                を使用します。無料エンドポイントは原則1日1回更新です。
              </p>
              <p className="rounded-xl border border-divider bg-raised px-3 py-2 text-xs text-muted">
                This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.
              </p>
            </div>
          </section>

          <section aria-labelledby="notice-heading" className="rounded-2xl border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-accent" />
              <h3 id="notice-heading" className="text-lg font-bold text-ink">利用上の大切なお知らせ</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-body">
              <li className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span><span>このアプリは情報提供を目的とし、投資助言・売買の推奨ではありません。</span></li>
              <li className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span><span>データの正確性、完全性、即時性を保証しません。重要な判断では必ず公式発表をご確認ください。</span></li>
              <li className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span><span>「データ日」は観測期間の基準日です。発表日・取得時刻と一致しない場合があります。</span></li>
              <li className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span><span>読み解き文章は保存された数値と定型ルールから作成し、将来の相場を予測するものではありません。</span></li>
            </ul>
          </section>

          <section aria-labelledby="privacy-heading" className="rounded-2xl border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <h3 id="privacy-heading" className="text-lg font-bold text-ink">プライバシーと端末内の保存</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-body">
              <p>現在、氏名・メールアドレスを入力するアカウント機能はありません。</p>
              <p>お気に入り、表示テーマ、テーマカラー、案内の確認状態は、ご利用のブラウザーまたはアプリ内に保存します。別の端末へ自動送信・同期はしません。</p>
              <p>データ表示のため、Vercel、FRED、TradingView、ExchangeRate-APIなどの外部サービスへ通信します。外部サイトを開いた後は、各サービスの利用条件とプライバシーポリシーが適用されます。</p>
            </div>
          </section>

          <section aria-labelledby="terms-heading" className="rounded-2xl border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <h3 id="terms-heading" className="text-lg font-bold text-ink">利用条件</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-body">
              <p>本サービスは予告なく内容の変更、提供の一時停止または終了を行う場合があります。提供元の仕様変更により、表示内容や更新頻度が変わることがあります。</p>
              <p>各データ・記事・ロゴ等の権利は、それぞれの提供元に帰属します。アプリ内の表示を転載・再配布する場合は、各提供元の条件をご確認ください。</p>
              <p>不具合や表示内容については、<a className={externalLinkClass} href="https://github.com/ickina/us-macro-tracker/issues" target="_blank" rel="noopener noreferrer">GitHubの連絡窓口<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a>からお知らせください。</p>
            </div>
          </section>

          <p className="px-1 pb-2 text-center text-xs text-muted">制定日：2026年11月16日</p>
        </div>
      </main>
      <div aria-hidden="true" className="schedule-space shrink-0 border-t border-divider bg-canvas" />
    </div>
  );
}
