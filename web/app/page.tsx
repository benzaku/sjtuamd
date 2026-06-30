import Link from 'next/link';
import { bestImage, featuredPages, formatDate, latestArticles, site } from '../lib/data';

export default function HomePage() {
  const featured = featuredPages();
  const articles = latestArticles(6);
  const galleries = site.galleries.slice(0, 3);
  const heroPhotos = site.galleries
    .flatMap((gallery) =>
      gallery.photos.slice(0, 4).map((photo) => ({
        ...photo,
        galleryTitle: gallery.title,
        gallerySlug: gallery.slug
      }))
    )
    .slice(0, 14);

  return (
    <main>
      <section className="hero">
        <img
          className="hero-bg"
          src="/brand/sjtudoorBG.jpg"
          alt=""
        />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">SJTU Alumni Germany</p>
            <h1>上海交通大学德国校友会</h1>
            <p>
              连接在德交大校友，记录校友活动与母校交流，延续“饮水思源，爱国荣校”的共同记忆。
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/news">
                浏览活动新闻
              </Link>
              <Link className="button" href="/Antrag">
                加入校友会
              </Link>
            </div>
            {heroPhotos.length > 0 ? (
              <div className="hero-album" aria-label="校友活动相册">
                <div className="hero-album-track">
                  {[...heroPhotos, ...heroPhotos].map((photo, index) => (
                    <Link className="hero-photo" href={`/${photo.gallerySlug}`} key={`${photo.fid}-${index}`}>
                      <img src={photo.url} alt={photo.alt || photo.galleryTitle} />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section intro-grid">
        {featured.map((item) => (
          <Link className="feature-card" href={`/${item.slug}`} key={item.slug}>
            <span>{item.title}</span>
            <p>{item.excerpt}</p>
          </Link>
        ))}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">News</p>
            <h2>最新活动与新闻</h2>
          </div>
          <Link href="/news">全部新闻</Link>
        </div>
        <div className="article-grid">
          {articles.map((article) => {
            const image = bestImage(article);
            return (
              <Link className="article-card" href={`/${article.slug}`} key={article.nid}>
                {image ? <img src={image.url} alt={image.alt || article.title} /> : null}
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

      <section className="section gallery-band">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Archive</p>
            <h2>历史相册</h2>
          </div>
          <Link href="/gallery">全部相册</Link>
        </div>
        <div className="gallery-grid">
          {galleries.map((gallery) => {
            const image = bestImage(gallery);
            return (
              <Link className="gallery-card" href={`/${gallery.slug}`} key={gallery.nid}>
                {image ? <img src={image.url} alt={image.alt || gallery.title} /> : null}
                <span>{gallery.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
