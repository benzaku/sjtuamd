// Import WeChat (mp.weixin.qq.com) articles into the site: extract title, publish
// date and body from pre-fetched HTML, download the mmbiz images locally, clean the
// markup, and write one JSON per article to content/imported/.
//
//   node scripts/import-wechat.mjs <rawDir>
//
// <rawDir> must contain urls.txt (one URL per line) and raw/<n>.html for each.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const importedDir = path.join(webRoot, 'content', 'imported');
const imgPublicDir = path.join(webRoot, 'public', 'uploads', 'wechat');

const rawDir = process.argv[2];
if (!rawDir) {
  console.error('usage: node scripts/import-wechat.mjs <rawDir>');
  process.exit(1);
}

mkdirSync(importedDir, { recursive: true });
mkdirSync(imgPublicDir, { recursive: true });

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

const urls = readFileSync(path.join(rawDir, 'urls.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

function extFromUrl(url) {
  const fmt = url.match(/wx_fmt=([a-z0-9]+)/i)?.[1]?.toLowerCase();
  if (fmt === 'jpeg' || fmt === 'jpg') return 'jpg';
  if (fmt === 'png') return 'png';
  if (fmt === 'gif') return 'gif';
  if (fmt === 'webp') return 'webp';
  return 'jpg';
}

const imageMap = new Map(); // remote url -> local path (or null on failure)

async function downloadImage(url) {
  if (imageMap.has(url)) return imageMap.get(url);
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const ext = extFromUrl(url);
  const filename = `${hash}.${ext}`;
  const dest = path.join(imgPublicDir, filename);
  const local = `/uploads/wechat/${filename}`;

  if (existsSync(dest)) {
    imageMap.set(url, local);
    return local;
  }

  try {
    const res = await fetch(url, {
      headers: { Referer: 'https://mp.weixin.qq.com/', 'User-Agent': UA }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) throw new Error(`too small (${buf.length}B)`);
    writeFileSync(dest, buf);
    imageMap.set(url, local);
    return local;
  } catch (error) {
    console.warn(`  ! image failed ${url.slice(0, 70)}… : ${error.message}`);
    imageMap.set(url, null);
    return null;
  }
}

function cleanText(s) {
  return String(s).replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

async function processArticle(url, index) {
  const html = readFileSync(path.join(rawDir, 'raw', `${index + 1}.html`), 'utf8');
  const $ = cheerio.load(html);

  const title = cleanText(
    $('meta[property="og:title"]').attr('content') || $('#activity-name').text() || `article-${index + 1}`
  );
  const createTime = html.match(/var createTime = '([^']*)'/)?.[1];
  const oriCreateTime = html.match(/var oriCreateTime = '(\d+)'/)?.[1];
  const dateOnly = createTime ? createTime.slice(0, 10) : null;
  if (!dateOnly) throw new Error(`no createTime for ${url}`);
  const created = oriCreateTime ? Number(oriCreateTime) : Math.floor(Date.parse(`${dateOnly}T00:00:00+08:00`) / 1000);

  const ogDesc = ($('meta[property="og:description"]').attr('content') || '')
    .replace(/\\x0a/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '');
  // Cover image (og:image) — used as the article's lead / card thumbnail.
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  let cover = null;
  if (/^https?:\/\/mmbiz\.qpic\.cn/i.test(ogImage)) cover = await downloadImage(ogImage);

  const content = $('#js_content');
  content.find('script, style, iframe, mpvoice, mp-common-profile, mp-miniprogram, qqmusic').remove();

  // Download every content image first, then rewrite.
  const imgEls = content.find('img').toArray();
  for (const el of imgEls) {
    const src = $(el).attr('data-src') || $(el).attr('src') || '';
    if (/^https?:\/\/mmbiz\.qpic\.cn/i.test(src)) await downloadImage(src);
  }

  // Strip attributes: keep only href on <a> and a clean local src+alt on <img>.
  content.find('*').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    const $el = $(el);
    const href = tag === 'a' ? $el.attr('href') : undefined;
    const src = tag === 'img' ? $el.attr('data-src') || $el.attr('src') || '' : undefined;
    for (const attr of Object.keys(el.attribs || {})) $el.removeAttr(attr);
    if (tag === 'a' && href && /^https?:\/\//i.test(href)) $el.attr('href', href);
    if (tag === 'img') {
      const local = imageMap.get(src);
      if (local) {
        $el.attr('src', local);
        $el.attr('alt', title);
        $el.attr('loading', 'lazy');
      } else {
        $el.remove();
      }
    }
  });

  content.find('a:not(:has(img))').each((_, el) => {
    // Drop links that point back into WeChat chrome but keep their text.
    const $el = $(el);
    const href = $el.attr('href') || '';
    if (!href || /mp\.weixin\.qq\.com|weixin\.qq\.com/i.test(href)) {
      $el.replaceWith($el.text());
    }
  });

  let bodyHtml = (content.html() || '').trim();
  bodyHtml = bodyHtml
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
    .replace(/\n{2,}/g, '\n')
    .trim();

  let plain = cleanText(content.text());

  // Some WeChat articles render the body client-side; the static HTML has an
  // empty #js_content. Fall back to the og:description teaser so the article
  // still carries text.
  if (!plain && ogDesc) {
    const escaped = ogDesc
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    bodyHtml = escaped
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join('');
    plain = cleanText(ogDesc);
  }

  // Attribution / fallback link to the original.
  bodyHtml += `<p><a href="${url}">阅读原文（微信公众号）</a></p>`;

  const summary = plain.slice(0, 180);
  const imgCount = (bodyHtml.match(/<img /g) || []).length;

  const idToken = url.split('/').pop().slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
  const slug = `${dateOnly}-wx-${idToken}`;

  const record = {
    slug,
    sourceUrl: url,
    date: dateOnly,
    created,
    title,
    summary,
    cover,
    bodyHtml,
    imageCount: imgCount,
    de: null
  };

  writeFileSync(path.join(importedDir, `${slug}.json`), `${JSON.stringify(record, null, 2)}\n`);
  console.log(`${index + 1}. ${dateOnly}  imgs:${imgCount}  ${slug}  ${title.slice(0, 40)}`);
  return record;
}

async function main() {
  console.log(`Importing ${urls.length} WeChat articles…`);
  for (let i = 0; i < urls.length; i += 1) {
    await processArticle(urls[i], i);
  }
  const ok = [...imageMap.values()].filter(Boolean).length;
  const failed = [...imageMap.values()].filter((v) => v === null).length;
  console.log(`Images: ${ok} downloaded, ${failed} failed, ${imageMap.size} unique.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
