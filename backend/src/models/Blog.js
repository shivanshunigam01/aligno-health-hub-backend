const mongoose = require('mongoose');
const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: String,
    content: String,
    image: { secure_url: String, public_id: String },
    author: String,
    date: { type: Date, default: Date.now },
    seoTitle: String,
    seoDescription: String,
    published: { type: Boolean, default: false, index: true },
    ...softDelete,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
