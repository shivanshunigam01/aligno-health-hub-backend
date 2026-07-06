const r = require('express').Router();
const generic = require('./genericRoutes');
const gc = require('../controllers/genericControllers');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const Setting = require('../models/Setting');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { protect, adminOnly } = require('../middlewares/auth');

r.get('/health', (req, res) =>
  res.json({
    success: true,
    message: 'Aligno Health Hub API is running',
    data: { uptime: process.uptime(), version: '1.0.0' },
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  })
);

r.use('/auth', require('./authRoutes'));
r.use('/products', require('./productRoutes'));
r.use('/categories', require('./categoryRoutes'));
r.use('/cart', require('./cartRoutes'));
r.use('/wishlist', require('./wishlistRoutes'));
r.use('/addresses', require('./addressRoutes'));
r.use('/orders', require('./orderRoutes'));
r.use('/payments', require('./paymentRoutes'));
r.use('/reviews', require('./reviewRoutes'));
r.use('/users', require('./userRoutes'));
r.use('/admin', require('./adminRoutes'));
r.use('/', require('./contentRoutes'));

// Coupons — public validate only via cart; list is admin-only
const couponCtrl = gc(Coupon);
r.get('/coupons/validate/:code', asyncHandler(async (req, res) => {
  const c = await Coupon.findOne({ code: req.params.code.toUpperCase(), isActive: true, isDeleted: false });
  api({ res, message: c ? 'Coupon valid' : 'Coupon invalid', data: { valid: !!c, coupon: c } });
}));
r.get('/coupons', protect, adminOnly, couponCtrl.list);
r.get('/coupons/:id', protect, adminOnly, couponCtrl.get);
r.post('/coupons', protect, adminOnly, require('../validators/commonValidator').coupon, require('../middlewares/validate'), couponCtrl.create);
r.patch('/coupons/:id', protect, adminOnly, couponCtrl.update);
r.delete('/coupons/:id', protect, adminOnly, couponCtrl.remove);

// Banners — public list, admin write
const bannerCtrl = gc(Banner);
r.get('/banners', bannerCtrl.list);
r.get('/banners/:id', bannerCtrl.get);
r.post('/banners', protect, adminOnly, bannerCtrl.create);
r.patch('/banners/:id', protect, adminOnly, bannerCtrl.update);
r.delete('/banners/:id', protect, adminOnly, bannerCtrl.remove);

// Settings — public only isPublic=true entries
const settingCtrl = gc(Setting);
r.get('/settings', asyncHandler(async (req, res) => {
  const q = { isDeleted: false };
  if (!req.headers.authorization && !req.cookies?.accessToken) q.isPublic = true;
  const items = await Setting.find(q);
  api({ res, message: 'Settings fetched', data: items });
}));
r.get('/settings/:id', protect, adminOnly, settingCtrl.get);
r.post('/settings', protect, adminOnly, settingCtrl.create);
r.patch('/settings/:id', protect, adminOnly, settingCtrl.update);
r.delete('/settings/:id', protect, adminOnly, settingCtrl.remove);

module.exports = r;
