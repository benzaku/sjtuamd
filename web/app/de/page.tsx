import type { Metadata } from 'next';
import { HomeView } from '../_views/home-view';
import { messages } from '../../lib/i18n';

export const metadata: Metadata = {
  title: messages('de').meta.defaultTitle,
  description: messages('de').meta.description
};

export default function HomePageDe() {
  return <HomeView locale="de" />;
}
