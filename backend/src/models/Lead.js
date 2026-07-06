const mongoose = require('mongoose');
const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: String,
    message: String,
    source: { type: String, enum: ['contact', 'newsletter', 'inquiry'], default: 'contact', index: true },
    status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Closed'], default: 'New', index: true },
    notes: String,
    ...softDelete,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
