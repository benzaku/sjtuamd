import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import zhSiteData from '../src/data/generated/site.json';
import deSiteData from '../src/data/generated/site.de.json';
import { markdownToHtml, parseMarkdownFile, plainTextFromMarkdown } from './markdown';
import { messages, type Locale } from './i18n';

export type LegacyFile = {
  fid: number;
  filename: string;
  uri: string;
  url: string;
  mime: string;
  size: number;
  copied: boolean;
  alt?: string;
  title?: string;
  width?: number | null;
  height?: number | null;
};

export type ContentItem = {
  nid: number;
  type: string;
  language: string;
  title: string;
  slug: string;
  created: number;
  changed: number;
  createdISO: string;
  changedISO: string;
  year: number;
  bodyHtml: string;
  summary: string;
  excerpt: string;
  promoted: boolean;
  sticky: boolean;
  photos: LegacyFile[];
  images: LegacyFile[];
  attachments: LegacyFile[];
  terms: string[];
};

export type SiteData = {
  generatedAt: string;
  stats: {
    publishedContent: number;
    pages: number;
    articles: number;
    galleries: number;
    managedFiles: number;
    copiedFiles: number;
    legacyFileBytes: number;
  };
  featuredSlugs: string[];
  pages: ContentItem[];
  articles: ContentItem[];
  galleries: ContentItem[];
  files: LegacyFile[];
};

type ResolvedSite = {
  site: SiteData;
  allContent: ContentItem[];
  bySlug: Map<string, ContentItem>;
  byNid: Map<string, ContentItem>;
};

const generatedByLocale: Record<Locale, SiteData> = {
  zh: zhSiteData as unknown as SiteData,
  de: deSiteData as unknown as SiteData
};

function frontmatterString(value: string | boolean | undefined) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9一-鿿._-]/g, '-')
    .replace(/-+/g, '-');
}

