import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(webRoot, '..');
const sqlPath = path.join(projectRoot, 'database', '68970m55641_1.sql');
const legacyDrupalRoot = path.join(projectRoot, 'files', 'htdocs-lftp', 'drupal-7.12');
const sourceFilesRoot = path.join(projectRoot, 'files', 'htdocs-lftp', 'drupal-7.12', 'sites', 'default', 'files');
const publicRoot = path.join(webRoot, 'public');
const legacyPublicRoot = path.join(publicRoot, 'legacy-files');
const generatedDir = path.join(webRoot, 'src', 'data', 'generated');
const outputPath = path.join(generatedDir, 'site.json');

const tables = [
  'node',
  'field_data_body',
  'field_data_field_file',
  'field_data_field_image',
  'field_data_field_photo',
  'file_managed',
  'taxonomy_index',
  'taxonomy_term_data',
  'url_alias'
];

const pageSlugs = new Set([
  'AboutUs',
  'AboutSJTU',
  'Vorstand',
  'ContactUs',
  'Antrag',
  'SatzungCH',
  'OpenLetter',
  'Services',
  'Partner',
  'Links',
  'Spende',
  'ActivitiesNews',
  'SJTUAMDShortIntro',
  'SJTUAMDHistory'
]);

const nav = [
  { label: '首页', href: '/' },
  { label: '活动新闻', href: '/news' },
  { label: '关于我们', href: '/AboutUs' },
  { label: '理事会', href: '/Vorstand' },
  { label: '加入校友会', href: '/Antrag' },
  { label: '联系我们', href: '/ContactUs' }
];

function decodeSqlEscape(char) {
  switch (char) {
    case '0':
      return '\0';
    case 'b':
      return '\b';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case 'Z':
      return '\x1a';
    default:
      return char;
  }
}

function coerceToken(token, quoted) {
  if (quoted) return token;
  const value = token.trim();
  if (value.toUpperCase() === 'NULL') return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  if (/^0x[0-9a-f]+$/i.test(value)) {
    return Buffer.from(value.slice(2), 'hex').toString('utf8');
  }
  return value;
}

function parseRows(valuesSql) {
  const rows = [];
  let row = null;
  let token = '';
  let inString = false;
  let escaping = false;
  let quoted = false;

  function pushToken() {
    if (!row) return;
    row.push(coerceToken(token, quoted));
    token = '';
    quoted = false;
  }

  for (let index = 0; index < valuesSql.length; index += 1) {
    const char = valuesSql[index];

    if (inString) {
      if (escaping) {
        token += decodeSqlEscape(char);
        escaping = false;
        continue;
      }
      if (char === '\\') {
        escaping = true;
        continue;
      }
      if (char === "'" && valuesSql[index + 1] === "'") {
        token += "'";
        index += 1;
        continue;
      }
      if (char === "'") {
        inString = false;
        continue;
      }
      token += char;
      continue;
    }

    if (!row) {
      if (char === '(') row = [];
      continue;
    }

    if (char === "'") {
      if (token.trim() === '') token = '';
      inString = true;
      quoted = true;
      continue;
    }

    if (quoted && /\s/.test(char)) {
      continue;
    }

    if (char === ',') {
      pushToken();
      continue;
    }

    if (char === ')') {
      pushToken();
      rows.push(row);
      row = null;
      continue;
    }

    token += char;
  }

  return rows;
}

