/**
 * Import PHASE 1 products from HTML export folder → Cloudinary + MongoDB.
 *
 *   node scripts/import-phase1-products.js
 *   node scripts/import-phase1-products.js --replace
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connect = require('../src/config/db');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const { uploadFile } = require('../src/utils/cloudinary');
const catalog = require('./aligno-catalog.json');

const SOURCE = path.join(process.env.USERPROFILE || '', 'Downloads', 'PHASE 1 LAUNCH PRODUCTS_files');
const replace = process.argv.includes('--replace');

// Sequential PNG mapping (37 images, odd-numbered exports from Word HTML)
const IMAGE_MAP = {
  'abdominal-support': ['image001.png', 'image003.png', 'image005.png', 'image007.png'],
  'ankle-support': ['image009.png', 'image011.png', 'image013.png'],
  'cervical-collar': ['image015.png', 'image017.png', 'image019.png'],
  'contoured-ls-support-belt': ['image021.png', 'image023.png', 'image025.png'],
  'elbow-support': ['image027.png', 'image029.png', 'image031.png'],
  'functional-knee-support': ['image033.png', 'image035.png', 'image037.png'],
  'knee-support': ['image039.png', 'image041.png', 'image043.png'],
  'ls-belt-eco': ['image045.png', 'image047.png'],
  'lumbar-sacral-support-belt': ['image049.png', 'image051.png', 'image053.png'],
  'pouch-arm-sling': ['image055.png', 'image057.png'],
  'tennis-elbow-support': ['image059.png', 'image061.png'],
  'wrist-wrap': ['image063.png', 'image065.png'],
  'wrist-wrap-with-thumb': ['image067.png', 'image069.png', 'image071.png', 'image073.png'],
};

async function uploadProductImages(slug, files) {
  const urls = [];
  for (const file of files) {
    const full = path.join(SOURCE, file);
    if (!fs.existsSync(full)) throw new Error(`Missing image: ${full}`);
    const folder = `${process.env.CLOUDINARY_FOLDER || 'aligno'}/products/${slug}`;
    const up = await uploadFile(full, folder);
    urls.push({ secure_url: up.secure_url, public_id: up.public_id });
    console.log(`  ✓ ${file} → Cloudinary`);
  }
  return urls;
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source folder not found: ${SOURCE}`);
    process.exit(1);
  }

  await connect();
  const cat = await Category.findOne({ slug: 'orthopedic-supports', isDeleted: false });
  if (!cat) {
    console.error('Category "orthopedic-supports" not found. Run: npm run seed');
    process.exit(1);
  }

  const slugs = catalog.map((p) => p.slug);
  if (replace) {
    const deleted = await Product.deleteMany({ slug: { $in: slugs } });
    console.log(`Removed ${deleted.deletedCount} existing Phase 1 products.\n`);
  }

  console.log(`Importing ${catalog.length} products from:\n  ${SOURCE}\n`);

  for (const item of catalog) {
    const files = IMAGE_MAP[item.slug];
    if (!files?.length) {
      console.warn(`⚠ No image map for ${item.slug}`);
      continue;
    }

    console.log(`→ ${item.name} (${files.length} images)`);
    const uploaded = await uploadProductImages(item.slug, files);

    const payload = {
      name: item.name,
      slug: item.slug,
      category: cat._id,
      categorySlug: item.categorySlug,
      bodyPart: item.bodyPart,
      painArea: item.painArea,
      sku: item.sku,
      mrp: 0,
      sellingPrice: 0,
      stock: item.stock ?? 0,
      sizes: item.sizes,
      shortDescription: item.shortDescription,
      description: item.longDescription,
      benefits: item.benefits,
      specifications: Object.entries(item.specifications || {}).map(([name, value]) => ({ name, value })),
      images: uploaded.map((img, i) => ({
        secure_url: img.secure_url,
        public_id: img.public_id,
        order: i,
        isPrimary: i === 0,
      })),
      isBestSeller: !!item.bestSeller,
      isFeatured: !!item.featured,
      isNewArrival: !!item.newArrival,
      enabled: true,
      visibility: 'public',
      gst: 5,
    };

    const existing = await Product.findOne({ slug: item.slug });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      console.log(`  ✓ updated in database\n`);
    } else {
      await Product.create(payload);
      console.log(`  ✓ created in database\n`);
    }
  }

  const count = await Product.countDocuments({
    slug: { $in: slugs },
    enabled: true,
    visibility: 'public',
    isDeleted: false,
  });
  console.log(`Done! ${count} Phase 1 products live in shop.`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
