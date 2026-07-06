const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.list = asyncHandler(async (req, res) => api({ res, message: 'Addresses fetched', data: req.user.addresses }));

exports.add = asyncHandler(async (req, res) => {
  if (req.body.isDefault) req.user.addresses.forEach((a) => (a.isDefault = false));
  req.user.addresses.push(req.body);
  await req.user.save();
  api({ res, statusCode: 201, message: 'Address added', data: req.user.addresses });
});

exports.update = asyncHandler(async (req, res) => {
  const a = req.user.addresses.id(req.params.id);
  if (!a) throw new AppError('Address not found', 404);
  Object.assign(a, req.body);
  if (req.body.isDefault) req.user.addresses.forEach((x) => { if (String(x._id) !== req.params.id) x.isDefault = false; });
  await req.user.save();
  api({ res, message: 'Address updated', data: req.user.addresses });
});

exports.remove = asyncHandler(async (req, res) => {
  req.user.addresses.pull(req.params.id);
  await req.user.save();
  api({ res, message: 'Address removed', data: req.user.addresses });
});

exports.default = asyncHandler(async (req, res) => {
  req.user.addresses.forEach((a) => (a.isDefault = String(a._id) === req.params.id));
  await req.user.save();
  api({ res, message: 'Default address updated', data: req.user.addresses });
});
