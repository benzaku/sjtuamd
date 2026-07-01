import { redirect } from 'next/navigation';
import { getContentByNid } from '../../../../lib/data';
import { localizeHref } from '../../../../lib/i18n';

type PageProps = {
  params: Promise<{ nid: string }>;
};

export default async function LegacyNodePageDe({ params }: PageProps) {
  const { nid } = await params;
  const item = getContentByNid('de', nid);
  redirect(item ? localizeHref(`/${item.slug}`, 'de') : '/de');
}
