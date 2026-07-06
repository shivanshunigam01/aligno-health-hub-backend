/**
 * Set mrp and sellingPrice for every active product.
 *
 * Usage:
 *   node scripts/set-all-product-prices.js
 *   node scripts/set-all-product-prices.js --price=100
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connect = require('../src/config/db');
const Product = require('../src/models/Product');

const priceArg = process.argv.find((arg) => arg.startsWith('--price='));
const price = priceArg ? Number(priceArg.split('=')[1]) : 100;

async function main() {
  if (!Number.isFinite(price) || price < 0) {
    console.error('Invalid price. Example: node scripts/set-all-product-prices.js --price=100');
    process.exit(1);
  }

  await connect();
  const result = await Product.updateMany(
    { isDeleted: false },
    { $set: { mrp: price, sellingPrice: price, discount: 0 } },
  );
  console.log(`Updated ${result.modifiedCount} product(s) to ₹${price}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