function articleTimestamp(rawDate: string | undefined, filename: string) {
  const filenameDate = filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const dateValue = rawDate || filenameDate;

  if (!dateValue) {
    throw new Error(`Markdown article "${filename}" needs a "date" field or YYYY-MM-DD filename prefix.`);
  }

  const timestamp = Date.parse(dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Markdown article "${filename}" has an invalid date: ${dateValue}`);
  }

  return timestamp;
}

function mimeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.gif') return 'image/gif';

  return 'application/octet-stream';
}

function markdownImage(filePath: string, alt: string, index: number): LegacyFile {
  return {
    fid: -100000 - index,
    filename: path.basename(filePath),
    uri: filePath,
    url: filePath,
    mime: mimeFromPath(filePath),
    size: 0,
    copied: true,
    alt,
    title: alt,
    width: null,
    height: null
  };
}

function loadMarkdownArticles(): ContentItem[] {
  const articlesDir = path.join(process.cwd(), 'content', 'articles');

  if (!existsSync(articlesDir)) {
    return [];
  }

  return readdirSync(articlesDir)
    .filter((filename) => filename.endsWith('.md') && !filename.startsWith('_') && filename !== 'README.md')
    .flatMap((filename, index) => {
      const source = readFileSync(path.join(articlesDir, filename), 'utf8');
      const { frontmatter, body } = parseMarkdownFile(source);

      if (frontmatter.published === false || frontmatter.draft === true) {
        return [];
      }

      const basename = filename.replace(/\.md$/, '');
      const title = frontmatterString(frontmatter.title) || basename.replace(/[-_]+/g, ' ');
      const created = articleTimestamp(frontmatterString(frontmatter.date), filename);
      const changed = articleTimestamp(frontmatterString(frontmatter.updated) || frontmatterString(frontmatter.date), filename);
      const slug = normalizeSlug(frontmatterString(frontmatter.slug) || basename);
      const excerpt = frontmatterString(frontmatter.excerpt) || `${plainTextFromMarkdown(body).slice(0, 120)}...`;
      const imagePath = frontmatterString(frontmatter.image);
      const imageAlt = frontmatterString(frontmatter.imageAlt) || title;
      const image = imagePath ? markdownImage(imagePath, imageAlt, index) : null;
      const createdISO = new Date(created).toISOString();

      return [{
        nid: -100000 - index,
        type: 'article',
        language: 'zh-hans',
        title,
        slug,
        created: Math.floor(created / 1000),
        changed: Math.floor(changed / 1000),
        createdISO,
        changedISO: new Date(changed).toISOString(),
        year: new Date(created).getUTCFullYear(),
        bodyHtml: markdownToHtml(body),
        summary: excerpt,
        excerpt,
        promoted: true,
        sticky: false,
        photos: [],
        images: image ? [image] : [],
        attachments: [],
        terms: frontmatterString(frontmatter.tags)?.split(',').map((tag) => tag.trim()).filter(Boolean) || []
      }];
    });
}

// Markdown articles are authored once (in Chinese) and shared across locales.
const markdownArticles = loadMarkdownArticles();

function buildSite(generated: SiteData): SiteData {
  return {
    ...generated,
    stats: {
      ...generated.stats,
      publishedContent: generated.stats.publishedContent + markdownArticles.length,
      articles: generated.stats.articles + markdownArticles.length
    },
    articles: [...markdownArticles, ...generated.articles].sort((a, b) => b.created - a.created)
  };
}

const resolvedCache = new Map<Locale, ResolvedSite>();

function resolve(locale: Locale): ResolvedSite {
  const cached = resolvedCache.get(locale);
  if (cached) return cached;

  const site = buildSite(generatedByLocale[locale]);
  const allContent = [...site.pages, ...site.articles, ...site.galleries];
  const resolved: ResolvedSite = {
    site,
    allContent,
    bySlug: new Map(allContent.map((item) => [item.slug, item])),
    byNid: new Map(allContent.map((item) => [String(item.nid), item]))
  };

  resolvedCache.set(locale, resolved);
  return resolved;
}

export function getSite(locale: Locale): SiteData {
  return resolve(locale).site;
}

export function allContent(locale: Locale): ContentItem[] {
  return resolve(locale).allContent;
}

export function getContentBySlug(locale: Locale, slug: string) {
  return resolve(locale).bySlug.get(slug);
}

export function getContentByNid(locale: Locale, nid: string) {
  return resolve(locale).byNid.get(nid);
}

export function formatDate(locale: Locale, isoDate: string) {
  return new Intl.DateTimeFormat(messages(locale).dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Berlin'
  }).format(new Date(isoDate));
}

export function bestImage(item: ContentItem) {
  return item.photos[0] ?? item.images[0] ?? firstInlineImage(item);
}

function firstInlineImage(item: ContentItem): LegacyFile | null {
  const matches = item.bodyHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);

  for (const match of matches) {
    const url = match[1].replace(/^http:\/\/mmbiz\.qpic\.cn\//i, 'https://mmbiz.qpic.cn/');

    if (/^https:\/\/mmbiz\.qpic\.cn\//i.test(url)) {
      continue;
    }

    const alt = match[0].match(/\salt=["']([^"']*)["']/i)?.[1] || item.title;

    return {
      fid: -200000 - item.nid,
      filename: path.basename(url.split(/[?#]/)[0]) || item.slug,
      uri: url,
      url,
      mime: mimeFromPath(url),
      size: 0,
      copied: true,
      alt,
      title: alt,
      width: null,
      height: null
    };
  }

  return null;
}

export function featuredPages(locale: Locale) {
  const { site } = resolve(locale);
  return site.featuredSlugs
    .map((slug) => getContentBySlug(locale, slug))
    .filter((item): item is ContentItem => Boolean(item));
}

export function latestArticles(locale: Locale, limit = 8) {
  return resolve(locale).site.articles.slice(0, limit);
}

export function relatedArticles(locale: Locale, item: ContentItem, limit = 3) {
  return resolve(locale)
    .site.articles.filter((article) => article.nid !== item.nid && article.year === item.year)
    .slice(0, limit);
}
