const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    content: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PolicyPage', policySchema);
