import type { Metadata, Viewport } from 'next';
import './globals.css';
import { messages } from '../lib/i18n';
import { SiteChrome } from './components/site-chrome';

const zh = messages('zh');

export const metadata: Metadata = {
  title: {
    default: zh.meta.defaultTitle,
    template: zh.meta.template
  },
  description: zh.meta.description
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={zh.htmlLang} data-scroll-behavior="smooth">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
