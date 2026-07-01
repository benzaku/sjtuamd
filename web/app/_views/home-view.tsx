import Link from 'next/link';
import { bestImage, featuredPages, formatDate, getSite, latestArticles } from '../../lib/data';
import { localizeHref, messages, type Locale } from '../../lib/i18n';

export function HomeView({ locale }: { locale: Locale }) {
  const t = messages(locale);
  const site = getSite(locale);
  const featured = featuredPages(locale);
  const articles = latestArticles(locale, 6);
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
        <img className="hero-bg" src="/brand/sjtudoorBG.jpg" alt="" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 className={locale === 'de' ? 'hero-title-long' : undefined}>{t.hero.title}</h1>
            <p>{t.hero.tagline}</p>
            <div className="hero-actions">
              <Link className="button primary" href={localizeHref('/news', locale)}>
                {t.hero.browseNews}
              </Link>
              <Link className="button" href={localizeHref('/Antrag', locale)}>
                {t.hero.join}
              </Link>
            </div>
            {heroPhotos.length > 0 ? (
              <div className="hero-album" aria-label={t.hero.albumAria}>
                <div className="hero-album-track">
                  {[...heroPhotos, ...heroPhotos].map((photo, index) => (
                    <Link className="hero-photo" href={localizeHref(`/${photo.gallerySlug}`, locale)} key={`${photo.fid}-${index}`}>
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
          <Link className="feature-card" href={localizeHref(`/${item.slug}`, locale)} key={item.slug}>
            <span>{item.title}</span>
            <p>{item.excerpt}</p>
          </Link>
        ))}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.homeNews.eyebrow}</p>
            <h2>{t.homeNews.heading}</h2>
          </div>
          <Link href={localizeHref('/news', locale)}>{t.homeNews.all}</Link>
        </div>
        <div className="article-grid">
          {articles.map((article) => {
            const image = bestImage(article);
            return (
              <Link className="article-card" href={localizeHref(`/${article.slug}`, locale)} key={article.nid}>
                {image ? <img src={image.url} alt={image.alt || article.title} /> : null}
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

      <section className="section gallery-band">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.homeGallery.eyebrow}</p>
            <h2>{t.homeGallery.heading}</h2>
          </div>
          <Link href={localizeHref('/gallery', locale)}>{t.homeGallery.all}</Link>
        </div>
        <div className="gallery-grid">
          {galleries.map((gallery) => {
            const image = bestImage(gallery);
            return (
              <Link className="gallery-card" href={localizeHref(`/${gallery.slug}`, locale)} key={gallery.nid}>
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
