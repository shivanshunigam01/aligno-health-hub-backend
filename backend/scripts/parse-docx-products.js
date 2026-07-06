const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'docx-extract');
const xml = fs.readFileSync(path.join(base, 'word/document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(base, 'word/_rels/document.xml.rels'), 'utf8');

const idToFile = {};
for (const m of rels.matchAll(/Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"/g)) {
  if (m[1].includes('media/')) idToFile[m[2]] = path.basename(m[1]);
}
for (const m of rels.matchAll(/Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  if (m[2].includes('media/')) idToFile[m[1]] = path.basename(m[2]);
}

function cleanName(raw) {
  return raw
    .replace(/^PHASE 1 LAUNCH PRODUCTS$/i, '')
    .replace(/^[\s:.\-]+/, '')
    .replace(/[\s:.\-]+$/, '')
    .replace(/\beblow\b/i, 'Elbow')
    .replace(/\bls belt eco\b/i, 'LS Belt Eco')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bLs\b/g, 'LS')
    .replace(/\bEco\b/g, 'Eco')
    .replace(/\bWith Thumb\b/i, 'with Thumb');
}

const paras = xml.split(/<w:p[\s>]/).slice(1);
const items = [];
for (const p of paras) {
  const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('');
  const embeds = [...p.matchAll(/r:embed="([^"]+)"/g)].map((x) => x[1]);
  if (texts.trim()) items.push({ type: 'text', value: texts.trim() });
  for (const e of embeds) items.push({ type: 'image', value: idToFile[e] || e });
}

const products = [];
let current = null;
for (const item of items) {
  if (item.type === 'text') {
    const name = cleanName(item.value);
    if (!name) continue;
    if (current) products.push(current);
    current = { name, images: [] };
  } else if (item.type === 'image' && current) {
    current.images.push(item.value);
  }
}
if (current) products.push(current);

console.log(JSON.stringify({ totalImages: items.filter((i) => i.type === 'image').length, products }, null, 2));
