const r = require('express').Router();
const c = require('../controllers/cartController');
const { protect, optionalAuth } = require('../middlewares/auth');

r.post('/validate', optionalAuth, c.validate);
r.get('/', c.get);
r.post('/items', c.add);
r.patch('/items/:productId', c.update);
r.delete('/items/:productId', c.remove);
r.delete('/', c.clear);
r.post('/coupon', c.coupon);
r.post('/merge', protect, c.merge);

module.exports = r;
