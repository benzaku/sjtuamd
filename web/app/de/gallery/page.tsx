import type { Metadata } from 'next';
import { GalleryView } from '../../_views/gallery-view';
import { messages } from '../../../lib/i18n';

export const metadata: Metadata = { title: messages('de').gallery.title };

export default function GalleryPageDe() {
  return <GalleryView locale="de" />;
}
