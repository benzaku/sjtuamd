import type { Metadata } from 'next';
import { NewsView } from '../_views/news-view';
import { messages } from '../../lib/i18n';

export const metadata: Metadata = { title: messages('zh').news.title };

export default function NewsPage() {
  return <NewsView locale="zh" />;
}
