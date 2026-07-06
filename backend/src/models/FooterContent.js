const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    description: String,
    address: String,
    email: String,
    phone: String,
    whatsapp: String,
    newsletterText: String,
    copyright: String,
    social: {
      facebook: String,
      instagram: String,
      youtube: String,
      linkedin: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FooterContent', footerSchema);
