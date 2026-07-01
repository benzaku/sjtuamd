import type { Metadata } from 'next';
import { NewsView } from '../../_views/news-view';
import { messages } from '../../../lib/i18n';

export const metadata: Metadata = { title: messages('de').news.title };

export default function NewsPageDe() {
  return <NewsView locale="de" />;
}
