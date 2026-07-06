const Product = require('../models/Product');
const Category = require('../models/Category');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const slug = require('../utils/slug');
const { getPagination } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../utils/cloudinary');
const fs = require('fs');

exports.create = asyncHandler(async (req, res) => {
  const s = slug(req.body.slug || req.body.name);
  const data = { ...req.body, slug: s };
  if (req.body.category && !req.body.categorySlug) {
    const cat = await Category.findById(req.body.category);
    if (cat) data.categorySlug = cat.slug;
  }
  const p = await Product.create(data);
  api({ res, statusCode: 201, message: 'Product created', data: p });
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const q = { isDeleted: false, enabled: { $ne: false } };
  if (req.query.admin !== 'true') q.visibility = 'public';
  else if (req.query.visibility) q.visibility = req.query.visibility;

  if (req.query.category) {
    const cat = await Category.findOne({ $or: [{ slug: req.query.category }, { _id: req.query.category }] });
    if (cat) q.category = cat._id;
  }
  if (req.query.categorySlug) q.categorySlug = req.query.categorySlug;
  if (req.query.bodyPart) q.bodyPart = req.query.bodyPart;
  if (req.query.painArea) q.painArea = req.query.painArea;
  if (req.query.activity) q.activity = req.query.activity;
  if (req.query.brand) q.brand = req.query.brand;
  if (req.query.bestSeller === 'true') q.isBestSeller = true;
  if (req.query.featured === 'true') q.isFeatured = true;
  if (req.query.newArrival === 'true') q.isNewArrival = true;
  if (req.query.stock === 'in_stock') q.stock = { $gt: 0 };
  if (req.query.minPrice || req.query.maxPrice)
    q.sellingPrice = { $gte: Number(req.query.minPrice || 0), $lte: Number(req.query.maxPrice || 999999999) };
  if (req.query.search) q.$text = { $search: req.query.search };

  const sortMap = {
    price_asc: 'sellingPrice',
    price_desc: '-sellingPrice',
    rating: '-ratingAverage',
    newest: '-createdAt',
  };
  const sort = sortMap[req.query.sort] || req.query.sort || '-createdAt';

  const [items, total] = await Promise.all([
    Product.find(q).populate('category relatedProducts').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(q),
  ]);
  api({ res, message: 'Products fetched', data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.get = asyncHandler(async (req, res) => {
  const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const q = isId ? { _id: req.params.id } : { slug: req.params.id };
  const p = await Product.findOne({ ...q, isDeleted: false }).populate('category relatedProducts');
  if (!p) throw new AppError('Product not found', 404);
  api({ res, message: 'Product fetched', data: p });
});

exports.update = asyncHandler(async (req, res) => {
  if (req.body.name && !req.body.slug) req.body.slug = slug(req.body.name);
  if (req.body.category) {
    const cat = await Category.findById(req.body.category);
    if (cat) req.body.categorySlug = cat.slug;
  }
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  api({ res, message: 'Product updated', data: p });
});

exports.remove = asyncHandler(async (req, res) =>
  api({ res, message: 'Product deleted', data: await Product.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true }) })
);

exports.restore = asyncHandler(async (req, res) =>
  api({ res, message: 'Product restored', data: await Product.findByIdAndUpdate(req.params.id, { isDeleted: false, deletedAt: null }, { new: true }) })
);

exports.uploadImages = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new AppError('Product not found', 404);
  for (const file of req.files || []) {
    const up = await uploadFile(file.path, process.env.CLOUDINARY_FOLDER || 'aligno/products');
    p.images.push({ secure_url: up.secure_url, public_id: up.public_id, alt: req.body.alt || p.name, order: p.images.length, isPrimary: p.images.length === 0 });
    fs.unlinkSync(file.path);
  }
  await p.save();
  api({ res, message: 'Images uploaded', data: p.images });
});

exports.deleteImage = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new AppError('Product not found', 404);
  const publicId = req.body.public_id;
  if (!publicId) throw new AppError('public_id required', 400);
  await deleteFile(publicId);
  p.images = p.images.filter((i) => i.public_id !== publicId);
  await p.save();
  api({ res, message: 'Image deleted', data: p.images });
});

exports.featured = asyncHandler(async (req, res) =>
  api({ res, message: 'Featured products', data: await Product.find({ isFeatured: true, isDeleted: false, visibility: 'public', enabled: { $ne: false } }).limit(20) })
);

exports.trending = asyncHandler(async (req, res) =>
  api({ res, message: 'Trending products', data: await Product.find({ isTrending: true, isDeleted: false, visibility: 'public', enabled: { $ne: false } }).limit(20) })
);

exports.bestSellers = asyncHandler(async (req, res) =>
  api({ res, message: 'Best sellers', data: await Product.find({ isDeleted: false, visibility: 'public', enabled: { $ne: false } }).sort('-soldCount').limit(20) })
);

exports.latest = asyncHandler(async (req, res) =>
  api({ res, message: 'Latest products', data: await Product.find({ isDeleted: false, visibility: 'public', enabled: { $ne: false } }).sort('-createdAt').limit(20) })
);

exports.autocomplete = asyncHandler(async (req, res) =>
  api({
    res,
    message: 'Suggestions',
    data: await Product.find({ $text: { $search: req.query.q || '' }, isDeleted: false })
      .select('name slug images sellingPrice mrp')
      .limit(10),
  })
);
