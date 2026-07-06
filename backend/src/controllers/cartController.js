const { v4: uuid } = require('uuid');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const api = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

async function getCart(req) {
  const filter = req.user ? { user: req.user._id } : { guestId: req.headers['x-guest-id'] || req.body.guestId };
  if (!req.user && !filter.guestId) {
    filter.guestId = uuid();
    req.generatedGuestId = filter.guestId;
  }
  let cart = await Cart.findOne({ ...filter, isDeleted: false }).populate('items.product coupon');
  if (!cart) cart = await Cart.create(filter);
  return cart;
}

async function recalc(cart) {
  let subtotal = 0;
  let tax = 0;
  for (const i of cart.items) {
    subtotal += i.price * i.quantity;
    tax += ((i.price * i.quantity) * (i.gst || 0)) / 100;
  }
  cart.subtotal = subtotal;
  cart.tax = tax;
  cart.shippingCharge = subtotal >= Number(process.env.SHIPPING_FREE_ABOVE || 999) ? 0 : Number(process.env.SHIPPING_DEFAULT_CHARGE || 79);
  cart.discount = 0;
  if (cart.couponCode) {
    const c = await Coupon.findOne({ code: cart.couponCode, isActive: true, isDeleted: false });
    const now = new Date();
    if (c && subtotal >= (c.minimumAmount || 0) && (!c.expiresAt || c.expiresAt > now) && (!c.startsAt || c.startsAt <= now)) {
      if (!c.usageLimit || c.usedCount < c.usageLimit) {
        let d = c.type === 'percentage' ? subtotal * c.value / 100 : c.value;
        if (c.maximumDiscount) d = Math.min(d, c.maximumDiscount);
        cart.discount = d;
        cart.coupon = c._id;
      }
    }
  }
  // Frontend coupon ALIGNO10 fallback
  if (!cart.discount && cart.couponCode === 'ALIGNO10') cart.discount = Math.round(subtotal * 0.1);
  cart.total = Math.max(0, subtotal + tax + cart.shippingCharge - cart.discount);
  await cart.save();
  return cart.populate('items.product coupon');
}

exports.validate = asyncHandler(async (req, res) => {
  const { items, coupon } = req.body;
  if (!items?.length) throw new AppError('No items to validate', 400);

  let subtotal = 0;
  let tax = 0;
  const rows = [];

  for (const item of items) {
    const p = await Product.findById(item.productId);
    if (!p || p.isDeleted || p.enabled === false || p.visibility !== 'public') throw new AppError(`Product unavailable: ${item.productId}`, 400);
    const qty = Number(item.qty || item.quantity || 1);
    if (p.stock < qty) throw new AppError(`${p.name} has insufficient stock`, 400);
    const line = p.sellingPrice * qty;
    subtotal += line;
    tax += (line * (p.gst || 5)) / 100;
    rows.push({
      productId: p._id,
      qty,
      size: item.size,
      product: p,
      line,
      price: p.sellingPrice,
      mrp: p.mrp,
    });
  }

  const shippingCharge = subtotal >= Number(process.env.SHIPPING_FREE_ABOVE || 999) ? 0 : Number(process.env.SHIPPING_DEFAULT_CHARGE || 79);
  let discount = 0;
  const code = coupon?.toUpperCase();
  if (code) {
    const c = await Coupon.findOne({ code, isActive: true, isDeleted: false });
    if (c && subtotal >= (c.minimumAmount || 0)) {
      discount = c.type === 'percentage' ? Math.round(subtotal * c.value / 100) : c.value;
      if (c.maximumDiscount) discount = Math.min(discount, c.maximumDiscount);
    } else if (code === 'ALIGNO10') {
      discount = Math.round(subtotal * 0.1);
    }
  }

  const gst = Math.round(tax);
  const total = Math.max(0, subtotal - discount + shippingCharge + gst);

  api({
    res,
    message: 'Cart validated',
    data: { rows, subtotal, discount, shipping: shippingCharge, gst, total, coupon: code || null, valid: true },
  });
});

exports.get = asyncHandler(async (req, res) => {
  const cart = await recalc(await getCart(req));
  const data = cart.toObject();
  if (req.generatedGuestId) data.guestId = req.generatedGuestId;
  api({ res, message: 'Cart fetched', data });
});

exports.add = asyncHandler(async (req, res) => {
  const cart = await getCart(req);
  const p = await Product.findById(req.body.product);
  if (!p || p.stock < req.body.quantity) throw new AppError('Product unavailable', 400);
  const it = cart.items.find((i) => String(i.product) === String(p._id));
  if (it) it.quantity += Number(req.body.quantity || 1);
  else cart.items.push({ product: p._id, quantity: Number(req.body.quantity || 1), price: p.sellingPrice, mrp: p.mrp, gst: p.gst });
  api({ res, message: 'Added to cart', data: await recalc(cart) });
});

exports.update = asyncHandler(async (req, res) => {
  const cart = await getCart(req);
  const it = cart.items.find((i) => String(i.product) === req.params.productId);
  if (!it) throw new AppError('Item not found', 404);
  it.quantity = Number(req.body.quantity);
  api({ res, message: 'Cart updated', data: await recalc(cart) });
});

exports.remove = asyncHandler(async (req, res) => {
  const cart = await getCart(req);
  cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
  api({ res, message: 'Item removed', data: await recalc(cart) });
});

exports.clear = asyncHandler(async (req, res) => {
  const cart = await getCart(req);
  cart.items = [];
  cart.couponCode = undefined;
  api({ res, message: 'Cart cleared', data: await recalc(cart) });
});

exports.coupon = asyncHandler(async (req, res) => {
  const cart = await getCart(req);
  cart.couponCode = req.body.code?.toUpperCase();
  api({ res, message: 'Coupon applied', data: await recalc(cart) });
});

exports.merge = asyncHandler(async (req, res) => {
  const guest = await Cart.findOne({ guestId: req.body.guestId });
  const userCart = await getCart(req);
  if (guest) {
    for (const gi of guest.items) {
      const it = userCart.items.find((i) => String(i.product) === String(gi.product));
      if (it) it.quantity += gi.quantity;
      else userCart.items.push(gi);
    }
    guest.isDeleted = true;
    await guest.save();
  }
  api({ res, message: 'Cart merged', data: await recalc(userCart) });
});
