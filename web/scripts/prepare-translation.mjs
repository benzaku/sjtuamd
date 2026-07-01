// Split the Chinese site bundle into chunk files of translatable segments for
// offline translation agents.
//
//   node scripts/prepare-translation.mjs <outDir> [chunkCount]
//
// Writes <outDir>/tin-<n>.json, each = [{ id, segments: [string, ...] }].
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, COLLECTIONS, itemId } from './segments.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(__dirname, '..', 'src', 'data', 'generated', 'site.json');

const outDir = process.argv[2];
const chunkCount = Number(process.argv[3] || 10);
if (!outDir) {
  console.error('usage: node scripts/prepare-translation.mjs <outDir> [chunkCount]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));

const units = [];
for (const collection of COLLECTIONS) {
  source[collection].forEach((item, index) => {
    const { segments } = collect(item);
    if (segments.length > 0) {
      units.push({ id: itemId(collection, index), segments });
    }
  });
}

// Balance chunks by total character weight so no agent gets all the big bodies.
units.sort((a, b) => weight(b) - weight(a));
const chunks = Array.from({ length: chunkCount }, () => ({ items: [], weight: 0 }));
for (const unit of units) {
  const target = chunks.reduce((min, c) => (c.weight < min.weight ? c : min), chunks[0]);
  target.items.push(unit);
  target.weight += weight(unit);
}

function weight(unit) {
  return unit.segments.reduce((sum, s) => sum + s.length, 0);
}

let written = 0;
chunks.forEach((chunk, index) => {
  if (chunk.items.length === 0) return;
  writeFileSync(path.join(outDir, `tin-${index}.json`), JSON.stringify(chunk.items, null, 2));
  written += chunk.items.length;
  console.log(`tin-${index}.json: ${chunk.items.length} items, ~${chunk.weight} chars`);
});
console.log(`Total ${written} items across ${chunks.filter((c) => c.items.length).length} chunks`);
