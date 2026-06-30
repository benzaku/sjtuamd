import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { site } from '../lib/data';
import { SiteNavigation } from './components/site-navigation';

export const metadata: Metadata = {
  title: {
    default: '上海交通大学德国校友会',
    template: '%s | 上海交通大学德国校友会'
  },
  description: '上海交通大学德国校友会官网，汇集校友活动、新闻、文档和相册。'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

const currentLabels = [...site.pages, ...site.articles, ...site.galleries].flatMap((item) => [
  { href: `/${item.slug}`, label: item.title },
  { href: `/node/${item.nid}`, label: item.title }
]);

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <header className="site-header">
          <div className="main-header">
            <Link className="brand" href="/" aria-label="上海交通大学德国校友会首页">
              <img src="/brand/sjtu-logo.png" alt="上海交通大学" />
              <span>
                <strong>德国校友会</strong>
                <small>SJTUAMD</small>
              </span>
            </Link>
            <SiteNavigation nav={site.nav} currentLabels={currentLabels} />
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <strong>上海交通大学德国校友会</strong>
            <span>Shanghai Jiao Tong University Alumni Association in Germany</span>
          </div>
          <div className="footer-links">
            <Link href="/Links">链接</Link>
            <Link href="/Partner">合作伙伴</Link>
            <Link href="/ContactUs">联系</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
