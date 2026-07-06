const mongoose = require('mongoose');
const softDelete = { isDeleted: { type: Boolean, default: false, index: true }, deletedAt: Date };

const taxonomySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: { secure_url: String, public_id: String },
    marker: { x: Number, y: Number },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true, index: true },
    ...softDelete,
  },
  { timestamps: true }
);

module.exports = {
  BodyPart: mongoose.model('BodyPart', taxonomySchema),
  PainArea: mongoose.model('PainArea', taxonomySchema),
  Activity: mongoose.model('Activity', taxonomySchema),
};
