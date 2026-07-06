const mongoose = require('mongoose');
const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const posterSchema = new mongoose.Schema(
  {
    title: String,
    ctaText: String,
    ctaLink: String,
    image: { secure_url: String, public_id: String },
    enabled: { type: Boolean, default: true, index: true },
    ...softDelete,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poster', posterSchema);