function parseTable(sql, tableName) {
  const rows = [];
  let index = 0;
  const marker = `INSERT INTO \`${tableName}\``;

  while (true) {
    const start = sql.indexOf(marker, index);
    if (start === -1) break;

    let end = sql.indexOf(';\n\n--', start);
    if (end === -1) end = sql.indexOf(';\r\n\r\n--', start);
    if (end === -1) end = sql.indexOf(';\n', start);
    if (end === -1) throw new Error(`Could not find end of INSERT for ${tableName}`);

    const statement = sql.slice(start, end + 1);
    const columnsStart = statement.indexOf('(');
    const columnsEnd = statement.indexOf(') VALUES');
    const columns = statement
      .slice(columnsStart + 1, columnsEnd)
      .split(',')
      .map((column) => column.trim().replace(/^`|`$/g, ''));
    const valuesSql = statement.slice(columnsEnd + ') VALUES'.length).trim().replace(/;$/, '');

    for (const row of parseRows(valuesSql)) {
      const record = {};
      columns.forEach((column, columnIndex) => {
        record[column] = row[columnIndex] ?? null;
      });
      rows.push(record);
    }

    index = end + 1;
  }

  return rows;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIso(timestamp) {
  return new Date(Number(timestamp) * 1000).toISOString();
}

function toSlug(node) {
  const alias = aliasBySource.get(`node/${node.nid}`);
  if (alias) return String(alias).replace(/^\/+|\/+$/g, '');
  return `node-${node.nid}`;
}

function publicPathFromUri(uri) {
  if (!uri) return null;
  if (uri.startsWith('public://')) return `/legacy-files/${uri.slice('public://'.length)}`;
  return uri;
}

function sourcePathFromUri(uri) {
  if (!uri?.startsWith('public://')) return null;
  return path.join(sourceFilesRoot, ...uri.slice('public://'.length).split('/'));
}

function rewriteLegacyUrls(html) {
  return html
    .replace(/https?:\/\/(?:www\.)?sjtu-germany\.de\//gi, '/')
    .replace(/https?:\/\/mmbiz\.qpic\.cn\/[^\s"'<>)]*/gi, (url) => cachedExternalImagePath(url))
    .replace(/(["'(])\/?sites\/default\/files\//gi, '$1/legacy-files/')
    .replace(/(["'(])public:\/\//gi, '$1/legacy-files/')
    .replace(/(["'(])\/?Pictures\//gi, '$1/legacy-files/Pictures/')
    .replace(/(["'(])\/?SJTUAMD-Files\//gi, '$1/legacy-files/SJTUAMD-Files/')
    .replace(/20120415-\s*Frankfurt\/\s*/g, '20120415-Frankfurt/')
    .replace(/20130925-Chinesische(?:%20| )Ess-Kulturtage/gi, '20130925_Chinesische_EssKulturtage')
    .replace(/20130925_Chinesische_EssKulturtage\/03\.JPG/g, '20130925_Chinesische_EssKulturtage/03.jpg');
}

function cachedExternalImagePath(url) {
  const normalized = url.replace(/^http:\/\//i, 'https://');
  const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 16);

  return `/cached-external/mmbiz/${hash}.webp`;
}

function sanitizeHtml(html) {
  return rewriteLegacyUrls(String(html ?? ''))
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*"javascript:[^"]*"/gi, '')
    .replace(/\s(href|src)\s*=\s*'javascript:[^']*'/gi, '');
}

function copyPublicFile(file) {
  const sourcePath = sourcePathFromUri(file.uri);
  const publicPath = publicPathFromUri(file.uri);
  if (!sourcePath || !publicPath || !existsSync(sourcePath)) return false;

  const destination = path.join(publicRoot, publicPath.replace(/^\/+/, ''));
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(sourcePath, destination);
  return true;
}

function copyLegacyDirectory(name) {
  const source = path.join(legacyDrupalRoot, name);
  const destination = path.join(legacyPublicRoot, name);

  if (!existsSync(source)) return false;

  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
  return true;
}

function createFileRecord(file) {
  const url = publicPathFromUri(file.uri);
  return {
    fid: file.fid,
    filename: file.filename,
    uri: file.uri,
    url,
    mime: file.filemime,
    size: file.filesize,
    copied: url ? existsSync(path.join(publicRoot, url.replace(/^\/+/, ''))) : false
  };
}

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = item[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  return groups;
}

function getAttachment(row) {
  const fidKey = Object.keys(row).find((key) => key.endsWith('_fid'));
  if (!fidKey) return null;
  const file = fileById.get(row[fidKey]);
  if (!file) return null;
  return {
    ...createFileRecord(file),
    alt: row[`${fidKey.slice(0, -4)}_alt`] ?? '',
    title: row[`${fidKey.slice(0, -4)}_title`] ?? '',
    width: row[`${fidKey.slice(0, -4)}_width`] ?? null,
    height: row[`${fidKey.slice(0, -4)}_height`] ?? null
  };
}

function compactHtmlExcerpt(item, maxLength = 180) {
  const source = item.summary || stripTags(item.bodyHtml);
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).replace(/\s+\S*$/, '')}...`;
}

console.log(`Reading ${sqlPath}`);
const sql = readFileSync(sqlPath, 'utf8');

const data = Object.fromEntries(tables.map((tableName) => [tableName, parseTable(sql, tableName)]));
const aliasBySource = new Map(data.url_alias.map((alias) => [alias.source, alias.alias]));
const managedFiles = data.file_managed.filter((file) => typeof file.uri === 'string' && file.uri.startsWith('public://'));
const fileById = new Map(managedFiles.map((file) => [file.fid, file]));
const bodyByNodeId = new Map(data.field_data_body.map((body) => [body.entity_id, body]));
const termById = new Map(data.taxonomy_term_data.map((term) => [term.tid, term.name]));
const termRowsByNodeId = groupBy(data.taxonomy_index, 'nid');

rmSync(legacyPublicRoot, { recursive: true, force: true });
mkdirSync(legacyPublicRoot, { recursive: true });

let copiedFiles = 0;
for (const file of managedFiles) {
  if (copyPublicFile(file)) copiedFiles += 1;
}

const copiedLegacyDirectories = ['Pictures'].filter((name) => copyLegacyDirectory(name));

mkdirSync(path.join(publicRoot, 'brand'), { recursive: true });

const photoRowsByNodeId = groupBy(data.field_data_field_photo, 'entity_id');
const imageRowsByNodeId = groupBy(data.field_data_field_image, 'entity_id');
const fileRowsByNodeId = groupBy(data.field_data_field_file, 'entity_id');

const content = data.node
  .filter((node) => Number(node.status) === 1)
  .filter((node) => !['panel'].includes(node.type))
  .map((node) => {
    const body = bodyByNodeId.get(node.nid);
    const photoRows = photoRowsByNodeId.get(node.nid) ?? [];
    const imageRows = imageRowsByNodeId.get(node.nid) ?? [];
    const fileRows = fileRowsByNodeId.get(node.nid) ?? [];
    const photos = photoRows.map(getAttachment).filter(Boolean);
    const images = imageRows.map(getAttachment).filter(Boolean);
    const attachments = fileRows.map(getAttachment).filter(Boolean);
    const bodyHtml = sanitizeHtml(body?.body_value ?? '');
    const summary = stripTags(body?.body_summary ?? '') || stripTags(bodyHtml).slice(0, 240);
    const terms = (termRowsByNodeId.get(node.nid) ?? []).map((row) => termById.get(row.tid)).filter(Boolean);

    return {
      nid: node.nid,
      type: node.type,
      language: node.language,
      title: node.title,
      slug: toSlug(node),
      status: node.status,
      promoted: Boolean(node.promote),
      sticky: Boolean(node.sticky),
      created: node.created,
      changed: node.changed,
      createdISO: toIso(node.created),
      changedISO: toIso(node.changed),
      year: new Date(Number(node.created) * 1000).getFullYear(),
      bodyHtml,
      summary,
      excerpt: '',
      photos,
      images,
      attachments,
      terms
    };
  })
  .sort((left, right) => Number(right.created) - Number(left.created))
  .map((item) => ({
    ...item,
    excerpt: compactHtmlExcerpt(item)
  }));

const contentBySlug = new Map(content.map((item) => [item.slug, item]));
const pages = content.filter((item) => pageSlugs.has(item.slug) || item.type === 'page' || item.type === '_fileset_type');
const articles = content.filter((item) => item.type === 'article' && !pageSlugs.has(item.slug));
const galleries = content.filter((item) => item.type === 'photo_gallery' || item.photos.length > 0);
const featuredSlugs = ['SJTUAMDShortIntro', 'ActivitiesNews', 'AboutUs', 'ContactUs'].filter((slug) => contentBySlug.has(slug));

const output = {
  generatedAt: new Date().toISOString(),
  source: {
    sql: path.relative(projectRoot, sqlPath),
    files: path.relative(projectRoot, sourceFilesRoot)
  },
  stats: {
    nodes: data.node.length,
    publishedContent: content.length,
    pages: pages.length,
    articles: articles.length,
    galleries: galleries.length,
    managedFiles: managedFiles.length,
    copiedFiles,
    copiedLegacyDirectories,
    legacyFileBytes: managedFiles.reduce((sum, file) => sum + (Number(file.filesize || 0) || 0), 0)
  },
  nav,
  featuredSlugs,
  pages,
  articles,
  galleries,
  files: managedFiles.map(createFileRecord)
};

mkdirSync(generatedDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

const byteCount = statSync(outputPath).size;
console.log(`Wrote ${path.relative(webRoot, outputPath)} (${byteCount} bytes)`);
console.log(`Content: ${content.length} published items, ${articles.length} articles, ${galleries.length} galleries`);
console.log(`Files: copied ${copiedFiles}/${managedFiles.length} managed files`);
console.log(`Legacy directories: copied ${copiedLegacyDirectories.join(', ') || 'none'}`);
