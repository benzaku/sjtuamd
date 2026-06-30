import Link from 'next/link';
import { bestImage, site } from '../../lib/data';

export const metadata = {
  title: '历史相册'
};

export default function GalleryPage() {
  return (
    <main className="page-shell">
      <header className="page-hero compact">
        <p className="eyebrow">Gallery</p>
        <h1>历史相册</h1>
        <p>校友会活动照片与历史资料。</p>
      </header>
      <div className="gallery-grid full">
        {site.galleries.map((gallery) => {
          const image = bestImage(gallery);
          return (
            <Link className="gallery-card" href={`/${gallery.slug}`} key={gallery.nid}>
              {image ? <img src={image.url} alt={image.alt || gallery.title} /> : null}
              <span>{gallery.title}</span>
              <small>{gallery.photos.length} 张照片</small>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
