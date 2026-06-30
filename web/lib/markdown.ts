export type FrontmatterValue = string | boolean;

export type ParsedMarkdown = {
  frontmatter: Record<string, FrontmatterValue>;
  body: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value: string) {
  const trimmed = value.trim();

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:')
  ) {
    return escapeHtml(trimmed);
  }

  return '#';
}

function parseFrontmatterValue(value: string): FrontmatterValue {
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '');

  if (unquoted === 'true') {
    return true;
  }

  if (unquoted === 'false') {
    return false;
  }

  return unquoted;
}

export function parseMarkdownFile(source: string): ParsedMarkdown {
  const normalized = source.replace(/\r\n?/g, '\n');

  if (!normalized.startsWith('---\n')) {
    return {
      frontmatter: {},
      body: normalized.trim()
    };
  }

  const endIndex = normalized.indexOf('\n---', 4);

  if (endIndex === -1) {
    return {
      frontmatter: {},
      body: normalized.trim()
    };
  }

  const frontmatterBlock = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 4).trim();
  const frontmatter: Record<string, FrontmatterValue> = {};

  for (const line of frontmatterBlock.split('\n')) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);

    if (!match) {
      continue;
    }

    frontmatter[match[1]] = parseFrontmatterValue(match[2]);
  }

  return { frontmatter, body };
}

function formatInline(source: string) {
  let html = escapeHtml(source);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]+)&quot;)?\)/g, (_match, alt, url, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${safeUrl(url)}" alt="${alt}"${titleAttr} loading="lazy">`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text, url) => `<a href="${safeUrl(url)}">${text}</a>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return html;
}

function isSpecialBlock(line: string) {
  return (
    /^#{1,4}\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^```/.test(line)
  );
}

function renderList(lines: string[], ordered: boolean) {
  const tag = ordered ? 'ol' : 'ul';
  const marker = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
  const items = lines.map((line) => `<li>${formatInline(line.replace(marker, '').trim())}</li>`).join('');

  return `<${tag}>${items}</${tag}>`;
}

export function markdownToHtml(source: string) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      index += 1;
      const className = language ? ` class="language-${escapeHtml(language)}"` : '';
      blocks.push(`<pre><code${className}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);

    if (heading) {
      const level = heading[1].length + 1;
      blocks.push(`<h${level}>${formatInline(heading[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const listLines: string[] = [];

      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderList(listLines, false));
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const listLines: string[] = [];

      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderList(listLines, true));
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index += 1;
      }

      blocks.push(`<blockquote><p>${formatInline(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim() && !isSpecialBlock(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(`<p>${formatInline(paragraphLines.join(' '))}</p>`);
  }

  return blocks.join('\n');
}

export function plainTextFromMarkdown(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
