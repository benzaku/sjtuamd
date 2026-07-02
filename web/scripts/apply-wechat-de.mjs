// Merge German translations (produced by translation agents as per-slug
// title.txt / summary.txt / body.html files) into the imported article JSONs,
// setting each record's `de` field.
//
//   node scripts/apply-wechat-de.mjs <deDir>
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const importedDir = path.resolve(__dirname, '..', 'content', 'imported');

const deDir = process.argv[2];
if (!deDir) {
  console.error('usage: node scripts/apply-wechat-de.mjs <deDir>');
  process.exit(1);
}

function imgSignature(html) {
  return [...String(html).matchAll(/src="([^"]+)"/g)].map((m) => m[1]).join('|');
}

let applied = 0;
const issues = [];

for (const file of readdirSync(importedDir).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '');
  const titlePath = path.join(deDir, `${slug}.title.txt`);
  const summaryPath = path.join(deDir, `${slug}.summary.txt`);
  const bodyPath = path.join(deDir, `${slug}.body.html`);

  if (!existsSync(titlePath) || !existsSync(bodyPath)) {
    issues.push(`${slug}: missing de files (kept zh)`);
    continue;
  }

  const record = JSON.parse(readFileSync(path.join(importedDir, file), 'utf8'));
  const title = readFileSync(titlePath, 'utf8').trim();
  const summary = existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8').trim() : title;
  const bodyHtml = readFileSync(bodyPath, 'utf8').trim();

  if (imgSignature(bodyHtml) !== imgSignature(record.bodyHtml)) {
    issues.push(`${slug}: de image srcs differ from source — SKIPPED`);
    continue;
  }

  record.de = { title, summary, bodyHtml };
  writeFileSync(path.join(importedDir, file), `${JSON.stringify(record, null, 2)}\n`);
  applied += 1;
}

console.log(`Applied German translations to ${applied} imported articles.`);
if (issues.length) {
  console.log('Issues:');
  for (const i of issues) console.log('  ' + i);
}
