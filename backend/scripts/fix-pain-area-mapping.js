/**
 * Fix painArea slugs on Phase 1 products + seed pain area taxonomy in MongoDB.
 *   node scripts/fix-pain-area-mapping.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connect = require('../src/config/db');
const Product = require('../src/models/Product');
const { PainArea } = require('../src/models/Taxonomy');

const SLUG_TO_PAIN = {
  'abdominal-support': 'back',
  'ankle-support': 'ankle',
  'cervical-collar': 'neck',
  'contoured-ls-support-belt': 'back',
  'elbow-support': 'elbow',
  'functional-knee-support': 'knee',
  'knee-support': 'knee',
  'ls-belt-eco': 'back',
  'lumbar-sacral-support-belt': 'back',
  'pouch-arm-sling': 'shoulder',
  'tennis-elbow-support': 'elbow',
  'wrist-wrap': 'wrist',
  'wrist-wrap-with-thumb': 'wrist',
};

const PAIN_AREAS = [
  { name: 'Neck Pain', slug: 'neck', order: 1 },
  { name: 'Shoulder Pain', slug: 'shoulder', order: 2 },
  { name: 'Back Pain', slug: 'back', order: 3 },
  { name: 'Elbow Pain', slug: 'elbow', order: 4 },
  { name: 'Wrist Pain', slug: 'wrist', order: 5 },
  { name: 'Hand Pain', slug: 'hand', order: 6 },
  { name: 'Knee Pain', slug: 'knee', order: 7 },
  { name: 'Calf Pain', slug: 'calf', order: 8 },
  { name: 'Ankle Pain', slug: 'ankle', order: 9 },
  { name: 'Foot Pain', slug: 'foot', order: 10 },
];

async function main() {
  await connect();

  for (const [slug, painArea] of Object.entries(SLUG_TO_PAIN)) {
    const r = await Product.updateOne({ slug }, { $set: { painArea } });
    if (r.matchedCount) console.log(`✓ ${slug} → painArea: ${painArea}`);
  }

  for (const pa of PAIN_AREAS) {
    await PainArea.findOneAndUpdate(
      { slug: pa.slug },
      { $set: { name: pa.name, slug: pa.slug, order: pa.order, enabled: true, isDeleted: false } },
      { upsert: true, new: true },
    );
  }
  console.log(`✓ ${PAIN_AREAS.length} pain areas in database`);

  console.log('\nProducts per pain area:');
  for (const pa of PAIN_AREAS) {
    const n = await Product.countDocuments({ painArea: pa.slug, enabled: true, isDeleted: false, visibility: 'public' });
    if (n) console.log(`  ${pa.name} (${pa.slug}): ${n} product(s)`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
