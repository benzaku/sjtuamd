'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeFromPathname, localizeHref, messages } from '../lib/i18n';

export default function NotFound() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname || '/');
  const t = messages(locale);

  return (
    <main className="page-shell">
      <section className="page-hero compact">
        <p className="eyebrow">{t.notFound.eyebrow}</p>
        <h1>{t.notFound.title}</h1>
        <p>{t.notFound.body}</p>
        <Link className="button primary" href={localizeHref('/', locale)}>
          {t.notFound.home}
        </Link>
      </section>
    </main>
  );
}
