const r = require('express').Router();
const c = require('../controllers/paymentController');
const { protect, adminOnly, optionalAuth } = require('../middlewares/auth');

r.post('/webhook', c.webhook);
r.post('/razorpay/create-order', optionalAuth, c.createRazorpayFromCart);
r.use(protect);
r.post('/razorpay/order', c.createRazorpayOrder);
r.post('/verify', c.verify);
r.get('/history', c.history);
r.get('/', adminOnly, c.list);
r.post('/:id/refund', adminOnly, c.refund);

module.exports = r;
