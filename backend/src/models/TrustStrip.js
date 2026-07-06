const mongoose = require('mongoose');
const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const trustStripSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    icon: String,
    image: { secure_url: String, public_id: String },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true, index: true },
    ...softDelete,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrustStrip', trustStripSchema);
