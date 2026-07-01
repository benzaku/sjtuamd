import Link from 'next/link';
import { bestImage, formatDate, getSite } from '../../lib/data';
import { localizeHref, messages, type Locale } from '../../lib/i18n';

export function NewsView({ locale }: { locale: Locale }) {
  const t = messages(locale);
  const site = getSite(locale);
  const years = Array.from(new Set(site.articles.map((article) => article.year))).sort((a, b) => b - a);

  return (
    <main className="page-shell">
      <header className="page-hero compact">
        <p className="eyebrow">{t.news.eyebrow}</p>
        <h1>{t.news.title}</h1>
        <p>{t.news.intro}</p>
      </header>

      {years.map((year) => (
        <section className="archive-year" key={year}>
          <h2>{year}</h2>
          <div className="article-list">
            {site.articles
              .filter((article) => article.year === year)
              .map((article) => {
                const image = bestImage(article);
                return (
                  <Link className="article-row" href={localizeHref(`/${article.slug}`, locale)} key={article.nid}>
                    {image ? <img src={image.url} alt={image.alt || article.title} /> : <span className="date-tile">{year}</span>}
                    <div>
                      <time>{formatDate(locale, article.createdISO)}</time>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </main>
  );
}
