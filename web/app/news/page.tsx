import Link from 'next/link';
import { bestImage, formatDate, site } from '../../lib/data';

export const metadata = {
  title: '活动新闻'
};

export default function NewsPage() {
  const years = Array.from(new Set(site.articles.map((article) => article.year))).sort((a, b) => b - a);

  return (
    <main className="page-shell">
      <header className="page-hero compact">
        <p className="eyebrow">News</p>
        <h1>活动新闻</h1>
        <p>校友会活动、母校新闻、交流通知和历史报道。</p>
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
                  <Link className="article-row" href={`/${article.slug}`} key={article.nid}>
                    {image ? <img src={image.url} alt={image.alt || article.title} /> : <span className="date-tile">{year}</span>}
                    <div>
                      <time>{formatDate(article.createdISO)}</time>
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
