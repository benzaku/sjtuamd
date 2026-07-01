import type { Metadata } from 'next';
import { ContentView } from '../../_views/content-view';
import { allContent, getContentBySlug } from '../../../lib/data';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allContent('de').map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getContentBySlug('de', slug);
  if (!item) return {};
  return { title: item.title, description: item.excerpt };
}

export default async function ContentPageDe({ params }: PageProps) {
  const { slug } = await params;
  return <ContentView locale="de" slug={slug} />;
}
