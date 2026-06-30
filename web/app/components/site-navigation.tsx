'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '../../lib/data';

type CurrentLabel = {
  href: string;
  label: string;
};

type SiteNavigationProps = {
  nav: NavItem[];
  currentLabels: CurrentLabel[];
};

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/$/, '');
}

function isActivePath(currentPath: string, href: string) {
  const targetPath = normalizePath(href);

  if (targetPath === '/') {
    return currentPath === '/';
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function currentPageLabel(currentPath: string, nav: NavItem[], labels: CurrentLabel[]) {
  const activeNav = nav.find((item) => isActivePath(currentPath, item.href));

  if (activeNav) {
    return activeNav.label;
  }

  const activeContent = labels.find((item) => normalizePath(item.href) === currentPath);

  if (activeContent) {
    return activeContent.label;
  }

  if (currentPath === '/gallery') {
    return '历史相册';
  }

  if (currentPath.startsWith('/news')) {
    return '活动新闻';
  }

  return '当前页面';
}

export function SiteNavigation({ nav, currentLabels }: SiteNavigationProps) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const label = currentPageLabel(currentPath, nav, currentLabels);

  return (
    <>
      <nav className="primary-nav" aria-label="主导航">
        {nav.map((item) => {
          const active = isActivePath(currentPath, item.href);

          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <details className="mobile-nav">
        <summary>
          <span>{label}</span>
        </summary>
        <nav className="mobile-nav-panel" aria-label="移动主导航">
          {nav.map((item) => {
            const active = isActivePath(currentPath, item.href);

            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </details>
    </>
  );
}
