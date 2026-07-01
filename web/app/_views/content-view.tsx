import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate, getContentBySlug, relatedArticles } from '../../lib/data';
import { localizeHref, messages, type Locale } from '../../lib/i18n';

export function ContentView({ locale, slug }: { locale: Locale; slug: string }) {
  const t = messages(locale);
  const item = getContentBySlug(locale, slug);
  if (!item) notFound();

  const image = item.photos[0] ?? item.images[0] ?? null;
  const related = relatedArticles(locale, item);
  const label =
    item.type === 'photo_gallery'
      ? t.content.labelGallery
      : item.type === 'article'
        ? t.content.labelArticle
        : t.content.labelPage;

  return (
    <main className="page-shell">
      <article className="content-layout">
        <header className="article-header">
          <p className="eyebrow">{label}</p>
          <h1>{item.title}</h1>
          <time>{formatDate(locale, item.createdISO)}</time>
        </header>

        {image ? <img className="lead-image" src={image.url} alt={image.alt || item.title} /> : null}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />

        {item.attachments.length > 0 ? (
          <section className="attachments">
            <h2>{t.content.attachments}</h2>
            <div className="file-list">
              {item.attachments.map((file) => (
                <a href={file.url} key={file.fid}>
                  <span>{file.filename}</span>
                  <small>{file.mime}</small>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {item.photos.length > 0 ? (
          <section className="photo-grid-section">
            <h2>{t.content.photos}</h2>
            <div className="photo-grid">
              {item.photos.map((photo) => (
                <a href={photo.url} key={photo.fid}>
                  <img src={photo.url} alt={photo.alt || item.title} loading="lazy" />
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      {related.length > 0 ? (
        <aside className="related">
          <h2>{t.content.related}</h2>
          <div className="related-list">
            {related.map((article) => (
              <Link href={localizeHref(`/${article.slug}`, locale)} key={article.nid}>
                <time>{formatDate(locale, article.createdISO)}</time>
                <span>{article.title}</span>
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}
