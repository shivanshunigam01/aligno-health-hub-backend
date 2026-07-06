/**
 * Upload hero banner creatives to Cloudinary and seed MongoDB.
 *
 * Usage:
 *   node scripts/seed-hero-banners.js
 *   node scripts/seed-hero-banners.js --dry-run
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connect = require('../src/config/db');
const Banner = require('../src/models/Banner');
const CmsContent = require('../src/models/CmsContent');
const { uploadFile } = require('../src/utils/cloudinary');

const dryRun = process.argv.includes('--dry-run');
const ASSETS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor/projects/c-Users-Shivanshu-Desktop-new-aligno/assets',
);
const FE_IMG_DIR = path.join(__dirname, '../../../../fe/aligno-health-hub-b8d03db3/public/img');

const BANNERS = [
  {
    slug: 'move-freely',
    title: 'MOVE FREELY. LIVE COMFORTABLY.',
    subtitle: 'Premium orthopedic wellness and support products designed to keep you active, confident, and pain-free.',
    ctaText: 'Shop Collection',
    redirectUrl: '/shop',
    priority: 1,
    assetName:
      'c__Users_Shivanshu_AppData_Roaming_Cursor_User_workspaceStorage_051a62214db6c93873087edb9e5c5dcf_images_ChatGPT_Image_Jul_6__2026__02_53_10_PM-ff474739-2ba2-411f-95fc-d3399ad7e8b5.png',
    localName: 'banner-move-freely.png',
  },
  {
    slug: 'posture',
    title: 'BETTER POSTURE. BETTER PERFORMANCE.',
    subtitle: 'Ergonomic comfort solutions for IT & corporate professionals.',
    ctaText: 'Shop Now',
    redirectUrl: '/shop',
    priority: 2,
    assetName:
      'c__Users_Shivanshu_AppData_Roaming_Cursor_User_workspaceStorage_051a62214db6c93873087edb9e5c5dcf_images_ChatGPT_Image_Jul_6__2026__03_06_07_PM-6eb7a01f-e2a9-473e-afe6-78b7d0ff3b4c.png',
    localName: 'banner-posture.png',
  },
  {
    slug: 'active-living',
    title: 'ADVENTURE STARTS HERE.',
    subtitle: 'Support that moves with you — from trails to everyday life.',
    ctaText: 'Shop Now',
    redirectUrl: '/shop',
    priority: 3,
    assetName:
      'c__Users_Shivanshu_AppData_Roaming_Cursor_User_workspaceStorage_051a62214db6c93873087edb9e5c5dcf_images_ChatGPT_Image_Jul_6__2026__03_20_01_PM-e97829e4-fb4b-48d6-a72c-dba867237c56.png',
    localName: 'banner-active-living.png',
  },
];

function resolveSourcePath(banner) {
  const assetPath = path.join(ASSETS_DIR, banner.assetName);
  if (fs.existsSync(assetPath)) return assetPath;
  const localPath = path.join(FE_IMG_DIR, banner.localName);
  if (fs.existsSync(localPath)) return localPath;
  throw new Error(`Image not found for ${banner.slug}`);
}

async function main() {
  await connect();

  if (!dryRun) {
    await Banner.updateMany({ placement: 'home', isDeleted: false }, { isDeleted: true, deletedAt: new Date() });
    await CmsContent.findOneAndUpdate({ key: 'homepage' }, { heroVisible: true }, { upsert: true });
  }

  for (const banner of BANNERS) {
    const source = resolveSourcePath(banner);
    const localTarget = path.join(FE_IMG_DIR, banner.localName);
    if (!fs.existsSync(localTarget)) {
      fs.mkdirSync(FE_IMG_DIR, { recursive: true });
      fs.copyFileSync(source, localTarget);
      console.log(`✓ copied to ${banner.localName}`);
    }

    let image = { secure_url: '', public_id: '' };
    if (dryRun) {
      console.log(`[dry-run] would upload ${source}`);
      image.secure_url = `https://placeholder.local/${banner.slug}.png`;
    } else {
      const uploaded = await uploadFile(source, `${process.env.CLOUDINARY_FOLDER || 'aligno'}/banners/${banner.slug}`);
      image = uploaded;
      console.log(`✓ uploaded ${banner.slug} → ${uploaded.secure_url}`);
    }

    const payload = {
      title: banner.title,
      subtitle: banner.subtitle,
      ctaText: banner.ctaText,
      layout: 'designed',
      image,
      redirectUrl: banner.redirectUrl,
      priority: banner.priority,
      placement: 'home',
      isActive: true,
      isDeleted: false,
      deletedAt: null,
    };

    if (dryRun) {
      console.log(`[dry-run] would save banner: ${banner.title}`);
      continue;
    }

    await Banner.create(payload);
    console.log(`✓ saved banner: ${banner.title}`);
  }

  console.log('\nDone! Hero banners are live.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
