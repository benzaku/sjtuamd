'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  localeFromPathname,
  localizeHref,
  messages,
  navItems,
  switchLocalePath
} from '../../lib/i18n';

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return pathname.replace(/\/$/, '');
}

function isActivePath(currentPath: string, href: string) {
  const target = normalizePath(href);
  if (target === '/' || target === '/de') {
    return currentPath === target;
  }
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

function currentLabel(currentPath: string, nav: { href: string; label: string }[], fallback: string) {
  const active = nav.find((item) => isActivePath(currentPath, item.href));
  return active ? active.label : fallback;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname || '/');
  const locale = localeFromPathname(currentPath);
  const t = messages(locale);
  const nav = navItems(locale);
  const otherLocale = locale === 'zh' ? 'de' : 'zh';
  const switchPath = switchLocalePath(currentPath, otherLocale);

  const mobileNavRef = useRef<HTMLDetailsElement>(null);
  const closeMobileNav = () => {
    if (mobileNavRef.current) mobileNavRef.current.open = false;
  };

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  // Client-side navigation doesn't reload the page, so collapse the mobile
  // dropdown whenever the route changes (i.e. after a menu item is selected).
  useEffect(() => {
    closeMobileNav();
  }, [pathname]);

  const navLinks = nav.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActivePath(currentPath, item.href) ? 'page' : undefined}
      onClick={closeMobileNav}
    >
      {item.label}
    </Link>
  ));

  return (
    <>
      <header className="site-header">
        <div className="main-header">
          <Link className="brand" href={localizeHref('/', locale)} aria-label={t.brand.homeAria}>
            <img src="/brand/sjtu-logo.png" alt="SJTU" />
            <span>
              <strong>{t.brand.strong}</strong>
              <small>{t.brand.small}</small>
            </span>
          </Link>
          <nav className="primary-nav" aria-label={t.brand.strong}>
            {navLinks}
          </nav>
          <Link className="lang-switch" href={switchPath} aria-label={t.langSwitch.aria}>
            {t.langSwitch.toLabel}
          </Link>
          <details className="mobile-nav" ref={mobileNavRef}>
            <summary>
              <span>{currentLabel(currentPath, nav, t.mobileMenu)}</span>
            </summary>
            <nav className="mobile-nav-panel" aria-label={t.brand.strong}>
              {navLinks}
              <Link href={switchPath} aria-label={t.langSwitch.aria} onClick={closeMobileNav}>
                {t.langSwitch.toLabel}
              </Link>
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div>
          <strong>{t.footer.strong}</strong>
          <span>{t.footer.english}</span>
        </div>
        <div className="footer-links">
          <Link href={localizeHref('/Links', locale)}>{t.footer.links}</Link>
          <Link href={localizeHref('/Partner', locale)}>{t.footer.partner}</Link>
          <Link href={localizeHref('/ContactUs', locale)}>{t.footer.contact}</Link>
        </div>
      </footer>
    </>
  );
}
