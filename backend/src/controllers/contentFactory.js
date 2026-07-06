const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const slug = require('../utils/slug');
const { getPagination } = require('../utils/pagination');

function makeCrud(Model, { slugField = 'slug', nameField = 'name', publicFilter = null } = {}) {
  return {
    create: asyncHandler(async (req, res) => {
      const data = { ...req.body };
      if (slugField && data[nameField] && !data[slugField]) data[slugField] = slug(data[nameField]);
      const item = await Model.create(data);
      api({ res, statusCode: 201, message: 'Created successfully', data: item });
    }),
    list: asyncHandler(async (req, res) => {
      const { page, limit, skip } = getPagination(req.query);
      const q = { isDeleted: false };
      if (publicFilter && req.query.admin !== 'true') Object.assign(q, publicFilter(req.query));
      const [items, total] = await Promise.all([
        Model.find(q).sort('order createdAt').skip(skip).limit(limit),
        Model.countDocuments(q),
      ]);
      api({ res, message: 'Fetched successfully', data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }),
    get: asyncHandler(async (req, res) => {
      const isId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
      const q = isId ? { _id: req.params.id } : { [slugField]: req.params.id };
      const item = await Model.findOne({ ...q, isDeleted: false });
      if (!item) throw new AppError('Resource not found', 404);
      api({ res, message: 'Fetched successfully', data: item });
    }),
    update: asyncHandler(async (req, res) => {
      if (req.body[nameField] && !req.body[slugField]) req.body[slugField] = slug(req.body[nameField]);
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) throw new AppError('Resource not found', 404);
      api({ res, message: 'Updated successfully', data: item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() }, { new: true });
      if (!item) throw new AppError('Resource not found', 404);
      api({ res, message: 'Deleted successfully', data: item });
    }),
  };
}

function makeSingleton(Model, defaultKey = 'main') {
  async function getDoc() {
    let doc = await Model.findOne({ key: defaultKey });
    if (!doc) doc = await Model.create({ key: defaultKey });
    return doc;
  }
  return {
    get: asyncHandler(async (req, res) => api({ res, message: 'Fetched successfully', data: await getDoc() })),
    update: asyncHandler(async (req, res) => {
      const doc = await Model.findOneAndUpdate({ key: defaultKey }, req.body, { new: true, upsert: true, runValidators: true });
      api({ res, message: 'Updated successfully', data: doc });
    }),
  };
}

module.exports = { makeCrud, makeSingleton };
