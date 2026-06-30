import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allContent, formatDate, getContentBySlug, relatedArticles } from '../../lib/data';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allContent.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getContentBySlug(slug);
  if (!item) return {};

  return {
    title: item.title,
    description: item.excerpt
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const item = getContentBySlug(slug);
  if (!item) notFound();

  const image = item.photos[0] ?? item.images[0] ?? null;
  const related = relatedArticles(item);

  return (
    <main className="page-shell">
      <article className="content-layout">
        <header className="article-header">
          <p className="eyebrow">{item.type === 'photo_gallery' ? 'Gallery' : item.type === 'article' ? 'News' : 'Page'}</p>
          <h1>{item.title}</h1>
          <time>{formatDate(item.createdISO)}</time>
        </header>

        {image ? <img className="lead-image" src={image.url} alt={image.alt || item.title} /> : null}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />

        {item.attachments.length > 0 ? (
          <section className="attachments">
            <h2>相关文件</h2>
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
            <h2>照片</h2>
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
          <h2>同年报道</h2>
          <div className="related-list">
            {related.map((article) => (
              <Link href={`/${article.slug}`} key={article.nid}>
                <time>{formatDate(article.createdISO)}</time>
                <span>{article.title}</span>
              </Link>
            ))}
          </div>
        </aside>
      ) : null}
    </main>
  );
}
