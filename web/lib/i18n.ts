export type Locale = 'zh' | 'de';

export const locales: Locale[] = ['zh', 'de'];
export const defaultLocale: Locale = 'zh';

export type NavItem = {
  label: string;
  href: string;
};

type Messages = {
  htmlLang: string;
  dateLocale: string;
  brand: { strong: string; small: string; homeAria: string };
  nav: { label: string; path: string }[];
  langSwitch: { toLabel: string; aria: string };
  mobileMenu: string;
  hero: {
    eyebrow: string;
    title: string;
    tagline: string;
    browseNews: string;
    join: string;
    albumAria: string;
  };
  homeNews: { eyebrow: string; heading: string; all: string };
  homeGallery: { eyebrow: string; heading: string; all: string };
  news: { eyebrow: string; title: string; intro: string };
  gallery: { eyebrow: string; title: string; intro: string; photoCount: (n: number) => string };
  content: {
    labelPage: string;
    labelArticle: string;
    labelGallery: string;
    attachments: string;
    photos: string;
    related: string;
  };
  footer: { strong: string; english: string; links: string; partner: string; contact: string };
  notFound: { eyebrow: string; title: string; body: string; home: string };
  meta: { defaultTitle: string; template: string; description: string };
};

// Navigation paths are locale-agnostic slugs; hrefs are localized via localizeHref.
const NAV_PATHS = ['/', '/news', '/AboutUs', '/Vorstand', '/Antrag', '/ContactUs'] as const;

const zh: Messages = {
  htmlLang: 'zh-CN',
  dateLocale: 'zh-CN',
  brand: { strong: '德国校友会', small: 'SJTUAMD', homeAria: '上海交通大学德国校友会首页' },
  nav: [
    { label: '首页', path: '/' },
    { label: '活动新闻', path: '/news' },
    { label: '关于我们', path: '/AboutUs' },
    { label: '理事会', path: '/Vorstand' },
    { label: '加入校友会', path: '/Antrag' },
    { label: '联系我们', path: '/ContactUs' }
  ],
  langSwitch: { toLabel: 'DE', aria: 'Zur deutschen Version wechseln' },
  mobileMenu: '菜单',
  hero: {
    eyebrow: 'SJTU Alumni Germany',
    title: '上海交通大学德国校友会',
    tagline: '连接在德交大校友，记录校友活动与母校交流，延续“饮水思源，爱国荣校”的共同记忆。',
    browseNews: '浏览活动新闻',
    join: '加入校友会',
    albumAria: '校友活动相册'
  },
  homeNews: { eyebrow: 'News', heading: '最新活动与新闻', all: '全部新闻' },
  homeGallery: { eyebrow: 'Archive', heading: '历史相册', all: '全部相册' },
  news: { eyebrow: 'News', title: '活动新闻', intro: '校友会活动、母校新闻、交流通知和历史报道。' },
  gallery: {
    eyebrow: 'Gallery',
    title: '历史相册',
    intro: '校友会活动照片与历史资料。',
    photoCount: (n) => `${n} 张照片`
  },
  content: {
    labelPage: 'Page',
    labelArticle: 'News',
    labelGallery: 'Gallery',
    attachments: '相关文件',
    photos: '照片',
    related: '同年报道'
  },
  footer: {
    strong: '上海交通大学德国校友会',
    english: 'Shanghai Jiao Tong University Alumni Association in Germany',
    links: '链接',
    partner: '合作伙伴',
    contact: '联系'
  },
  notFound: {
    eyebrow: '404',
    title: '页面未找到',
    body: '该链接可能来自旧站，或内容尚未迁移。',
    home: '返回首页'
  },
  meta: {
    defaultTitle: '上海交通大学德国校友会',
    template: '%s | 上海交通大学德国校友会',
    description: '上海交通大学德国校友会官网，汇集校友活动、新闻、文档和相册。'
  }
};

