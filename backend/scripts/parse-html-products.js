const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(process.env.USERPROFILE, 'Downloads', 'PHASE 1 LAUNCH PRODUCTS.htm'), 'utf8');

// Product title markers in document order
const titleRe = /(?:<p class=MsoNormal><b><span lang=EN-US>|style='mso-ascii-font-family:\s*Aptos[^>]*'>)([^<]{3,80})/gi;
const pngRe = /PHASE%201%20LAUNCH%20PRODUCTS_files\/(image\d+\.png)/gi;

const chunks = html.split(/(?=<p class=MsoNormal|<span lang=EN-US style='mso-ascii-font-family:Aptos)/i);
const products = [];
let current = null;

function cleanName(raw) {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/^PHASE 1 LAUNCH PRODUCTS$/i, '')
    .replace(/^[\s:.\-]+/, '')
    .replace(/[\s:.\-]+$/, '')
    .replace(/\beblow\b/i, 'Elbow')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => {
      const l = w.toLowerCase();
      if (l === 'ls') return 'LS';
      if (l === 'eco') return 'Eco';
      if (i > 0 && l === 'with') return 'with';
      if (i > 0 && l === 'thumb') return 'Thumb';
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function isProductTitle(text) {
  const t = cleanName(text);
  if (!t || t.length < 4) return false;
  if (/^Phase 1/i.test(t)) return false;
  return /support|collar|belt|sling|wrap|knee|elbow|ankle|abdominal|lumbar|pouch|wrist|tennis|functional|eco|sacral/i.test(t);
}

for (const chunk of chunks) {
  const boldMatch = chunk.match(/<b[^>]*>([\s\S]{0,120}?)<\/b>/i);
  if (boldMatch && isProductTitle(boldMatch[1])) {
    const name = cleanName(boldMatch[1]);
    if (current) products.push(current);
    current = { name, images: [] };
  }
  if (!current) {
    const ab = chunk.match(/- Abdominal support/i);
    if (ab) {
      if (current) products.push(current);
      current = { name: 'Abdominal Support', images: [] };
    }
  }
  if (current) {
    let m;
    const seen = new Set(current.images);
    while ((m = pngRe.exec(chunk)) !== null) {
      if (!seen.has(m[1])) {
        current.images.push(m[1]);
        seen.add(m[1]);
      }
    }
    pngRe.lastIndex = 0;
  }
}
if (current) products.push(current);

console.log(JSON.stringify(products, null, 2));
console.error('Total png:', products.reduce((n, p) => n + p.images.length, 0));
