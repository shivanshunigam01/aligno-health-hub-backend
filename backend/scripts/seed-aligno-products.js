/**
 * Bulk upload Aligno catalog products with images to Cloudinary + MongoDB.
 *
 * Folder structure expected:
 *   scripts/product-images/
 *     abdominal-support/
 *       1.jpg, 2.jpg, 3.jpg ...
 *     ankle-support/
 *       1.jpg, 2.jpg ...
 *     ... (folder name = product slug from aligno-catalog.json)
 *
 * Usage:
 *   node scripts/seed-aligno-products.js
 *   node scripts/seed-aligno-products.js --dry-run
 *   node scripts/seed-aligno-products.js --replace   # delete existing seed products first
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

const IMAGES_ROOT = path.join(__dirname, 'product-images');
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const dryRun = process.argv.includes('--dry-run');
const replace = process.argv.includes('--replace');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uploadImagesForProduct(slug) {
  const dir = path.join(IMAGES_ROOT, slug);
  if (!fs.existsSync(dir)) {
    console.warn(`  ⚠ No image folder: ${dir}`);
    return [];
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort()
    .map((f) => path.join(dir, f));

  const urls = [];
  for (const file of files) {
    if (dryRun) {
      console.log(`  [dry-run] would upload: ${file}`);
      urls.push(`https://placeholder.local/${slug}/${path.basename(file)}`);
      continue;
    }
    const up = await uploadFile(file, `${process.env.CLOUDINARY_FOLDER || 'aligno'}/products/${slug}`);
    urls.push(up.secure_url);
    console.log(`  ✓ uploaded: ${path.basename(file)} → ${up.secure_url}`);
  }
  return urls;
}

async function main() {
  await connect();
  const cat = await Category.findOne({ slug: 'orthopedic-supports', isDeleted: false });
  if (!cat) {
    console.error('Category "orthopedic-supports" not found. Run npm run seed first.');
    process.exit(1);
  }

  if (replace && !dryRun) {
    const slugs = catalog.map((p) => p.slug);
    const deleted = await Product.deleteMany({ slug: { $in: slugs } });
    console.log(`Removed ${deleted.deletedCount} existing catalog products.\n`);
  }

  console.log(`Processing ${catalog.length} Aligno products...\n`);

  for (const item of catalog) {
    console.log(`→ ${item.name} (${item.slug})`);
    const images = await uploadImagesForProduct(item.slug);

    const payload = {
      name: item.name,
      slug: item.slug,
      category: cat._id,
      categorySlug: item.categorySlug,
      bodyPart: item.bodyPart,
      painArea: item.painArea,
      sku: item.sku,
      // Prices left unset (0) — fill in via admin panel when ready
      mrp: item.price ?? 0,
      sellingPrice: item.discountPrice ?? 0,
      stock: item.stock ?? 0,
      sizes: item.sizes,
      shortDescription: item.shortDescription,
      description: item.longDescription,
      benefits: item.benefits,
      specifications: Object.entries(item.specifications || {}).map(([name, value]) => ({ name, value })),
      images: images.map((url, i) => ({ secure_url: url, order: i, isPrimary: i === 0 })),
      isBestSeller: !!item.bestSeller,
      isFeatured: !!item.featured,
      isNewArrival: !!item.newArrival,
      enabled: item.enabled !== false,
      visibility: 'public',
      gst: 5,
    };

    if (dryRun) {
      console.log(`  [dry-run] would save product with ${images.length} image(s)\n`);
      continue;
    }

    const existing = await Product.findOne({ slug: item.slug });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      console.log(`  ✓ updated in MongoDB (${images.length} images)\n`);
    } else {
      await Product.create(payload);
      console.log(`  ✓ created in MongoDB (${images.length} images)\n`);
    }
  }

  console.log('Done!');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