const de: Messages = {
  htmlLang: 'de',
  dateLocale: 'de-DE',
  brand: { strong: 'SJTUAMD e.V.', small: 'Absolventen- & Mitgliederverein', homeAria: 'Startseite des SJTUAMD e.V.' },
  nav: [
    { label: 'Startseite', path: '/' },
    { label: 'Aktuelles', path: '/news' },
    { label: 'Über uns', path: '/AboutUs' },
    { label: 'Vorstand', path: '/Vorstand' },
    { label: 'Mitglied werden', path: '/Antrag' },
    { label: 'Kontakt', path: '/ContactUs' }
  ],
  langSwitch: { toLabel: '中文', aria: '切换到中文版' },
  mobileMenu: 'Menü',
  hero: {
    eyebrow: 'SJTUAMD e.V.',
    title: 'Verein der Absolventen und Mitglieder der Shanghai Jiao Tong Universität in Deutschland e.V.',
    tagline:
      'Wir vernetzen SJTU-Alumni in Deutschland und pflegen Aktivitäten, den Austausch mit der Universität und gemeinsame Erinnerungen.',
    browseNews: 'Aktuelles ansehen',
    join: 'Mitglied werden',
    albumAria: 'Fotoalbum der Vereinsaktivitäten'
  },
  homeNews: { eyebrow: 'News', heading: 'Aktuelles & Veranstaltungen', all: 'Alle Neuigkeiten' },
  homeGallery: { eyebrow: 'Archiv', heading: 'Fotogalerie', all: 'Alle Alben' },
  news: {
    eyebrow: 'News',
    title: 'Aktuelles & Veranstaltungen',
    intro: 'Vereinsaktivitäten, Nachrichten der Universität, Einladungen und historische Berichte.'
  },
  gallery: {
    eyebrow: 'Galerie',
    title: 'Fotogalerie',
    intro: 'Fotos von Vereinsaktivitäten und historische Materialien.',
    photoCount: (n) => `${n} Fotos`
  },
  content: {
    labelPage: 'Seite',
    labelArticle: 'Neuigkeiten',
    labelGallery: 'Galerie',
    attachments: 'Zugehörige Dateien',
    photos: 'Fotos',
    related: 'Berichte aus demselben Jahr'
  },
  footer: {
    strong: 'Verein der Absolventen und Mitglieder der Shanghai Jiao Tong Universität in Deutschland e.V.',
    english: 'Shanghai Jiao Tong University Alumni Association in Germany',
    links: 'Links',
    partner: 'Partner',
    contact: 'Kontakt'
  },
  notFound: {
    eyebrow: '404',
    title: 'Seite nicht gefunden',
    body: 'Dieser Link stammt möglicherweise von der alten Website, oder der Inhalt wurde noch nicht migriert.',
    home: 'Zur Startseite'
  },
  meta: {
    defaultTitle: 'Verein der Absolventen und Mitglieder der Shanghai Jiao Tong Universität in Deutschland e.V.',
    template: '%s | SJTUAMD e.V.',
    description:
      'Offizielle Website des Vereins der Absolventen und Mitglieder der Shanghai Jiao Tong Universität in Deutschland e.V. (SJTUAMD): Aktivitäten, Neuigkeiten, Dokumente und Fotos.'
  }
};

const dictionaries: Record<Locale, Messages> = { zh, de };

export function messages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

/** Determine the active locale from a pathname (e.g. "/de/news" -> "de"). */
export function localeFromPathname(pathname: string): Locale {
  if (pathname === '/de' || pathname.startsWith('/de/')) {
    return 'de';
  }
  return 'zh';
}

/** Prefix a locale-agnostic path with the locale segment ("/news" -> "/de/news"). */
export function localizeHref(path: string, locale: Locale): string {
  if (locale === 'zh') {
    return path;
  }
  if (path === '/') {
    return '/de';
  }
  return `/de${path}`;
}

/** Return the equivalent path in the other locale, for the language switcher. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const bare = pathname === '/de' ? '/' : pathname.startsWith('/de/') ? pathname.slice(3) : pathname;
  const normalized = bare === '' ? '/' : bare;
  return localizeHref(normalized, target);
}

export function navItems(locale: Locale): NavItem[] {
  const dict = messages(locale);
  return dict.nav.map((item) => ({ label: item.label, href: localizeHref(item.path, locale) }));
}

export { NAV_PATHS };
