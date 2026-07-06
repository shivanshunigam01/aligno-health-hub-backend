const fs = require('fs');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { uploadFile, deleteFile } = require('../utils/cloudinary');

exports.upload = asyncHandler(async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) throw new AppError('No file uploaded', 400);

  const folder = req.query.folder || process.env.CLOUDINARY_FOLDER || 'aligno';
  const uploads = [];
  for (const file of files) {
    const up = await uploadFile(file.path, folder);
    uploads.push({ url: up.secure_url, secure_url: up.secure_url, publicId: up.public_id, public_id: up.public_id });
    fs.unlinkSync(file.path);
  }

  api({
    res,
    message: 'Upload successful',
    data: uploads.length === 1 ? uploads[0] : { urls: uploads.map((u) => u.url), publicIds: uploads.map((u) => u.publicId), items: uploads },
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await deleteFile(publicId);
  api({ res, message: 'Image deleted', data: { publicId } });
});
