const r = require('express').Router();
const c = require('../controllers/orderController');
const { protect, adminOnly, optionalAuth } = require('../middlewares/auth');

r.get('/track/:orderNo', c.track);
r.post('/guest', optionalAuth, c.guestCheckout);
r.use(protect);
r.post('/', c.create);
r.get('/my', c.my);
r.get('/', adminOnly, c.list);
r.get('/:id', c.get);
r.patch('/:id/status', adminOnly, c.status);
r.patch('/:id/cancel', c.cancel);
r.patch('/:id/return', c.return);

module.exports = r;
