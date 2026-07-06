require('dotenv').config();
const mongoose = require('mongoose');
const connect = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const Setting = require('../models/Setting');
const CmsContent = require('../models/CmsContent');
const FooterContent = require('../models/FooterContent');
const ContactInfo = require('../models/ContactInfo');
const PolicyPage = require('../models/PolicyPage');
const slug = require('../utils/slug');

(async () => {
  await connect();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Banner.deleteMany({}),
    Setting.deleteMany({}),
    CmsContent.deleteMany({}),
    FooterContent.deleteMany({}),
    ContactInfo.deleteMany({}),
    PolicyPage.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@alignohealthhub.com',
    phone: '9999999999',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345',
    role: 'super_admin',
    isEmailVerified: true,
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'customer@alignohealthhub.com',
    phone: '8888888888',
    password: 'Customer@123',
    role: 'customer',
    isEmailVerified: true,
  });

  const cats = await Category.insertMany(
    ['Orthopedic Supports', 'Wellness Essentials', 'Pain Relief', 'Mobility Care'].map((name, i) => ({
      name,
      slug: slug(name),
      sortOrder: i,
      isActive: true,
      seo: { title: name, description: `Buy ${name} at Aligno Health Hub` },
    }))
  );

  const products = [];
  for (let i = 1; i <= 24; i++) {
    const cat = cats[i % cats.length];
    products.push({
      name: `Aligno Premium Orthopedic Product ${i}`,
      slug: slug(`Aligno Premium Orthopedic Product ${i}`),
      shortDescription: 'Premium orthopedic and wellness support product.',
      description: 'Clinically inspired wellness product built for daily comfort, support and recovery.',
      category: cat._id,
      categorySlug: cat.slug,
      brand: 'Aligno',
      sku: `ALN-${String(i).padStart(4, '0')}`,
      tags: ['orthopedic', 'wellness', 'support'],
      benefits: ['Comfortable compression', 'Daily support', 'Easy to use'],
      gst: 5,
      mrp: 999 + i * 50,
      sellingPrice: 799 + i * 45,
      discount: 10,
      stock: 50 + i,
      isFeatured: i <= 6,
      isBestSeller: i <= 8,
      isNewArrival: i <= 4,
      isTrending: i % 3 === 0,
      enabled: true,
      visibility: 'public',
      soldCount: i * 3,
    });
  }
  await Product.insertMany(products);

  await Coupon.insertMany([
    { code: 'ALIGNO10', type: 'percentage', value: 10, minimumAmount: 0, maximumDiscount: 500, isActive: true, description: '10% off all orders' },
    { code: 'WELCOME10', type: 'percentage', value: 10, minimumAmount: 500, maximumDiscount: 200, isActive: true },
    { code: 'FLAT100', type: 'flat', value: 100, minimumAmount: 999, isActive: true },
  ]);

  await Banner.create({ title: 'Aligno Health Hub', subtitle: 'Orthopedic & Wellness Essentials', redirectUrl: '/shop', priority: 1, isActive: true });
  await Setting.insertMany([
    { key: 'website', group: 'website', isPublic: true, value: { name: 'Aligno Health Hub', supportEmail: 'support@alignohealthhub.com' } },
    { key: 'shipping', group: 'shipping', isPublic: true, value: { freeAbove: 999, defaultCharge: 79 } },
  ]);

  await CmsContent.create({
    key: 'homepage',
    topBarText: 'Free shipping on orders above ₹999',
    seoTitle: 'Aligno Health Hub — Orthopedic & Wellness',
    seoDescription: 'Premium orthopedic supports and wellness products.',
  });

  await FooterContent.create({
    key: 'main',
    description: 'Aligno Health Hub — your trusted orthopedic wellness partner.',
    email: 'support@alignohealthhub.com',
    phone: '+91 9999999999',
    copyright: '© 2025 Aligno Health Hub',
  });

  await ContactInfo.create({
    key: 'main',
    businessName: 'Aligno Health Hub',
    email: 'support@alignohealthhub.com',
    phone: '+91 9999999999',
    hours: 'Mon–Sat 9am–6pm',
  });

  await PolicyPage.insertMany([
    { slug: 'privacy', title: 'Privacy Policy', content: 'Your privacy matters to us.' },
    { slug: 'terms', title: 'Terms of Service', content: 'Terms and conditions.' },
    { slug: 'shipping', title: 'Shipping Policy', content: 'Shipping across India.' },
    { slug: 'returns', title: 'Return Policy', content: '7-day return policy.' },
  ]);

  console.log({ admin: admin.email, customer: customer.email, products: products.length });
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

