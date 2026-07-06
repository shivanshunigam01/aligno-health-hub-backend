const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'homepage', unique: true },
    topBarText: String,
    heroVisible: { type: Boolean, default: true },
    trustStripVisible: { type: Boolean, default: true },
    categoriesVisible: { type: Boolean, default: true },
    painAreaVisible: { type: Boolean, default: true },
    bestSellersVisible: { type: Boolean, default: true },
    postersVisible: { type: Boolean, default: true },
    activityVisible: { type: Boolean, default: true },
    brandBannerVisible: { type: Boolean, default: true },
    brandRangeVisible: { type: Boolean, default: true },
    testimonialsVisible: { type: Boolean, default: true },
    blogsVisible: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('CmsContent', cmsSchema);
