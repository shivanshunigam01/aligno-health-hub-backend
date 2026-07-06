const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    businessName: String,
    address: String,
    phone: String,
    email: String,
    whatsapp: String,
    hours: String,
    mapLink: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactInfo', contactSchema);
