const mongoose = require('mongoose');

const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const testimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true, trim: true },
    image: { secure_url: String, public_id: String },
    approved: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    date: { type: Date, default: Date.now },
    sortOrder: { type: Number, default: 0, index: true },
    order: { type: Number, default: 0, index: true },
    ...softDelete,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
