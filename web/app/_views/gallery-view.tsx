import Link from 'next/link';
import { bestImage, getSite } from '../../lib/data';
import { localizeHref, messages, type Locale } from '../../lib/i18n';

export function GalleryView({ locale }: { locale: Locale }) {
  const t = messages(locale);
  const site = getSite(locale);

  return (
    <main className="page-shell">
      <header className="page-hero compact">
        <p className="eyebrow">{t.gallery.eyebrow}</p>
        <h1>{t.gallery.title}</h1>
        <p>{t.gallery.intro}</p>
      </header>
      <div className="gallery-grid full">
        {site.galleries.map((gallery) => {
          const image = bestImage(gallery);
          return (
            <Link className="gallery-card" href={localizeHref(`/${gallery.slug}`, locale)} key={gallery.nid}>
              {image ? <img src={image.url} alt={image.alt || gallery.title} loading="lazy" /> : null}
              <span>{gallery.title}</span>
              <small>{t.gallery.photoCount(gallery.photos.length)}</small>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
