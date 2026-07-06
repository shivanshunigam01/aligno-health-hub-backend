/**
 * Extract product images from PHASE 1 LAUNCH PRODUCTS.docx into product-images/ folders.
 * Run after placing/updating the docx path below.
 *
 *   node scripts/extract-docx-to-folders.js
 *   node scripts/extract-docx-to-folders.js "C:\path\to\PHASE 1 LAUNCH PRODUCTS.docx"
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCX =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || '', 'Downloads', 'PHASE 1 LAUNCH PRODUCTS.docx');
const EXTRACT = path.join(__dirname, 'docx-extract');
const OUT = path.join(__dirname, 'product-images');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\beblow\b/g, 'elbow')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureExtracted() {
  if (!fs.existsSync(DOCX)) throw new Error(`Docx not found: ${DOCX}`);
  if (fs.existsSync(EXTRACT)) fs.rmSync(EXTRACT, { recursive: true, force: true });
  fs.mkdirSync(EXTRACT, { recursive: true });
  fs.copyFileSync(DOCX, path.join(EXTRACT, 'doc.zip'));
  execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${path.join(EXTRACT, 'doc.zip')}' -DestinationPath '${EXTRACT}' -Force"`, {
    stdio: 'inherit',
  });
}

function parseProducts() {
  const xml = fs.readFileSync(path.join(EXTRACT, 'word/document.xml'), 'utf8');
  const rels = fs.readFileSync(path.join(EXTRACT, 'word/_rels/document.xml.rels'), 'utf8');
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
      .trim()
      .split(/\s+/)
      .map((w, i) => {
        const lower = w.toLowerCase();
        if (lower === 'ls') return 'LS';
        if (lower === 'eco') return 'Eco';
        if (i > 0 && lower === 'with') return 'with';
        if (i > 0 && lower === 'thumb') return 'Thumb';
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  }

  const paras = xml.split(/<w:p[\s>]/).slice(1);
  const products = [];
  let current = null;
  for (const p of paras) {
    const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]).join('');
    const embeds = [...p.matchAll(/r:embed="([^"]+)"/g)].map((x) => x[1]);
    if (texts.trim()) {
      const name = cleanName(texts.trim());
      if (name) {
        if (current) products.push(current);
        current = { name, slug: slugify(name), images: [] };
      }
    }
    for (const e of embeds) {
      if (current && idToFile[e]) current.images.push(idToFile[e]);
    }
  }
  if (current) products.push(current);
  return products;
}

function main() {
  console.log(`Reading: ${DOCX}\n`);
  ensureExtracted();
  const products = parseProducts();
  const mediaDir = path.join(EXTRACT, 'media');

  for (const p of products) {
    const dir = path.join(OUT, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    p.images.forEach((file, i) => {
      const src = path.join(mediaDir, file);
      const ext = path.extname(file) || '.png';
      const dest = path.join(dir, `${i + 1}${ext}`);
      if (!fs.existsSync(src)) {
        console.warn(`  ⚠ missing: ${file}`);
        return;
      }
      fs.copyFileSync(src, dest);
    });
    console.log(`✓ ${p.name} → ${p.slug}/ (${p.images.length} images)`);
  }

  fs.writeFileSync(path.join(__dirname, 'docx-product-map.json'), JSON.stringify(products, null, 2));
  console.log(`\n${products.length} products, ${products.reduce((n, p) => n + p.images.length, 0)} images extracted.`);
}

main();
