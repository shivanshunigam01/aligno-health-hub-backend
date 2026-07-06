const Category = require('../models/Category');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const slug = require('../utils/slug');
const { uploadFile, deleteFile } = require('../utils/cloudinary');
const fs = require('fs');

exports.create = asyncHandler(async (req, res) => {
  let ancestors = [];
  if (req.body.parent) {
    const p = await Category.findById(req.body.parent);
    ancestors = [...(p?.ancestors || []), p._id];
  }
  const c = await Category.create({ ...req.body, slug: slug(req.body.slug || req.body.name), ancestors });
  api({ res, statusCode: 201, message: 'Category created', data: c });
});

exports.list = asyncHandler(async (req, res) => {
  const q = { isDeleted: false };
  if (req.query.enabled === 'true') q.isActive = true;
  api({ res, message: 'Categories fetched', data: await Category.find(q).populate('parent children').sort('sortOrder name') });
});

exports.get = asyncHandler(async (req, res) => {
  const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const q = isId ? { _id: req.params.id } : { slug: req.params.id };
  const c = await Category.findOne({ ...q, isDeleted: false }).populate('parent children');
  if (!c) throw new AppError('Category not found', 404);
  api({ res, message: 'Category fetched', data: c });
});

exports.update = asyncHandler(async (req, res) => {
  if (req.body.name && !req.body.slug) req.body.slug = slug(req.body.name);
  api({ res, message: 'Category updated', data: await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }) });
});

exports.remove = asyncHandler(async (req, res) =>
  api({ res, message: 'Category deleted', data: await Category.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true }) })
);

exports.restore = asyncHandler(async (req, res) =>
  api({ res, message: 'Category restored', data: await Category.findByIdAndUpdate(req.params.id, { isDeleted: false, deletedAt: null }, { new: true }) })
);

exports.uploadImage = asyncHandler(async (req, res) => {
  const c = await Category.findById(req.params.id);
  if (c.image?.public_id) await deleteFile(c.image.public_id);
  const up = await uploadFile(req.file.path, process.env.CLOUDINARY_FOLDER || 'aligno/categories');
  c.image = { secure_url: up.secure_url, public_id: up.public_id };
  fs.unlinkSync(req.file.path);
  await c.save();
  api({ res, message: 'Category image uploaded', data: c });
});
