// Apply offline translations back onto the Chinese source structure, producing
// src/data/generated/site.de.json. Slugs, nids, dates, files and URLs are taken
// verbatim from the source; only the translated text segments are substituted.
//
//   node scripts/apply-translation.mjs <inDir>
//
// Reads every <inDir>/tout-*.json, each = [{ id, translations: [string, ...] }].
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, COLLECTIONS, itemId } from './segments.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, '..', 'src', 'data', 'generated');
const sourcePath = path.join(generatedDir, 'site.json');
const outputPath = path.join(generatedDir, 'site.de.json');

const inDir = process.argv[2];
if (!inDir) {
  console.error('usage: node scripts/apply-translation.mjs <inDir>');
  process.exit(1);
}

const translationsById = new Map();
for (const file of readdirSync(inDir).filter((f) => /^tout-.*\.json$/.test(f))) {
  const entries = JSON.parse(readFileSync(path.join(inDir, file), 'utf8'));
  for (const entry of entries) {
    translationsById.set(entry.id, entry.translations);
  }
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const output = { ...source, generatedAt: new Date().toISOString(), language: 'de' };

let translated = 0;
let missing = 0;
const errors = [];

for (const collection of COLLECTIONS) {
  output[collection] = source[collection].map((item, index) => {
    const id = itemId(collection, index);
    const clone = structuredClone(item);
    const { segments, setters } = collect(clone);

    if (segments.length === 0) return clone;

    const translations = translationsById.get(id);
    if (!translations) {
      missing += 1;
      errors.push(`${id}: no translation file entry (kept source)`);
      return clone;
    }
    if (translations.length !== setters.length) {
      errors.push(`${id}: length ${translations.length} != expected ${setters.length} (kept source)`);
      return clone;
    }

    setters.forEach((set, i) => {
      if (typeof translations[i] === 'string' && translations[i].trim()) {
        set(clone, translations[i]);
      }
    });
    translated += 1;
    return clone;
  });
}

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Applied translations to ${translated} items, ${missing} missing.`);
if (errors.length) {
  console.log('Issues:');
  for (const e of errors) console.log('  ' + e);
  process.exitCode = errors.length && translated === 0 ? 1 : 0;
}
console.log(`Wrote ${path.relative(path.resolve(__dirname, '..'), outputPath)}`);
