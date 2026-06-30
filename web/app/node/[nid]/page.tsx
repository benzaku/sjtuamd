import { redirect } from 'next/navigation';
import { getContentByNid } from '../../../lib/data';

type PageProps = {
  params: Promise<{ nid: string }>;
};

export default async function LegacyNodePage({ params }: PageProps) {
  const { nid } = await params;
  const item = getContentByNid(nid);
  redirect(item ? `/${item.slug}` : '/');
}
